# SÚKL MCP — Roadmap & Status (2026-02-20)

> Aktuální stav projektu ověřený auditem kódu, nikoliv odhadovaný.

---

## Přehled

| | Plánováno | Hotovo | Odloženo/Změněno |
|--|-----------|--------|------------------|
| **Epic 1 — Production Ready** | 10 úkolů | 9/10 | 1 kosmetický |
| **Epic 2 — Advanced Features** | 9 úkolů | 7/9 | 2 záměrně |
| **Celkem** | 19 | 16/19 (84%) | 3 |

**Verze:** 5.0.0 | **Deploy:** https://sukl-mcp.vercel.app | **MCP tools:** 9/9 funkčních

---

## EPIC 1: Production Ready — DOKONČEN (PR #35)

```
 Feature 1.1  Stabilizace & Tech Debt     [██████████] 90%
 Feature 1.2  Security Hardening           [██████████] 100%
 Feature 1.3  Data lékáren                 [██████████] 100%
 Feature 1.4  Data úhrad                   [██████████] 100%
 Feature 1.5  Monitoring & Observability   [██████████] 100%
```

### Detailní stav

| ID | Úkol | Stav | Poznámka |
|----|-------|------|----------|
| S-01 | Smazat iCloud duplikáty | ZBÝVÁ | Soubory `* 2.*` stále na disku (6 ks). Neblokující — nejsou v gitu. |
| S-02 | Opravit validaci MCP tools | HOTOVO | `validateString()` na všech `sukl_code` parametrech |
| S-03 | iCloud pattern v .gitignore | HOTOVO | `*.icloud` a `.icloud` v .gitignore |
| SC-01 | CSP header | HOTOVO | V `next.config.ts` — `default-src 'self'`, `frame-ancestors 'none'` atd. |
| SC-02 | Rate limiting MCP | HOTOVO | 100 req/min per IP v `route.ts` |
| SC-03 | Input sanitizace | HOTOVO | Batch max 50, query max 200 znaků |
| D-01 | Stáhnout CSV lékáren | HOTOVO | `scripts/build-pharmacies.ts` |
| D-02 | Rozšířit bundled JSON o lékárny | HOTOVO | 2 662 lékáren v `data.p` |
| D-03 | Implementovat findPharmacies | HOTOVO | Filtrování podle města, PSČ, 24h |
| R-01 | Stáhnout data úhrad | HOTOVO | `scripts/build-reimbursements.ts` |
| R-02 | Rozšířit bundled JSON o úhrady | HOTOVO | 8 480 záznamů v `data.r` |
| R-03 | Implementovat getReimbursement | HOTOVO | Vyhledávání, max cena, doplatek |
| M-01 | Structured logging MCP | HOTOVO | JSON log: event, tool, params, duration_ms, status |
| M-02 | Error boundary | HOTOVO | `src/components/ui/error-boundary.tsx` |

---

## EPIC 2: Advanced Features — DOKONČEN (PR #36)

```
 Feature 2.1  PIL/SPC dokumenty            [████████░░] 80%  (URL místo PDF parsingu)
 Feature 2.2  Data pipeline                [████████░░] 80%  (bez build:data npm skriptu)
 Feature 2.3  Kvalita & Testy              [██████████] 100%
 Feature 2.4  Performance                  [██████████] 100%
```

### Detailní stav

| ID | Úkol | Stav | Poznámka |
|----|-------|------|----------|
| T-01 | Nastavit Vitest | HOTOVO | `vitest.config.ts`, node environment |
| T-02 | Unit testy MCP handler | HOTOVO | 12 testů v `tests/lib/mcp-handler.test.ts` |
| T-03 | Unit testy demo handler | HOTOVO | 13 testů v `tests/lib/demo-handler.test.ts` |
| T-04 | Integration test MCP | HOTOVO | 3 testy v `tests/api/mcp-integration.test.ts` |
| P-01 | PIL/SPC stahování archivů | ZRUŠENO | Záměrná změna: archivy mají stovky MB, nevejdou se na Vercel |
| P-02 | Parsovat PDF/DOC obsah | ZRUŠENO | Delegováno na docling-mcp companion |
| P-03 | Indexovat PIL/SPC | PŘEŘEŠENO | On-demand z SÚKL REST API (`prehledy.sukl.cz/dlp/v1/`) |
| P-04 | Implementovat getDocumentContent | HOTOVO | Vrací download URL z SÚKL API + doporučení docling-mcp |
| DP-01 | Build skript pro data | HOTOVO | 2 skripty: `build-pharmacies.ts`, `build-reimbursements.ts` |
| DP-02 | GitHub Action (měsíční) | HOTOVO | `.github/workflows/update-data.yml` — cron 28. den |
| PF-01 | Bundle size analýza | HOTOVO | `@next/bundle-analyzer` + `npm run analyze` |
| PF-02 | Optimalizovat imports | HOTOVO | framer-motion lazy-loaded přes `next/dynamic` |

### Architektonická rozhodnutí (změny oproti plánu)

1. **PIL/SPC: URL Resolution místo PDF parsingu**
   - Plán: Stáhnout ZIP archivy, parsovat PDF, uložit jako pil-index.json/spc-index.json
   - Realita: On-demand fetch z SÚKL REST API, vrací URL ke stažení
   - Důvod: Archivy mají stovky MB, Vercel serverless limit. Docling-mcp má 97.9% přesnost na tabulky.

2. **Dva skripty místo jednoho build-data.ts**
   - Plán: Jeden monolitický `scripts/build-data.ts`
   - Realita: Oddělené `build-pharmacies.ts` + `build-reimbursements.ts`
   - Důvod: Lepší separace, workflow může spouštět nezávisle

3. **Žádný npm `build:data` skript**
   - Data build se spouští pouze přes GitHub Actions workflow
   - Pro manuální build: `npx tsx scripts/build-pharmacies.ts && npx tsx scripts/build-reimbursements.ts`

---

## MCP Tools — Aktuální stav (9/9)

| Tool | Status | Zdroj dat |
|------|--------|-----------|
| `search-medicine` | Funkční | bundled-data.json (Fuse.js fuzzy search) |
| `get-medicine-details` | Funkční | bundled-data.json |
| `check-availability` | Funkční | Registrační status z bundled-data.json |
| `find-pharmacies` | Funkční | bundled-data.json (2 662 lékáren) |
| `get-atc-info` | Funkční | bundled-data.json (6 907 ATC kódů) |
| `get-reimbursement` | Funkční | bundled-data.json (8 480 úhrad) |
| `get-pil-content` | Funkční | On-demand z SÚKL API (vrací URL) |
| `get-spc-content` | Funkční | On-demand z SÚKL API (vrací URL) |
| `batch-check-availability` | Funkční | bundled-data.json (max 50 ks) |

---

## Data & Infrastruktura

```
 bundled-data.json        10 MB  [██████████]  68 248 léků, 6 907 ATC, 2 662 lékáren, 8 480 úhrad
 Vitest test suite        28     [██████████]  13 demo + 12 mcp + 3 integration
 CI/CD pipeline           1      [██████████]  Měsíční cron (28. den)
 Security                        [██████████]  CSP + rate limiting + input validace
 Monitoring                      [██████████]  Structured JSON logging + error boundary
```

---

## Zbývající drobnosti (nice-to-have)

| # | Úkol | Priorita | Poznámka |
|---|------|----------|----------|
| 1 | Smazat iCloud duplikáty z disku | Nízká | 6 souborů `* 2.*` na disku, nejsou v gitu |
| 2 | Přidat npm `build:data` skript | Nízká | Pro snadnější manuální spuštění |
| 3 | `.gitignore` pattern pro `* 2.*` | Nízká | Explicitnější iCloud pattern |

---

## Možné budoucí směry (Epic 3+)

| Směr | Popis | Náročnost |
|------|-------|-----------|
| Interakce lékových přípravků | Kontrola lékových interakcí (SÚKL nemá API, vyžaduje ext. zdroj) | L |
| Alternativní přípravky | Hledání přípravků se stejnou účinnou látkou + porovnání cen | M |
| Historická data | Sledování změn cen/úhrad v čase | L |
| SSE/Streaming support | MCP Server-Sent Events pro real-time notifikace | M |
| E2E testy (Playwright) | Testování landing page + demo chatu | M |
| i18n | Anglická verze UI | S |
| Monitoring dashboard | Grafana/Vercel Analytics vizualizace MCP usage | M |
| AI-powered demo | Napojení demo chatu na LLM (Claude/GPT) místo regex | L |

---

*Tento dokument je generován na základě auditu kódu ze dne 2026-02-20.*
