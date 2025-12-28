# SÚKL MCP Server 🏥💊

FastMCP server poskytující AI agentům přístup k české databázi léčivých přípravků (SÚKL).

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastMCP](https://img.shields.io/badge/FastMCP-2.14+-green.svg)](https://gofastmcp.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Co tento server umožňuje

Díky tomuto MCP serveru mohou AI agenti (např. Claude) bezpečně a spolehlivě:

- **Vyhledávat léčiva** podle názvu, účinné látky nebo ATC kódu
- **Získat detaily přípravku** včetně složení, registrace a dokumentů
- **Zobrazit příbalový leták** (PIL) s informacemi pro pacienty
- **Zkontrolovat dostupnost** léčiva na českém trhu
- **Zjistit základní informace o úhradách**
- **Procházet ATC klasifikaci** léčivých látek

## 📊 Rozsah dat

Server pracuje s aktuálními daty z SÚKL Open Data:

- **68,248** registrovaných léčivých přípravků
- **787,877** záznamů složení
- **3,352** léčivých látek
- **6,907** ATC klasifikačních kódů
- **61,240** dokumentů (PIL/SPC)

*Data aktualizována: 23. prosince 2024*

## 📦 Instalace

### Požadavky

- Python 3.10 nebo novější
- Virtuální prostředí (doporučeno)

### Ze zdrojového kódu

```bash
cd sukl_mcp
python -m venv venv
source venv/bin/activate  # Linux/Mac
# nebo: venv\Scripts\activate  # Windows

pip install -e .
```

### Dodatečné závislosti

```bash
# Pro vývoj
pip install -e ".[dev]"
```

## 🚀 Rychlý start

### Spuštění serveru

```bash
# V aktivovaném virtuálním prostředí
python -m sukl_mcp.server
```

### Použití v Claude Desktop

Přidejte do `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sukl": {
      "command": "python",
      "args": [
        "-m",
        "sukl_mcp.server"
      ],
      "env": {
        "PYTHONPATH": "/cesta/k/fastmcp-boilerplate/sukl_mcp/src"
      }
    }
  }
}
```

### Nasazení na Smithery

Server je také připraven pro nasazení na [Smithery](https://smithery.ai):

```bash
# 1. Build Docker image lokálně
cd sukl_mcp
docker build -t sukl-mcp:2.0.0 .

# 2. Test lokálně
docker run -p 8000:8000 -e MCP_TRANSPORT=http sukl-mcp:2.0.0

# 3. Deploy na Smithery (vyžaduje Smithery CLI)
smithery deploy
```

**Konfigurace:** Projekt obsahuje `smithery.yaml` s HTTP transport konfigurací:
- ✅ Docker kontejner s python:3.10-slim
- ✅ HTTP/Streamable-HTTP transport
- ✅ Konfigurovatelné cache paths a timeouty
- ✅ Health checks a monitoring

**Poznámka:** Smithery používá Docker kontejnery a HTTP transport. Pro lokální vývoj doporučujeme STDIO transport (výchozí).

Detailní průvodce: [SMITHERY_DEPLOYMENT.md](SMITHERY_DEPLOYMENT.md)

### Použití jako Python knihovny

```python
import asyncio
from sukl_mcp.client_csv import SUKLClient

async def main():
    client = SUKLClient()
    await client.initialize()

    # Vyhledání léčiva
    results = await client.search_medicines("ibuprofen", limit=5)
    for med in results:
        print(f"{med.get('NAZEV')} - {med.get('ATC_WHO', 'N/A')}")

    # Detail přípravku
    detail = await client.get_medicine_detail("254045")
    if detail:
        print(f"Název: {detail.get('NAZEV')}")
        print(f"Síla: {detail.get('SILA')}")

    await client.close()

asyncio.run(main())
```

## 🛠️ Dostupné nástroje (MCP Tools)

### `search_medicine`
Vyhledává léčivé přípravky v databázi.

**Parametry:**
- `query`: Hledaný text (název, účinná látka, ATC kód)
- `only_available`: Pouze dostupné přípravky (default: false)
- `only_reimbursed`: Pouze hrazené pojišťovnou (default: false)
- `limit`: Max počet výsledků (default: 20)

**Příklad:** "Najdi všechny přípravky s ibuprofem"

**Odpověď:**
```json
{
  "query": "ibuprofen",
  "total_results": 5,
  "results": [
    {
      "sukl_code": "124137",
      "name": "IBUPROFEN GALMED",
      "strength": "400MG",
      "form": "TBL FLM"
    }
  ]
}
```

### `get_medicine_details`
Vrací kompletní informace o léčivém přípravku.

**Parametry:**
- `sukl_code`: 7-místný SÚKL kód (např. "0254045" nebo "254045")

**Příklad:** "Jaké jsou detaily přípravku Paralen s kódem 254045?"

**Odpověď:**
```json
{
  "sukl_code": "0254045",
  "name": "PARALEN",
  "strength": "500MG",
  "form": "TBL NOB",
  "atc_code": "N02BE01",
  "registration_status": "R",
  "is_available": false,
  "is_marketed": true
}
```

### `get_pil_content`
Získá odkaz na příbalový leták pro pacienty.

**Parametry:**
- `sukl_code`: SÚKL kód přípravku

**Příklad:** "Ukaž mi příbalový leták pro Paralen"

### `check_availability`
Kontroluje dostupnost léčiva na trhu.

**Parametry:**
- `sukl_code`: SÚKL kód přípravku

**Příklad:** "Je Paralen aktuálně dostupný?"

**Odpověď:**
```json
{
  "sukl_code": "0254045",
  "medicine_name": "PARALEN",
  "is_available": false,
  "is_marketed": true,
  "unavailability_reason": "Přípravek není aktuálně dodáván"
}
```

### `get_reimbursement`
Informace o úhradě zdravotní pojišťovnou.

**Parametry:**
- `sukl_code`: SÚKL kód přípravku

**Příklad:** "Kolik je doplatek na tento lék?"

**⚠️ Poznámka:** Detailní informace o úhradách vyžadují dodatečná data z CAU tabulek.

### `find_pharmacies`
Vyhledává lékárny podle kritérií.

**Parametry:**
- `city`: Název města (volitelné)
- `postal_code`: PSČ (volitelné)
- `has_24h_service`: Pouze pohotovostní (default: false)
- `has_internet_sales`: Pouze s e-shopem (default: false)
- `limit`: Max počet výsledků (default: 20)

**⚠️ Známé omezení:** DLP dataset neobsahuje data o lékárnách. Tento tool vrací prázdný seznam.

### `get_atc_info`
Informace o ATC klasifikační skupině.

**Parametry:**
- `atc_code`: ATC kód (1-7 znaků, např. "N02", "N02BE01")

**Příklad:** "Co je skupina N02 v ATC klasifikaci?"

**Odpověď:**
```json
{
  "code": "N02",
  "name": "ANODYNA",
  "level": 3,
  "children": [...]
}
```

## 📊 Zdroje dat

Server využívá **SÚKL Open Data** (CSV databáze):

| Dataset | Zdroj | Velikost | Aktualizace |
|---------|-------|----------|-------------|
| DLP Database | opendata.sukl.cz | 9.3 MB | Týdně |
| Léčivé přípravky | dlp_lecivepripravky.csv | 68,248 záznamů | Týdně |
| Složení | dlp_slozeni.csv | 787,877 záznamů | Týdně |
| ATC kódy | dlp_atc.csv | 6,907 záznamů | Měsíčně |

**URL:** https://opendata.sukl.cz/soubory/SOD20251223/DLP20251223.zip

### Jak funguje načítání dat

1. **První spuštění**: Server stáhne DLP ZIP soubor (~ 9 MB)
2. **Rozbalení**: Extrahuje CSV soubory do `/tmp/sukl_dlp_data`
3. **Načtení**: Načte klíčové tabulky do paměti pomocí pandas
4. **Cache**: ZIP zůstává v cache pro příští spuštění

**Paměťová náročnost:** ~150-200 MB RAM pro všechna data

## ⚙️ Konfigurace

### Proměnné prostředí

```bash
# Výchozí konfigurace v client_csv.py
SUKL_DLP_URL="https://opendata.sukl.cz/soubory/SOD20251223/DLP20251223.zip"
SUKL_CACHE_DIR="/tmp/sukl_dlp_cache"
SUKL_DATA_DIR="/tmp/sukl_dlp_data"
SUKL_DOWNLOAD_TIMEOUT=120
```

## 🧪 Vývoj

### Nastavení vývojového prostředí

```bash
# Virtuální prostředí
python -m venv venv
source venv/bin/activate  # Linux/Mac

# Instalace s dev závislostmi
pip install -e ".[dev]"
```

### Testování

```bash
# Test načtení dat
python -c "from sukl_mcp.client_csv import SUKLClient; import asyncio; asyncio.run(SUKLClient().initialize())"

# Test všech MCP tools
python -m sukl_mcp.tests.validate_all
```

### Formátování a linting

```bash
# Formátování
black src/

# Linting
ruff check src/

# Type checking
mypy src/
```

## 📝 Architektura

Server je postaven na třech hlavních modulech:

1. **models.py** - Pydantic modely pro validaci dat
2. **client_csv.py** - CSV loader s pandas
3. **server.py** - FastMCP server s MCP tools

```
sukl_mcp/
├── src/sukl_mcp/
│   ├── __init__.py
│   ├── models.py         # Pydantic modely
│   ├── client_csv.py     # CSV data loader
│   └── server.py         # FastMCP server
├── pyproject.toml
└── README.md
```

### Datový tok

```
┌─────────────────┐
│  SÚKL Open Data │
│  (opendata.sukl │
│      .cz)       │
└────────┬────────┘
         │ Download ZIP
         ▼
┌─────────────────┐
│  SUKLDataLoader │
│  (client_csv.py)│
│                 │
│  • Download     │
│  • Extract      │
│  • Load CSV     │
└────────┬────────┘
         │ pandas DataFrames
         ▼
┌─────────────────┐
│   SUKLClient    │
│  (client_csv.py)│
│                 │
│  • search       │
│  • get_detail   │
│  • get_atc      │
└────────┬────────┘
         │ Python dicts
         ▼
┌─────────────────┐
│  FastMCP Server │
│   (server.py)   │
│                 │
│  • MCP Tools    │
│  • Pydantic     │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   AI Agent      │
│  (Claude, etc.) │
└─────────────────┘
```

## 🔒 Bezpečnostní funkce

### Input validace
Server implementuje kompletní validaci všech vstupů:

- **search_medicines**: Query délka (max 200 znaků), limit range (1-100)
- **get_medicine_details**: SÚKL kód validace (číselný, max 7 znaků)
- **get_atc_info**: ATC prefix validace (max 7 znaků)

### Ochrana proti útokům

**Regex injection prevention:**
```python
# User input je vždy escapován, není používán jako regex pattern
mask = df['NAZEV'].str.contains(query, case=False, na=False, regex=False)
```

**ZIP bomb protection:**
```python
# Kontrola velikosti před extrakcí (max 5 GB)
total_size = sum(info.file_size for info in zip_ref.infolist())
if total_size > 5 * 1024 * 1024 * 1024:
    raise SUKLZipBombError(f"ZIP příliš velký: {total_size / 1024 / 1024:.1f} MB")
```

**Thread-safe singleton:**
```python
# Double-checked locking s asyncio.Lock
_client_lock: asyncio.Lock = asyncio.Lock()
async with _client_lock:
    if _client is None:
        _client = SUKLClient()
```

### Custom exception types
```python
from sukl_mcp.exceptions import (
    SUKLException,         # Základní exception
    SUKLValidationError,   # Chyba validace vstupu
    SUKLZipBombError,      # ZIP bomb detekována
    SUKLDataError,         # Chyba při načítání dat
)
```

## ⚡ Performance

### Async I/O
Všechny blokující operace běží v executoru:

**ZIP extraction:**
```python
# 200+ MB ZIP soubor neblokuje event loop
loop = asyncio.get_event_loop()
await loop.run_in_executor(None, _sync_extract)
```

**Paralelní CSV loading:**
```python
# 5 CSV souborů načteno paralelně (3-5x rychlejší)
results = await asyncio.gather(
    *[loop.run_in_executor(None, _load_single_csv, t) for t in tables]
)
```

### In-memory queries
- **68,248** léčivých přípravků načteno při startu
- pandas DataFrames v RAM pro okamžité vyhledávání
- Rychlejší než SQL pro tento rozsah dat

### Inicializace
```
┌──────────────────────┬──────────┐
│ Operace              │ Čas      │
├──────────────────────┼──────────┤
│ Stažení ZIP (200 MB) │ ~10-30 s │
│ Extrakce ZIP         │ ~5 s     │
│ Načtení 5 CSV        │ ~3-5 s   │
│ Celkem               │ ~20-40 s │
└──────────────────────┴──────────┘
```

### Caching
- ZIP soubor cachován v `/tmp/sukl_dlp_cache/`
- Data extrahována do `/tmp/sukl_dlp_data/`
- Re-inicializace po restartu: **~3-5 s** (pokud cache existuje)

## ⚠️ Známá omezení

### 1. Lékárny (find_pharmacies)
DLP dataset neobsahuje informace o lékárnách. Tool vrací prázdný seznam.

**Řešení:** Implementovat separátní zdroj dat pro lékárny z https://opendata.sukl.cz/?q=katalog/seznam-lekaren

### 2. Detailní úhrady (get_reimbursement)
Základní DLP tabulka neobsahuje detailní informace o cenách a úhradách.

**Řešení:** Načíst dodatečné CSV soubory:
- `dlp_cau_scau.csv` - Ceny a úhrady pro ambulantní péči
- `dlp_cau_scup.csv` - Ceny pro ústavní péči
- `dlp_cau_sneh.csv` - Nehrazené přípravky

### 3. PIL/SPC dokumenty
Server vrací pouze URL odkazy na dokumenty, ne jejich obsah.

**Aktuální řešení:** URL ve formátu `https://prehledy.sukl.cz/pil/{sukl_code}.pdf`

## 📜 Právní upozornění

⚠️ **Důležité:**

- Informace poskytované tímto serverem mají **pouze informativní charakter**
- Vždy se řiďte pokyny **lékaře a lékárníka**
- Data pochází z veřejných zdrojů SÚKL a mohou být zpožděná
- Server **nenahrazuje** odbornou lékařskou konzultaci

### Licence dat

Data SÚKL jsou poskytována pod podmínkami [Open Data SÚKL](https://opendata.sukl.cz/?q=podminky-uziti):
- ✅ Volné šíření a kopírování
- ✅ Komerční využití
- ⚠️ Povinnost uvést SÚKL jako zdroj
- ❌ Zákaz měnit význam dat

## 📜 Licence

MIT License - viz [LICENSE](../LICENSE)

## 🙏 Poděkování

- [SÚKL](https://www.sukl.cz) za poskytování otevřených dat
- [FastMCP](https://gofastmcp.com) za skvělý MCP framework
- [Anthropic](https://www.anthropic.com) za MCP specifikaci

---

**Vytvořeno s ❤️ pro české zdravotnictví**

*Poslední aktualizace: 28. prosince 2024*
