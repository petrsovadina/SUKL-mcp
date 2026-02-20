# SÚKL MCP — Roadmap Design

> **ARCHIV** — Oba epicy dokončeny. Aktuální stav viz `2026-02-20-roadmap-status.md`.

> **Datum:** 2026-02-15
> **Přístup:** Hybridní (2 Epicy)
> **Strategie:** Systematicky, ASAP, minimalizace rizik
> **Data zdroj:** SÚKL Open Data CSV (opendata.sukl.cz) — měsíční aktualizace

---

## Kontext

Projekt je na ~70 % dokončení. Fáze 1 (konsolidace do Next.js 16) je kompletní. Z 9 MCP tools jsou 4 plně funkční, 2 částečně, 3 nefunkční/placeholder. Chybí security hardening, reálná data lékáren/úhrad a PIL/SPC dokumenty.

**SÚKL data zdroje (ověřeno):**
- Databáze léčivých přípravků (DLP) — CSV, měsíčně — **již integrováno**
- Seznam lékáren — CSV (win-1250), měsíčně — `https://opendata.sukl.cz/soubory/SOD*/LEKARNY*.zip`
- PIL/SPC dokumenty — PDF/DOC v ZIP, měsíčně
- Úhrady — CSV, měsíčně
- Žádné real-time REST API — pouze file-based dumps

---

## EPIC 1: Production Ready

**Cíl:** Stabilní, bezpečná produkce se všemi 9 MCP tools funkčními na reálných datech.

### Feature 1.1: Stabilizace & Tech Debt

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| S-01 | Smazat iCloud duplikáty | Odstranit `IMPLEMENTATION-PLAN 2.md`, `package-lock 2.json`, `postcss.config 2.mjs`, `tailwind.config 2.ts`, `vercel 2.json` z disku | XS |
| S-02 | Opravit validaci MCP tools | `get-medicine-details`, `check-availability`, `get-reimbursement`, `get-pil-content`, `get-spc-content` — přidat `validateString` na `sukl_code` | S |
| S-03 | Přidat `.gitignore` pro iCloud | Přidat pattern `*\ 2.*` a `* 2.*` do `.gitignore` | XS |

### Feature 1.2: Security Hardening

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| SC-01 | CSP header | Přidat `Content-Security-Policy` do `next.config.ts`, povolit script-src pro umami + vercel analytics | S |
| SC-02 | Rate limiting MCP | 100 req/min per IP na `/api/mcp` — stejný pattern jako demo API | S |
| SC-03 | Input sanitizace | Ověřit, že `sukl_codes` v batch operaci jsou strings, omezit délku query | S |

### Feature 1.3: Data lékáren

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| D-01 | Stáhnout a zpracovat SÚKL CSV lékáren | Stáhnout `LEKARNY*.zip` z opendata.sukl.cz, parsovat CSV (win-1250), transformovat do bundled formátu | M |
| D-02 | Rozšířit bundled-data.json | Přidat pole `p` (pharmacies) do bundled JSON s komprimovaným formátem | M |
| D-03 | Implementovat `findPharmacies` | Skutečné filtrování podle města, PSČ, 24h — na reálných datech | S |

### Feature 1.4: Data úhrad

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| R-01 | Stáhnout SÚKL data úhrad | Získat cenová/úhradová data z opendata.sukl.cz (CSV), transformovat | M |
| R-02 | Rozšířit bundled-data.json o úhrady | Přidat `r` (reimbursements) mapování SÚKL kód → úhrada | M |
| R-03 | Implementovat `getReimbursement` | Funkční vyhledávání úhrad, max cena, doplatek pacienta | S |

### Feature 1.5: Monitoring & Observability

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| M-01 | Structured logging MCP calls | Logovat tool name, parametry, response time, status na každý MCP call | S |
| M-02 | Error boundary na landing page | React error boundary pro graceful degradation | S |

### Závislosti v Epic 1

```
Feature 1.1 (Stabilizace) ─┐
Feature 1.2 (Security)     ─┼─→ Feature 1.5 (Monitoring) ─→ DEPLOY
Feature 1.3 (Lékárny)      ─┤
Feature 1.4 (Úhrady)       ─┘
```

Features 1.1–1.4 lze realizovat paralelně. Feature 1.5 závisí na 1.2.

---

## EPIC 2: Advanced Features

**Cíl:** PIL/SPC dokumenty, automatizace dat, CI/CD pipeline, testy.

### Feature 2.1: PIL/SPC dokumenty

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| P-01 | Stáhnout SÚKL PIL/SPC archivy | Download ZIP z opendata.sukl.cz, extrahovat PDF/DOC | L |
| P-02 | Parsovat PDF/DOC obsah | Extrahovat text z PDF/DOC souborů, strukturovat do sekcí | L |
| P-03 | Indexovat PIL/SPC podle SÚKL kódu | Vytvořit mapování kód → obsah, uložit jako bundled data nebo separate files | M |
| P-04 | Implementovat `getDocumentContent` | Vrátit reálný obsah dokumentů místo placeholder | S |

### Feature 2.2: Data pipeline

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| DP-01 | Vytvořit build skript pro data | Node.js skript: stáhnout → parsovat → transformovat → zapsat bundled JSON | M |
| DP-02 | GitHub Action pro měsíční aktualizaci | Automatický workflow: stáhnout SÚKL data, rebuild bundled JSON, commit + PR | M |

### Feature 2.3: Kvalita & Testy

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| T-01 | Nastavit test runner | Vitest + konfigurace pro Next.js | S |
| T-02 | Unit testy pro MCP handler | Testy pro všech 9 tools, edge cases, error handling | M |
| T-03 | Unit testy pro demo handler | Testy pro intent parser (search, detail, pharmacy, atc) | S |
| T-04 | Integration test MCP endpoint | HTTP test pro POST/GET/OPTIONS na `/api/mcp` | M |

### Feature 2.4: Performance

| US | User Story | Popis | Velikost |
|----|-----------|-------|----------|
| PF-01 | Bundle size analýza | Analyzovat client bundle, identifikovat těžké dependencies | S |
| PF-02 | Optimalizovat framer-motion imports | Tree-shaking, lazy-load animovaných komponent | S |

### Závislosti v Epic 2

```
Feature 2.1 (PIL/SPC) ────────────────────────────────────────┐
Feature 2.2 (Data pipeline) ──→ Feature 2.3 (Testy) ─────────┼─→ DEPLOY
Feature 2.4 (Performance) ────────────────────────────────────┘
```

---

## MCP Tools — Cílový stav po Epic 1

| Tool | Aktuální | Po Epic 1 |
|------|----------|-----------|
| `search-medicine` | Funkční | Funkční (beze změn) |
| `get-medicine-details` | Funkční | Funkční + validace |
| `check-availability` | Částečně | Částečně (registrační status) |
| `find-pharmacies` | Nefunkční | **Funkční** (reálná data) |
| `get-atc-info` | Funkční | Funkční (beze změn) |
| `get-reimbursement` | Nefunkční | **Funkční** (reálná data) |
| `get-pil-content` | Placeholder | Placeholder → **Epic 2** |
| `get-spc-content` | Placeholder | Placeholder → **Epic 2** |
| `batch-check-availability` | Částečně | Částečně + validace |

**Po Epic 1:** 6/9 plně funkčních (ze současných 4/9)
**Po Epic 2:** 8/9 plně funkčních (check-availability zůstane na registračním statusu bez live API)

---

## Velikosti odhadů

| Velikost | Story Points | Orientační rozsah |
|----------|-------------|-------------------|
| XS | 1 | Jednořádková změna |
| S | 2-3 | Jeden soubor, jasná implementace |
| M | 5-8 | Více souborů, vyžaduje research |
| L | 13+ | Komplexní, nové závislosti, parsing |
