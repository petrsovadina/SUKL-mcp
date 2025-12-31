"""
CSV-based klient pro SÚKL Open Data.

Načítá data z DLP CSV souborů a poskytuje in-memory vyhledávání.
"""

import asyncio
import logging
import os
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import httpx
import pandas as pd
from pydantic import BaseModel, Field

# Absolutní import pro FastMCP Cloud compatibility
from sukl_mcp.exceptions import SUKLValidationError, SUKLZipBombError

logger = logging.getLogger(__name__)


def _get_opendata_url() -> str:
    """Get SÚKL Open Data URL from ENV or default."""
    return os.getenv(
        "SUKL_OPENDATA_URL",
        "https://opendata.sukl.cz/soubory/SOD20251223/DLP20251223.zip",
    )


def _get_cache_dir() -> Path:
    """Get cache directory from ENV or default."""
    return Path(os.getenv("SUKL_CACHE_DIR", "/tmp/sukl_dlp_cache"))


def _get_data_dir() -> Path:
    """Get data directory from ENV or default."""
    return Path(os.getenv("SUKL_DATA_DIR", "/tmp/sukl_dlp_data"))


def _get_download_timeout() -> float:
    """Get download timeout from ENV or default."""
    return float(os.getenv("SUKL_DOWNLOAD_TIMEOUT", "120.0"))


class SUKLConfig(BaseModel):
    """Konfigurace SÚKL klienta (konfigurovatelné přes ENV)."""

    # Open Data URL
    opendata_dlp_url: str = Field(default_factory=_get_opendata_url)

    # Local cache
    cache_dir: Path = Field(default_factory=_get_cache_dir)
    data_dir: Path = Field(default_factory=_get_data_dir)

    # Download timeout
    download_timeout: float = Field(default_factory=_get_download_timeout)


class SUKLDataLoader:
    """Loader pro SÚKL CSV data."""

    def __init__(self, config: Optional[SUKLConfig] = None):
        self.config = config or SUKLConfig()
        self._data: dict[str, pd.DataFrame] = {}
        self._loaded = False

    async def load_data(self) -> None:
        """Stáhni a načti DLP data."""
        if self._loaded:
            logger.info("Data již načtena")
            return

        logger.info("Načítám SÚKL DLP data...")

        # Vytvořím adresáře
        self.config.cache_dir.mkdir(parents=True, exist_ok=True)
        self.config.data_dir.mkdir(parents=True, exist_ok=True)

        # Stáhni ZIP pokud neexistuje
        zip_path = self.config.cache_dir / "DLP.zip"
        if not zip_path.exists():
            await self._download_zip(zip_path)

        # Rozbal ZIP
        if not (self.config.data_dir / "dlp_lecivepripravky.csv").exists():
            await self._extract_zip(zip_path)

        # Načti klíčové CSV soubory
        await self._load_csvs()

        self._loaded = True
        logger.info(f"Data načtena: {len(self._data)} tabulek")

    async def _download_zip(self, zip_path: Path) -> None:
        """Stáhni DLP ZIP soubor."""
        logger.info(f"Stahuji {self.config.opendata_dlp_url}...")

        async with httpx.AsyncClient(timeout=self.config.download_timeout) as client:
            async with client.stream("GET", self.config.opendata_dlp_url) as resp:
                resp.raise_for_status()

                with open(zip_path, "wb") as f:
                    async for chunk in resp.aiter_bytes(chunk_size=8192):
                        f.write(chunk)

        logger.info(f"Staženo: {zip_path} ({zip_path.stat().st_size / 1024 / 1024:.1f} MB)")

    async def _extract_zip(self, zip_path: Path) -> None:
        """Rozbal ZIP soubor (async přes executor + ZIP bomb protection)."""
        logger.info(f"Rozbaluji {zip_path}...")

        def _sync_extract():
            """Synchronní extrakce s bezpečnostní kontrolou."""
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                # ZIP bomb protection - kontrola celkové velikosti
                total_size = sum(info.file_size for info in zip_ref.infolist())
                max_size = 5 * 1024 * 1024 * 1024  # 5 GB
                if total_size > max_size:
                    raise SUKLZipBombError(
                        f"ZIP příliš velký: {total_size / 1024 / 1024:.1f} MB "
                        f"(maximum: {max_size / 1024 / 1024:.1f} MB)"
                    )

                zip_ref.extractall(self.config.data_dir)

        # Spusť v executoru aby neblokovala event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _sync_extract)

        logger.info(f"Rozbaleno do {self.config.data_dir}")

    async def _load_csvs(self) -> None:
        """Načti CSV soubory paralelně do pandas DataFrames."""
        logger.info("Načítám CSV soubory...")

        # Klíčové tabulky
        tables = [
            "dlp_lecivepripravky",  # Hlavní tabulka léčiv
            "dlp_slozeni",  # Složení
            "dlp_lecivelatky",  # Léčivé látky
            "dlp_atc",  # ATC kódy
            "dlp_nazvydokumentu",  # Dokumenty (PIL)
            "dlp_cau",  # Cenové a úhradové údaje (EPIC 3)
        ]

        def _load_single_csv(table: str) -> tuple[str, Optional[pd.DataFrame]]:
            """Načti jeden CSV soubor (synchronní funkce pro executor)."""
            csv_path = self.config.data_dir / f"{table}.csv"
            if not csv_path.exists():
                return (table, None)

            df = pd.read_csv(csv_path, sep=";", encoding="cp1250", low_memory=False)
            return (table, df)

        # Paralelní načítání všech CSV souborů
        loop = asyncio.get_event_loop()
        results = await asyncio.gather(
            *[loop.run_in_executor(None, _load_single_csv, t) for t in tables]
        )

        # Uložení načtených dat a logování
        for table, df in results:
            if df is not None:
                self._data[table] = df
                logger.info(f"  ✓ {table}: {len(df)} záznamů")
            else:
                logger.warning(f"  ✗ {table}: soubor nenalezen")

    def get_table(self, name: str) -> Optional[pd.DataFrame]:
        """Získej DataFrame tabulky."""
        return self._data.get(name)


class SUKLClient:
    """Async klient pro SÚKL CSV data."""

    def __init__(self, config: Optional[SUKLConfig] = None):
        self.config = config or SUKLConfig()
        self._loader = SUKLDataLoader(config)
        self._initialized = False

    async def initialize(self) -> None:
        """Inicializuj klienta a načti data."""
        if self._initialized:
            return

        logger.info("Inicializuji SÚKL klienta...")
        await self._loader.load_data()
        self._initialized = True

    async def health_check(self) -> dict[str, Any]:
        """Health check."""
        return {
            "status": "ok" if self._initialized else "not_initialized",
            "tables_loaded": len(self._loader._data),
            "timestamp": datetime.now().isoformat(),
        }

    async def search_medicines(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        only_available: bool = False,
        only_reimbursed: bool = False,
        use_fuzzy: bool = True,
    ) -> tuple[list[dict], str]:
        """
        Vyhledej léčivé přípravky s multi-level pipeline a fuzzy fallbackem.

        Args:
            query: Vyhledávací dotaz
            limit: Max počet výsledků
            offset: Offset pro paging
            only_available: Filtr pouze dostupné léky
            only_reimbursed: Filtr pouze hrazené léky
            use_fuzzy: Použít fuzzy matching (default: True)

        Returns:
            Tuple (results, match_type) kde match_type je "substance", "exact", "substring", "fuzzy", nebo "none"

        Raises:
            SUKLValidationError: Při neplatném vstupu
        """
        # Import zde aby se předešlo circular dependencies
        from sukl_mcp.fuzzy_search import get_fuzzy_matcher

        # Input validace
        if not query or not query.strip():
            raise SUKLValidationError("Query nesmí být prázdný")
        if len(query) > 200:
            raise SUKLValidationError(f"Query příliš dlouhý: {len(query)} znaků (maximum: 200)")
        if not (1 <= limit <= 100):
            raise SUKLValidationError(f"Limit musí být 1-100 (zadáno: {limit})")

        query = query.strip()

        if not self._initialized:
            await self.initialize()

        df_medicines = self._loader.get_table("dlp_lecivepripravky")
        if df_medicines is None:
            return ([], "none")

        # Aplikuj pre-filtry
        if only_available:
            df_medicines = df_medicines[
                df_medicines["DODAVKY"].str.upper() == "A"
            ].copy()

        if only_reimbursed:
            # NOTE: Reimbursement filtering je implementováno post-enrichment
            # protože cenová data jsou v separátní tabulce (dlp_cau).
            # Pre-filtering by vyžadoval DataFrame merge což je nákladné.
            # Pro filtrování podle úhrad použij price data z výsledků.
            pass

        if df_medicines.empty:
            return ([], "none")

        # Multi-level search s fuzzy fallbackem
        if use_fuzzy:
            matcher = get_fuzzy_matcher()

            # Získej optional tabulky pro substance search
            df_composition = self._loader.get_table("dlp_slozeni")
            df_substances = self._loader.get_table("dlp_lecivelatky")

            results, match_type = matcher.search(
                query=query,
                df_medicines=df_medicines,
                df_composition=df_composition,
                df_substances=df_substances,
                limit=limit + offset,  # Fetch více pro offset
            )

            # Aplikuj offset
            if offset > 0:
                results = results[offset:]

        else:
            # Legacy simple substring search (zpětná kompatibilita)
            mask = df_medicines["NAZEV"].str.contains(query, case=False, na=False, regex=False)
            results_df = df_medicines[mask]

            # Paging
            results_df = results_df.iloc[offset : offset + limit]

            # Konverze na dict
            results = results_df.to_dict("records")

            # Přidej match metadata pro konzistenci
            for result in results:
                result["match_score"] = 10.0  # Default score
                result["match_type"] = "substring"

            match_type = "substring" if results else "none"

        # Obohacení výsledků o cenové údaje (EPIC 3)
        results = await self._enrich_with_price_data(results)

        return (results, match_type)

    async def _enrich_with_price_data(self, results: list[dict]) -> list[dict]:
        """
        Obohať výsledky vyhledávání o cenové údaje z dlp_cau.

        Args:
            results: Seznam výsledků vyhledávání

        Returns:
            Výsledky obohacené o cenové údaje (has_reimbursement, max_price, patient_copay)
        """
        if not results:
            return results

        df_cau = self._loader.get_table("dlp_cau")
        if df_cau is None:
            # Pokud dlp_cau není k dispozici, vrať results s None hodnotami
            for result in results:
                result["has_reimbursement"] = False
                result["max_price"] = None
                result["patient_copay"] = None
            return results

        # Import price calculator
        from sukl_mcp.price_calculator import get_price_data

        # Extrahuj všechny SÚKL kódy z výsledků
        sukl_codes = [str(r.get("KOD_SUKL", "")) for r in results if r.get("KOD_SUKL")]

        # Vytvoř lookup dictionary pro rychlé vyhledávání
        price_lookup = {}
        for sukl_code in sukl_codes:
            if sukl_code and sukl_code.isdigit():
                price_data = get_price_data(df_cau, sukl_code)
                if price_data:
                    price_lookup[sukl_code] = price_data

        # Obohať každý výsledek o cenové údaje
        for result in results:
            sukl_code = str(result.get("KOD_SUKL", ""))
            price_data = price_lookup.get(sukl_code)

            if price_data:
                result["has_reimbursement"] = price_data.get("is_reimbursed", False)
                result["max_price"] = price_data.get("max_price")
                result["patient_copay"] = price_data.get("patient_copay")
            else:
                result["has_reimbursement"] = False
                result["max_price"] = None
                result["patient_copay"] = None

        return results

    async def get_medicine_detail(self, sukl_code: str) -> Optional[dict]:
        """Získej detail léčivého přípravku."""
        # Input validace
        if not sukl_code or not sukl_code.strip():
            raise SUKLValidationError("SÚKL kód nesmí být prázdný")
        sukl_code = sukl_code.strip()
        if not sukl_code.isdigit():
            raise SUKLValidationError(f"SÚKL kód musí být číselný (zadáno: {sukl_code})")
        if len(sukl_code) > 7:
            raise SUKLValidationError(
                f"SÚKL kód příliš dlouhý: {len(sukl_code)} znaků (maximum: 7)"
            )

        if not self._initialized:
            await self.initialize()

        df = self._loader.get_table("dlp_lecivepripravky")
        if df is None:
            return None

        # Převeď kód na string a odstraň nuly na začátku pro porovnání
        sukl_code_normalized = str(int(sukl_code)) if sukl_code.isdigit() else sukl_code

        result = df[df["KOD_SUKL"].astype(str) == sukl_code_normalized]
        if result.empty:
            return None

        return result.iloc[0].to_dict()

    async def get_composition(self, sukl_code: str) -> list[dict]:
        """Získej složení léčivého přípravku."""
        if not self._initialized:
            await self.initialize()

        df_composition = self._loader.get_table("dlp_slozeni")
        if df_composition is None:
            return []

        # Normalizuj kód
        sukl_code_normalized = str(int(sukl_code)) if sukl_code.isdigit() else sukl_code
        results = df_composition[df_composition["KOD_SUKL"].astype(str) == sukl_code_normalized]
        return results.to_dict("records")

    async def search_pharmacies(
        self,
        city: Optional[str] = None,
        postal_code: Optional[str] = None,
        has_24h: bool = False,
        has_internet_sales: bool = False,
        limit: int = 20,
    ) -> list[dict]:
        """Vyhledej lékárny podle kritérií."""
        if not self._initialized:
            await self.initialize()

        # Pro teď vrátíme prázdný seznam, protože nemáme data o lékárnách v DLP
        logger.warning("Vyhledávání lékáren není implementováno - DLP neobsahuje data o lékárnách")
        return []

    async def get_atc_groups(self, atc_prefix: Optional[str] = None) -> list[dict]:
        """Získej ATC skupiny podle prefixu."""
        # Input validace
        if atc_prefix:
            atc_prefix = atc_prefix.strip()
            if len(atc_prefix) > 7:
                raise SUKLValidationError(
                    f"ATC prefix příliš dlouhý: {len(atc_prefix)} znaků (maximum: 7)"
                )

        if not self._initialized:
            await self.initialize()

        df = self._loader.get_table("dlp_atc")
        if df is None:
            return []

        # Pokud je zadán prefix, filtruj podle něj
        if atc_prefix:
            results = df[df["ATC"].str.startswith(atc_prefix, na=False)]
        else:
            results = df

        # Vrať max 100 výsledků
        return results.head(100).to_dict("records")

    async def get_price_info(self, sukl_code: str) -> Optional[dict]:
        """
        Získej cenové a úhradové informace o léčivém přípravku.

        Args:
            sukl_code: SÚKL kód léčiva

        Returns:
            Dict s cenovými údaji nebo None
        """
        # Input validace
        if not sukl_code or not sukl_code.strip():
            raise SUKLValidationError("SÚKL kód nesmí být prázdný")
        sukl_code = sukl_code.strip()
        if not sukl_code.isdigit():
            raise SUKLValidationError(f"SÚKL kód musí být číselný (zadáno: {sukl_code})")
        if len(sukl_code) > 7:
            raise SUKLValidationError(
                f"SÚKL kód příliš dlouhý: {len(sukl_code)} znaků (maximum: 7)"
            )

        if not self._initialized:
            await self.initialize()

        df_cau = self._loader.get_table("dlp_cau")
        if df_cau is None:
            logger.warning("dlp_cau table není načtena - cenové údaje nejsou dostupné")
            return None

        # Použij price_calculator pro získání dat
        from sukl_mcp.price_calculator import get_price_data

        return get_price_data(df_cau, sukl_code)

    async def close(self) -> None:
        """Uzavři klienta."""
        logger.info("Uzavírám SÚKL klienta...")
        self._initialized = False


# Globální instance klienta s thread-safe inicializací
_client: Optional[SUKLClient] = None
_client_lock: asyncio.Lock = asyncio.Lock()


async def get_sukl_client() -> SUKLClient:
    """Získej globální instanci SÚKL klienta (thread-safe)."""
    global _client

    # Rychlá kontrola bez zámku (double-checked locking)
    if _client is not None:
        return _client

    # Kritická sekce - zajištění jediné instance
    async with _client_lock:
        # Opětovná kontrola v zámku
        if _client is None:
            _client = SUKLClient()
            await _client.initialize()

    return _client


async def close_sukl_client() -> None:
    """Uzavři globální instanci SÚKL klienta."""
    global _client
    if _client:
        await _client.close()
        _client = None
