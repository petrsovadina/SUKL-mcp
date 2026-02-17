# Feature Specification: Epic 1 — Production Ready

**Feature Branch**: `001-production-ready`
**Created**: 2026-02-15
**Status**: Draft
**Input**: Systematická formalizace Epic 1 z docs/plans/2026-02-15-epics-roadmap-design.md a docs/plans/2026-02-15-epic1-production-ready.md

## Context

Projekt SÚKL MCP Server je na ~70 % dokončení. Z 9 MCP tools jsou 4 plně funkční, 2 částečně funkční a 3 nefunkční/placeholder. Cílem tohoto epicu je dosáhnout stabilní produkce s 6/9 plně funkčními tools na reálných datech SÚKL.

**Aktuální stav MCP tools:**

| Tool | Stav |
| ---- | ---- |
| search-medicine | Funkční |
| get-medicine-details | Funkční (chybí validace vstupu) |
| check-availability | Částečně (pouze registrační status) |
| find-pharmacies | Nefunkční (prázdná data) |
| get-atc-info | Funkční |
| get-reimbursement | Nefunkční (prázdná data) |
| get-pil-content | Placeholder |
| get-spc-content | Placeholder |
| batch-check-availability | Částečně (chybí validace) |

**Datové zdroje SÚKL (ověřeno):**
- Databáze léčivých přípravků (DLP) — CSV, měsíčně — již integrováno
- Seznam lékáren — CSV (win-1250), měsíčně
- Úhrady — CSV/TXT, měsíčně
- Žádné real-time REST API — pouze file-based dumps

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bezpečný MCP endpoint (Priority: P1)

AI agent se připojí k MCP serveru a volá nástroje. Server MUSÍ správně validovat všechny vstupy, odmítnout malformované požadavky a chránit se před zneužitím pomocí rate limitingu.

**Why this priority**: Bez validace vstupů a rate limitingu je endpoint zranitelný vůči injection útokům a DoS. Toto je prerekvizita pro jakékoliv produkční nasazení.

**Independent Test**: Odeslat MCP požadavky s nevalidními parametry (prázdný string, číslo místo stringu, příliš dlouhý dotaz, prázdné pole v batch) a ověřit, že server vrátí srozumitelnou chybovou zprávu. Odeslat 101 požadavků za minutu a ověřit HTTP 429.

**Acceptance Scenarios**:

1. **Given** MCP endpoint bez validace, **When** agent pošle `get-medicine-details` s `sukl_code: 123` (číslo místo stringu), **Then** server vrátí JSON-RPC error s popisem „Parametr 'sukl_code' musí být neprázdný řetězec."
2. **Given** MCP endpoint s rate limitem 100 req/min, **When** agent pošle 101. požadavek v rámci jedné minuty, **Then** server vrátí HTTP 429 s JSON-RPC error code -32000.
3. **Given** MCP endpoint, **When** agent pošle `search-medicine` s query delší než 200 znaků, **Then** server vrátí chybu o překročení maximální délky dotazu.
4. **Given** MCP endpoint, **When** agent pošle `batch-check-availability` s polem 51+ kódů, **Then** server vrátí chybu o překročení limitu 50.
5. **Given** MCP endpoint, **When** prohlížeč odešle CSP-noncompliant skript, **Then** prohlížeč ho zablokuje díky Content-Security-Policy hlavičce.

---

### User Story 2 — Vyhledání lékárny (Priority: P2)

Uživatel (farmaceut, pacient přes AI agenta) chce najít lékárny ve svém městě — filtrovat podle města, PSČ nebo dostupnosti 24h pohotovosti. Aktuálně tool `find-pharmacies` vrací prázdné výsledky, protože data lékáren nejsou v bundled JSON.

**Why this priority**: `find-pharmacies` je jeden z 9 MCP nástrojů a aktuálně je zcela nefunkční. Data lékáren jsou dostupná na opendata.sukl.cz a jejich integrace umožní reálné vyhledávání.

**Independent Test**: Zavolat `find-pharmacies` s parametrem `city: "Praha"` a ověřit, že vrátí neprázdný seznam lékáren s názvem, adresou, městem a PSČ.

**Acceptance Scenarios**:

1. **Given** bundled-data.json s daty lékáren, **When** agent zavolá `find-pharmacies` s `city: "Praha"`, **Then** server vrátí seznam lékáren v Praze s minimálně názvem, adresou, městem a PSČ.
2. **Given** lékárna s pohotovostním režimem, **When** agent zavolá `find-pharmacies` s `is_24h: true`, **Then** výsledky obsahují pouze lékárny s 24h pohotovostí.
3. **Given** neexistující město, **When** agent zavolá `find-pharmacies` s `city: "Neexistuje"`, **Then** server vrátí prázdný seznam (ne chybu).

---

### User Story 3 — Informace o úhradách léku (Priority: P2)

Uživatel chce zjistit úhradové informace o konkrétním léku — maximální cenu, výši úhrady pojišťovnou a doplatek pacienta. Aktuálně `get-reimbursement` vrací null.

**Why this priority**: Úhradové informace jsou klíčové pro farmaceuty i pacienty. Data jsou dostupná na opendata.sukl.cz a integrace je analogická k datům lékáren.

**Independent Test**: Zavolat `get-reimbursement` s platným SÚKL kódem a ověřit, že vrátí objekt s úhradovou skupinou, maximální cenou a doplatkem.

**Acceptance Scenarios**:

1. **Given** bundled-data.json s daty úhrad, **When** agent zavolá `get-reimbursement` s platným SÚKL kódem, **Then** server vrátí objekt s `reimbursement_group`, `max_price`, `reimbursement_amount` a `patient_surcharge`.
2. **Given** lék bez úhradových dat, **When** agent zavolá `get-reimbursement` s jeho SÚKL kódem, **Then** server vrátí null (ne chybu).

---

### User Story 4 — Structured logging a error boundary (Priority: P3)

Provozovatel služby potřebuje sledovat výkon a chybovost MCP nástrojů v produkci. Každé volání nástroje MUSÍ být logováno s názvem, parametry, dobou trvání a statusem. Landing page MUSÍ gracefully zvládnout chybu v demo komponentě.

**Why this priority**: Monitoring je prerekvizitou pro produkční provoz. Bez logů nelze diagnostikovat problémy. Error boundary zabrání pádu celé stránky kvůli chybě v demo sekci.

**Independent Test**: Zavolat MCP tool a ověřit, že server log (stdout) obsahuje JSON řádek s `event: "mcp_tool_call"`. Simulovat chybu v demo komponentě a ověřit, že landing page zůstane funkční.

**Acceptance Scenarios**:

1. **Given** MCP endpoint, **When** agent zavolá jakýkoliv tool, **Then** server zapíše na stdout JSON log s klíči `event`, `tool`, `params`, `duration_ms`, `status`.
2. **Given** MCP tool, který selže, **When** dojde k chybě, **Then** server zapíše JSON log se `status: "error"` a `error` message.
3. **Given** landing page s error boundary, **When** demo komponenta vyhodí výjimku, **Then** stránka zobrazí fallback text místo prázdné stránky.

---

### Edge Cases

- Co se stane, když SÚKL CSV soubor lékáren má neočekávaný formát sloupců? Skript MUSÍ vyhodit srozumitelnou chybu místo tichého selhání.
- Co se stane, když `bundled-data.json` neobsahuje klíč `p` (pharmacies)? `findPharmacies` MUSÍ vrátit prázdný seznam, nikoliv chybu.
- Co se stane, když rate limit Map roste neomezeně? Záznamy starší než window (60 s) MUSÍ být uklízeny.
- Co se stane při cold startu Vercel funkce s 9.5 MB JSON? První request bude pomalý (~1-3 s). Toto je známé omezení.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Systém MUSÍ validovat parametr `sukl_code` jako neprázdný řetězec ve všech MCP tools, které ho přijímají (`get-medicine-details`, `check-availability`, `get-reimbursement`, `get-pil-content`, `get-spc-content`).
- **FR-002**: Systém MUSÍ validovat parametr `sukl_codes` v `batch-check-availability` jako neprázdné pole řetězců s maximem 50 položek.
- **FR-003**: Systém MUSÍ omezit délku vyhledávacího dotazu v `search-medicine` na maximálně 200 znaků.
- **FR-004**: Systém MUSÍ omezit počet požadavků na MCP endpoint na 100 za minutu per IP adresa.
- **FR-005**: Systém MUSÍ odesílat HTTP hlavičku Content-Security-Policy na všech stránkách.
- **FR-006**: Systém MUSÍ stáhnout a zpracovat CSV seznam lékáren z opendata.sukl.cz (win-1250 encoding) a uložit do bundled-data.json.
- **FR-007**: Systém MUSÍ umožnit filtrování lékáren podle města, PSČ a dostupnosti 24h pohotovosti.
- **FR-008**: Systém MUSÍ stáhnout a zpracovat data úhrad z opendata.sukl.cz a uložit do bundled-data.json.
- **FR-009**: Systém MUSÍ vrátit úhradové informace (skupina, max. cena, výše úhrady, doplatek) pro platný SÚKL kód.
- **FR-010**: Systém MUSÍ logovat každé volání MCP toolu jako JSON na stdout s klíči: event, tool, params, duration_ms, status.
- **FR-011**: Systém MUSÍ zobrazit fallback UI místo prázdné stránky, pokud demo komponenta vyhodí výjimku.
- **FR-012**: Repozitář NESMÍ obsahovat iCloud duplikáty a .gitignore MUSÍ filtrovat budoucí.

### Key Entities

- **Pharmacy (Lékárna)**: Název, adresa, město, PSČ, telefon, email, web, kód pracoviště, eRecept, pohotovost 24h. Zdrojová data z CSV v win-1250.
- **Reimbursement (Úhrada)**: SÚKL kód, úhradová skupina, maximální cena, výše úhrady, doplatek pacienta. Zdrojová data z CSV/TXT.
- **RateLimitEntry**: IP adresa, počet požadavků, čas resetu. In-memory, resetuje se při cold start.

## Clarifications

### Session 2026-02-16

- Q: Jaký je skutečný formát CSV lékáren z SÚKL? → A: UTF-8 s čárkovým delimiterem (korekce původního předpokladu win-1250 / pipe)
- Q: Jaký je formát úhradových dat SCAU? → A: WIN-1250 s pipe delimiterem, bez header řádku (SCAU v21)

## Assumptions

- iCloud duplikáty byly z velké části odstraněny v commitu `2d06ca3`. Zbývá ověřit a doplnit .gitignore.
- CSP hlavička povolí `unsafe-inline` a `unsafe-eval` pro script-src (vyžadováno Next.js runtime).
- Rate limiting je in-memory a resetuje se při cold start Vercel funkce. Toto je přijatelné omezení.
- SÚKL CSV formát lékáren používá `,` (čárku) jako delimiter a UTF-8 encoding (ověřeno z opendata.sukl.cz).
- Úhradová data (SCAU) jsou pipe-delimited TXT v win-1250 bez header řádku (SCAU formát v21).
- PIL/SPC dokumenty jsou mimo scope tohoto epicu (odloženo na Epic 2).
- `check-availability` zůstane „částečně funkční" — vrací registrační status z DLP, protože SÚKL nemá real-time API pro dostupnost na trhu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 6 z 9 MCP tools vrací validní data pro platné vstupy (oproti aktuálním 4/9).
- **SC-002**: `find-pharmacies` vrací neprázdné výsledky pro existující česká města.
- **SC-003**: `get-reimbursement` vrací úhradové informace pro léky s úhradou.
- **SC-004**: 100 % MCP tools s parametrem `sukl_code` odmítne nevalidní vstup se srozumitelnou chybovou zprávou.
- **SC-005**: MCP endpoint vrátí HTTP 429 po 100+ požadavcích za minutu z jedné IP.
- **SC-006**: Každé volání MCP toolu je logováno jako strukturovaný JSON na stdout.
- **SC-007**: Landing page zůstane funkční i při výjimce v demo komponentě.
- **SC-008**: `npm run build` projde bez chyb po všech změnách.

## Scope Boundaries

### In Scope (Epic 1)

- Validace vstupů všech MCP tools
- Rate limiting MCP endpointu (100 req/min per IP)
- CSP header
- Integrace dat lékáren z SÚKL Open Data
- Integrace dat úhrad z SÚKL Open Data
- Structured logging MCP calls
- Error boundary pro landing page
- Úklid iCloud duplikátů a .gitignore

### Out of Scope (Epic 2)

- PIL/SPC dokumenty (stahování, parsování PDF, indexování)
- Automatizovaná data pipeline (GitHub Action)
- Test runner a test suite (Vitest)
- Bundle size optimalizace
- Real-time dostupnost léků (SÚKL neposkytuje API)
