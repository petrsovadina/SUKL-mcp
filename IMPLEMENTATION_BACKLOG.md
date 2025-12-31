# SÚKL MCP Server - Implementation Backlog
## Specifikace: 4 Hlavní Moduly

**Datum vytvoření**: 2025-12-30
**Status**: Planning Phase
**Priorita**: High

---

## 📊 Overview

Implementace 4 klíčových modulů pro transformaci SÚKL MCP serveru z "vyhledávače odkazů" na "inteligentního farmaceutického asistenta".

### Hodnota pro uživatele:
- ✅ Přímé odpovědi z dokumentace bez klikání na PDF
- ✅ Tolerantní vyhledávání s překlepami
- ✅ Transparentní informace o cenách a doplatcích
- ✅ Proaktivní nabízení alternativ při výpadcích

### Technické změny:
- Nové závislosti: `pypdf`, `python-docx`, `rapidfuzz`, `async-lru`
- Rozšíření datových souborů: `dlp_cau.csv`
- 4 nové MCP tools nebo rozšíření stávajících
- Kompletní test coverage pro každý modul

---

## 🎯 EPIC 1: Content Extractor (Čtečka Dokumentace)

**Business Value**: Uživatel nechce stahovat PDF, chce přímou odpověď z dokumentu.
**Technical Complexity**: Medium
**Estimated Effort**: 3-4 days

### User Stories

#### US-1.1: Universal Document Downloader
**Jako** uživatel
**Chci** aby agent mohl stáhnout PIL/SPC dokumenty
**Aby** mi mohl odpovědět na otázky z obsahu

**Acceptance Criteria**:
- [ ] Funkce `download_document(sukl_code: str, doc_type: str) -> bytes`
- [ ] Detekce formátu podle Content-Type + fallback na příponu
- [ ] Download do RAM bez ukládání na disk
- [ ] Error handling pro 404, timeout, invalid format
- [ ] Implementace pomocí httpx.AsyncClient

**Technical Tasks**:
- [ ] **T-1.1.1**: Vytvořit `document_downloader.py` modul
- [ ] **T-1.1.2**: Implementovat `async def download_document()`
- [ ] **T-1.1.3**: Přidat Content-Type detection logic
- [ ] **T-1.1.4**: Unit testy pro různé HTTP responses
- [ ] **T-1.1.5**: Integration test s reálným SÚKL URL

#### US-1.2: PDF Text Extraction
**Jako** systém
**Chci** extrahovat text z PDF dokumentů
**Aby** mohl LLM odpovídat na otázky z obsahu

**Acceptance Criteria**:
- [ ] Parser pro PDF pomocí pypdf
- [ ] Limit na prvních 5-10 stran (performance)
- [ ] Sanitizace textu (remove multi-spaces, non-printable)
- [ ] Graceful handling encrypted/corrupted PDF
- [ ] Return structured error pro scanned images

**Technical Tasks**:
- [ ] **T-1.2.1**: Instalovat `pypdf` závislost
- [ ] **T-1.2.2**: Implementovat `parse_pdf(content: bytes) -> str`
- [ ] **T-1.2.3**: Přidat page limit (5-10 stran)
- [ ] **T-1.2.4**: Implementovat text sanitization
- [ ] **T-1.2.5**: Unit testy s fixtures (valid, encrypted, scanned)

#### US-1.3: DOCX Text Extraction
**Jako** systém
**Chci** extrahovat text z DOCX dokumentů
**Aby** podporoval i starší formát dokumentace

**Acceptance Criteria**:
- [ ] Parser pro DOCX pomocí python-docx
- [ ] Extrakce všech paragrafů
- [ ] Legacy .doc detection a error message
- [ ] Konzistentní formát výstupu s PDF parserem

**Technical Tasks**:
- [ ] **T-1.3.1**: Instalovat `python-docx` závislost
- [ ] **T-1.3.2**: Implementovat `parse_docx(content: bytes) -> str`
- [ ] **T-1.3.3**: Detekce legacy .doc formátu (OLE)
- [ ] **T-1.3.4**: Unit testy s DOCX fixtures

#### US-1.4: Document Caching
**Jako** systém
**Chci** cachovat stažené dokumenty
**Aby** se při opakovaných dotazech nestahovaly znovu

**Acceptance Criteria**:
- [ ] LRU cache pro posledních 50 dokumentů
- [ ] Cache key: `{sukl_code}:{doc_type}`
- [ ] Cache invalidation po 24 hodinách
- [ ] Odezva cachedovaného < 100ms

**Technical Tasks**:
- [ ] **T-1.4.1**: Instalovat `async-lru` závislost
- [ ] **T-1.4.2**: Implementovat `@alru_cache` decorator
- [ ] **T-1.4.3**: Konfigurace cache size (max 50)
- [ ] **T-1.4.4**: Performance testy (cached vs non-cached)

#### US-1.5: MCP Tool Integration
**Jako** uživatel
**Chci** nový MCP tool `read_document_content`
**Aby** mohl dotazovat přímo na obsah dokumentů

**Acceptance Criteria**:
- [ ] Tool `read_document_content(sukl_code, doc_type, query?)`
- [ ] Return full text nebo answer na query
- [ ] Error handling s user-friendly messages
- [ ] Dokumentace v docstring pro AI agenty

**Technical Tasks**:
- [ ] **T-1.5.1**: Přidat `@mcp.tool` v `server.py`
- [ ] **T-1.5.2**: Propojit s document parsery
- [ ] **T-1.5.3**: Implementovat query-based answering (optional)
- [ ] **T-1.5.4**: Integration test celého flow
- [ ] **T-1.5.5**: Update API documentation

---

## 🎯 EPIC 2: Smart Search (Inteligentní Vyhledávání)

**Business Value**: Minimalizovat "Nenalezeno" chyby, tolerovat překlepy.
**Technical Complexity**: Medium
**Estimated Effort**: 2-3 days

### User Stories

#### US-2.1: Multi-Level Search Pipeline
**Jako** uživatel
**Chci** aby vyhledávání fungovalo i s překlepům
**Aby** našel lék i když neznám přesný název

**Acceptance Criteria**:
- [ ] Krok 1: Vyhledávání v účinné látce
- [ ] Krok 2: Exact/substring match v názvu
- [ ] Krok 3: Fuzzy fallback (shoda > 80%)
- [ ] Pipeline se zastaví po prvním úspěšném kroku
- [ ] Dotaz "parelen" → "PARALEN"

**Technical Tasks**:
- [ ] **T-2.1.1**: Instalovat `rapidfuzz` závislost
- [ ] **T-2.1.2**: Refaktorovat `search_medicines()` v `client_csv.py`
- [ ] **T-2.1.3**: Implementovat step 1 (účinná látka search)
- [ ] **T-2.1.4**: Implementovat step 2 (název exact/substring)
- [ ] **T-2.1.5**: Implementovat step 3 (fuzzy fallback s rapidfuzz)
- [ ] **T-2.1.6**: Unit testy pro každý krok
- [ ] **T-2.1.7**: Integration test celého pipeline

#### US-2.2: Hybrid Ranking System
**Jako** uživatel
**Chci** aby výsledky byly seřazeny podle relevance
**Aby** na prvním místě byly dostupné a hrazené léky

**Acceptance Criteria**:
- [ ] Scoring: Dostupnost (DODAVKY == 'A') → +10 bodů
- [ ] Scoring: Úhrada → +5 bodů
- [ ] Scoring: Přesná shoda názvu → +20 bodů
- [ ] Scoring: Fuzzy match → +score z rapidfuzz
- [ ] Výsledky seřazeny descending podle total score

**Technical Tasks**:
- [ ] **T-2.2.1**: Implementovat `calculate_ranking_score(row, query, match_type)`
- [ ] **T-2.2.2**: Integrovat scoring do search_medicines
- [ ] **T-2.2.3**: Unit testy pro scoring logiku
- [ ] **T-2.2.4**: Integration test - validovat pořadí výsledků

#### US-2.3: Search Performance Optimization
**Jako** systém
**Chci** aby fuzzy search byl dostatečně rychlý
**Aby** nepřekročil 500ms latency

**Acceptance Criteria**:
- [ ] Fuzzy search pouze pokud len(query) > 3
- [ ] Limit kandidátů pro fuzzy na 1000 záznamů
- [ ] Cache fuzzy results pro identické queries
- [ ] Latency < 500ms pro 95% dotazů

**Technical Tasks**:
- [ ] **T-2.3.1**: Přidat query length validation
- [ ] **T-2.3.2**: Implementovat candidate limiting
- [ ] **T-2.3.3**: Cache fuzzy results (optional)
- [ ] **T-2.3.4**: Performance benchmarking

#### US-2.4: Update Existing search_medicine Tool
**Jako** uživatel
**Chci** aby stávající tool používal nový smart search
**Aby** fungovalo automaticky bez změny API

**Acceptance Criteria**:
- [ ] Zpětná kompatibilita API
- [ ] Nový optional parametr `use_fuzzy: bool = True`
- [ ] Update response modelu s match_score
- [ ] Update dokumentace

**Technical Tasks**:
- [ ] **T-2.4.1**: Update `search_medicine()` v `server.py`
- [ ] **T-2.4.2**: Přidat `match_score` do `MedicineSearchResult`
- [ ] **T-2.4.3**: Zachovat zpětnou kompatibilitu
- [ ] **T-2.4.4**: Integration test s různými query types
- [ ] **T-2.4.5**: Update API docs a CLAUDE.md

---

## 🎯 EPIC 3: Price & Reimbursement (Ekonomika a Ceny)

**Business Value**: Transparentní informace o cenách a doplatcích.
**Technical Complexity**: Medium-High
**Estimated Effort**: 3-4 days

### User Stories

#### US-3.1: Load Price Data (dlp_cau.csv)
**Jako** systém
**Chci** načíst data o cenách a úhradách
**Aby** mohl poskytovat ekonomické informace

**Acceptance Criteria**:
- [ ] Stažení `dlp_cau.csv` v SUKLDataLoader
- [ ] Parsing CSV s encoding cp1250
- [ ] Načtení do pandas DataFrame
- [ ] Validace klíčových sloupců (KOD_SUKL, MC, UHR1)

**Technical Tasks**:
- [ ] **T-3.1.1**: Update `_load_csvs()` v `client_csv.py`
- [ ] **T-3.1.2**: Přidat `dlp_cau` do tables list
- [ ] **T-3.1.3**: Implementovat CSV parsing
- [ ] **T-3.1.4**: Unit test pro data loading
- [ ] **T-3.1.5**: Validace že data existují po inicializaci

#### US-3.2: Data Merging and Filtering
**Jako** systém
**Chci** propojit data léků s cenovými daty
**Aby** každý lék měl přiřazenu aktuální cenu

**Acceptance Criteria**:
- [ ] Merge `dlp_lecivepripravky` s `dlp_cau` přes KOD_SUKL
- [ ] Filtrování pouze platných záznamů (PLATNOST_DO >= today)
- [ ] Handling multiple price records (nejnovější)
- [ ] Handling missing price data (None values)

**Technical Tasks**:
- [ ] **T-3.2.1**: Implementovat `merge_price_data()` funkci
- [ ] **T-3.2.2**: Date filtering logika
- [ ] **T-3.2.3**: Deduplikace - vybrat nejnovější záznam
- [ ] **T-3.2.4**: Unit testy pro merge scenarios

#### US-3.3: Price Calculation Logic
**Jako** systém
**Chci** vypočítat doplatek pacienta
**Aby** mohl zobrazit reálné náklady

**Acceptance Criteria**:
- [ ] Formula: DOPLATEK = MAX(0, MAX_CENA - UHRADA)
- [ ] Flag: PLNE_HRAZENO = True pokud DOPLATEK == 0
- [ ] Handling: None values → "Informace o ceně není k dispozici"
- [ ] Validace: Ceny nesmí být záporné

**Technical Tasks**:
- [ ] **T-3.3.1**: Implementovat `calculate_copay()` funkci
- [ ] **T-3.3.2**: Přidat business logiku pro výpočet
- [ ] **T-3.3.3**: Unit testy pro různé scénáře
- [ ] **T-3.3.4**: Edge case handling (None, negative, zero)

#### US-3.4: Update get_reimbursement Tool
**Jako** uživatel
**Chci** reálné informace o cenách a úhradách
**Aby** věděl kolik zaplatím

**Acceptance Criteria**:
- [ ] Tool vrací: max_price, reimbursement, copay, fully_reimbursed
- [ ] Disclaimer: "Orientační doplatek, lékárny mohou mít nižší cenu"
- [ ] Handling: léky bez stanovené ceny
- [ ] Response model s Pydantic validací

**Technical Tasks**:
- [ ] **T-3.4.1**: Update `get_reimbursement()` v `server.py`
- [ ] **T-3.4.2**: Propojit s price calculation logic
- [ ] **T-3.4.3**: Update `ReimbursementInfo` Pydantic model
- [ ] **T-3.4.4**: Přidat disclaimer do docstringu
- [ ] **T-3.4.5**: Integration test s reálnými daty
- [ ] **T-3.4.6**: Update API documentation

#### US-3.5: Price Display in Search Results
**Jako** uživatel
**Chci** vidět ceny už ve výsledcích vyhledávání
**Aby** nemusel klikat na každý lék zvlášť

**Acceptance Criteria**:
- [ ] `MedicineSearchResult` obsahuje `price_info: Optional[PriceInfo]`
- [ ] Zobrazuje se max cena a orientační doplatek
- [ ] Handling: léky bez ceny → None
- [ ] Performance: merge nesmí zpomalit search

**Technical Tasks**:
- [ ] **T-3.5.1**: Přidat `PriceInfo` nested model
- [ ] **T-3.5.2**: Update `search_medicines()` - include price
- [ ] **T-3.5.3**: Performance optimization (join vs separate query)
- [ ] **T-3.5.4**: Unit testy pro search s cenami
- [ ] **T-3.5.5**: Update response examples v docs

---

## 🎯 EPIC 4: Availability & Alternatives (Dostupnost a Alternativy)

**Business Value**: Proaktivní nabízení alternativ při výpadcích dodávek.
**Technical Complexity**: High
**Estimated Effort**: 3-4 days

### User Stories

#### US-4.1: Availability Status Mapping
**Jako** systém
**Chci** srozumitelnou sémantiku stavů dostupnosti
**Aby** uživatel rozuměl co každý stav znamená

**Acceptance Criteria**:
- [ ] A → "Dostupné" (Available)
- [ ] N → "Výpadek dodávek" (Supply Interruption)
- [ ] P → "Ukončení dodávek" (Discontinued)
- [ ] Mapping jako enum v models.py
- [ ] Human-readable messages pro každý stav

**Technical Tasks**:
- [ ] **T-4.1.1**: Vytvořit `AvailabilityStatus` enum
- [ ] **T-4.1.2**: Přidat mapping dictionary
- [ ] **T-4.1.3**: Update `AvailabilityInfo` model
- [ ] **T-4.1.4**: Unit testy pro mapping

#### US-4.2: Generic Drug Search Algorithm
**Jako** systém
**Chci** najít generická alternativy
**Aby** mohl nabídnout dostupné léky se stejným složením

**Acceptance Criteria**:
- [ ] Trigger: Pouze pokud stav == N nebo P
- [ ] Kritéria: ATC_SKUPINA (7 znaků) + UCINNA_LATKA + DODAVKY == 'A'
- [ ] Optional: Preferovat stejnou FORMU
- [ ] Max 3 alternativy
- [ ] Seřazeno podle shody síly (mg)

**Technical Tasks**:
- [ ] **T-4.2.1**: Implementovat `find_generic_alternatives()` v `client_csv.py`
- [ ] **T-4.2.2**: ATC + substance matching logic
- [ ] **T-4.2.3**: Form preference logic
- [ ] **T-4.2.4**: Strength sorting (parse mg values)
- [ ] **T-4.2.5**: Limit na 3 výsledky
- [ ] **T-4.2.6**: Unit testy s různými scénáři

#### US-4.3: Alternative Ranking
**Jako** systém
**Chci** řadit alternativy podle relevance
**Aby** na prvním místě byla nejlepší náhrada

**Acceptance Criteria**:
- [ ] Priorita 1: Stejná forma (tablety vs sirup)
- [ ] Priorita 2: Nejbližší síla (mg)
- [ ] Priorita 3: Cena (pokud dostupná)
- [ ] Priorita 4: Abecedně podle názvu

**Technical Tasks**:
- [ ] **T-4.3.1**: Implementovat scoring pro alternativy
- [ ] **T-4.3.2**: Comparison funkce pro sílu
- [ ] **T-4.3.3**: Multi-criteria sorting
- [ ] **T-4.3.4**: Unit testy pro ranking

#### US-4.4: Update check_availability Tool
**Jako** uživatel
**Chci** aby check_availability automaticky nabízel alternativy
**Aby** nemusel hledat sám

**Acceptance Criteria**:
- [ ] Pokud stav N/P → vrátit seznam alternativ
- [ ] Message: "Lék X má výpadek. Dostupné alternativy: Y, Z"
- [ ] Response obsahuje `alternatives: list[MedicineSearchResult]`
- [ ] Pokud žádné alternativy → clear message

**Technical Tasks**:
- [ ] **T-4.4.1**: Update `check_availability()` v `server.py`
- [ ] **T-4.4.2**: Propojit s `find_generic_alternatives()`
- [ ] **T-4.4.3**: Update `AvailabilityInfo` model
- [ ] **T-4.4.4**: Přidat alternatives do response
- [ ] **T-4.4.5**: Integration test s unavailable drug
- [ ] **T-4.4.6**: Update API documentation

#### US-4.5: Smart Alternative Recommendations
**Jako** uživatel
**Chci** inteligentní doporučení alternativ
**Aby** agent zohlednil i moje preference (cena, forma)

**Acceptance Criteria**:
- [ ] Optional parametry: prefer_form, max_price
- [ ] Filtering based on user constraints
- [ ] Explanation proč je alternativa navržena
- [ ] Handling: žádná alternativa nevyhovuje filtrům

**Technical Tasks**:
- [ ] **T-4.5.1**: Přidat optional parametry do check_availability
- [ ] **T-4.5.2**: Implementovat constraint filtering
- [ ] **T-4.5.3**: Generovat explanation text
- [ ] **T-4.5.4**: Unit testy s různými constraints
- [ ] **T-4.5.5**: Update docs s examples

---

## 🔧 Cross-Cutting Concerns

### Dependencies Management
- [ ] **T-CC-1**: Update `pyproject.toml` s novými závislostmi
  - `pypdf>=4.0.0`
  - `python-docx>=1.1.0`
  - `rapidfuzz>=3.0.0`
  - `async-lru>=2.0.0`
- [ ] **T-CC-2**: Update `requirements.txt` (pokud existuje)
- [ ] **T-CC-3**: Test instalace v čistém venv
- [ ] **T-CC-4**: Update Docker image (pokud používáno)

### Configuration
- [ ] **T-CC-5**: Přidat ENV proměnné pro cache settings
  - `SUKL_DOCUMENT_CACHE_SIZE=50`
  - `SUKL_FUZZY_THRESHOLD=80`
- [ ] **T-CC-6**: Update `SUKLConfig` Pydantic model
- [ ] **T-CC-7**: Dokumentace konfiguračních options

### Error Handling
- [ ] **T-CC-8**: Přidat nové exception typy
  - `SUKLDocumentError`
  - `SUKLParseError`
  - `SUKLCacheError`
- [ ] **T-CC-9**: Globální error handler v FastMCP
- [ ] **T-CC-10**: User-friendly error messages

### Logging & Monitoring
- [ ] **T-CC-11**: Strukturované logování pro nové moduly
- [ ] **T-CC-12**: Performance metrics (latency tracking)
- [ ] **T-CC-13**: Cache hit/miss metrics
- [ ] **T-CC-14**: Error rate monitoring

### Documentation
- [ ] **T-CC-15**: Update `README.md` s novými features
- [ ] **T-CC-16**: Update `CLAUDE.md` s implementation patterns
- [ ] **T-CC-17**: Update `docs/api-reference.md`
- [ ] **T-CC-18**: Update `docs/architecture.md` s novými komponenty
- [ ] **T-CC-19**: Přidat `docs/examples.md` s use cases
- [ ] **T-CC-20**: Update CHANGELOG.md

### Testing Strategy
- [ ] **T-CC-21**: Vytvořit test fixtures (PDF, DOCX samples)
- [ ] **T-CC-22**: Mock HTTP responses pro document download
- [ ] **T-CC-23**: Integration tests pro každý EPIC
- [ ] **T-CC-24**: Performance benchmarks
- [ ] **T-CC-25**: Coverage target: >85%

---

## 📈 Implementation Phases

### Phase 1: Foundation (Week 1)
- Setup dependencies
- Content Extractor (EPIC 1)
- Basic testing infrastructure

### Phase 2: Search Enhancement (Week 2)
- Smart Search (EPIC 2)
- Integration with existing search_medicine
- Performance optimization

### Phase 3: Economic Data (Week 2-3)
- Price & Reimbursement (EPIC 3)
- Data loading and merging
- Tool updates

### Phase 4: Intelligence (Week 3-4)
- Availability & Alternatives (EPIC 4)
- Smart recommendations
- Final integration testing

### Phase 5: Polish (Week 4)
- Documentation
- Performance tuning
- Production deployment

---

## 🎯 Success Criteria

### Technical KPIs
- [ ] All 4 EPICs implemented and tested
- [ ] Test coverage > 85%
- [ ] Search latency < 500ms (95th percentile)
- [ ] Document cache hit rate > 70%
- [ ] Zero critical bugs in production

### User Experience KPIs
- [ ] Agent odpovídá na dotazy z PIL bez odkazu
- [ ] Fuzzy search rate: >90% queries najdou relevantní výsledek
- [ ] Price info displayed for >80% medicines
- [ ] Alternative suggestions provided for 100% unavailable drugs

### Business KPIs
- [ ] Snížení bounce rate o 30% (uživatelé neklikají pryč)
- [ ] Zvýšení session duration o 50%
- [ ] Pozitivní user feedback na nové features

---

## 🔒 Risk Management

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| PDF parsing fails for scanned docs | High | Return graceful error + URL fallback |
| Fuzzy search too slow | Medium | Limit candidates, add caching |
| Price data quality issues | High | Validation + data quality checks |
| Memory usage spike (caching) | Medium | LRU cache with size limit |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| SÚKL data format change | Critical | Schema validation, alerts |
| Legal concerns (medical advice) | Critical | Clear disclaimers, no prescribing |
| Performance degradation | High | Load testing, monitoring |

---

## 📞 Stakeholders

- **Product Owner**: Definice priorit a acceptance criteria
- **Backend Developer**: Implementace všech 4 EPICs
- **QA Engineer**: Test strategy a execution
- **DevOps**: Deployment a monitoring setup
- **Medical Advisor**: Validace správnosti medical logic

---

**Last Updated**: 2025-12-30
**Version**: 1.0
**Status**: Ready for Planning Phase
