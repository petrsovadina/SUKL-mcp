# Implementation Plan: Epic 1 — Production Ready

**Branch**: `001-production-ready` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-production-ready/spec.md`

## Summary

Dosáhnout stabilní produkce SÚKL MCP Serveru s 6/9 plně funkčními tools. Zahrnuje: (1) validaci vstupů všech MCP tools + rate limiting 100 req/min na MCP endpoint, (2) integraci dat lékáren z opendata.sukl.cz, (3) integraci úhradových dat ze SCAU seznamu, (4) structured logging + error boundary. Vše v rámci existující Next.js monolith architektury.

## Technical Context

**Language/Version**: TypeScript 5+ / Next.js 16.1.6 / React 19.2.3
**Primary Dependencies**: Fuse.js 7.1 (fuzzy search), framer-motion 12, Radix UI, lucide-react, clsx + tailwind-merge
**Storage**: `data/bundled-data.json` (9.5 MB, committed, lazy-loaded via `fs.readFileSync`)
**Testing**: `npm run build` (TypeScript type-check) — no test runner (Vitest plánován v Epic 2)
**Target Platform**: Vercel serverless, region `fra1` (Frankfurt)
**Project Type**: Single Next.js app (unified monolith)
**Performance Goals**: MCP tool response <500 ms (warm), build <60 s
**Constraints**: In-memory rate limiting (resets na cold start), bundled-data.json musí být < 15 MB po rozšíření
**Scale/Scope**: ~68k léků, ~2500 lékáren (odhad z SÚKL dat), ~8000 úhradových záznamů (odhad)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princip | Status | Poznámka |
|---|---------|--------|----------|
| I | Server-Only Data Layer | PASS | Všechna nová data budou v `bundled-data.json`, načítána v `sukl-client.ts` (server-only). Žádné klientské importy. |
| II | Plain TypeScript | PASS | Validace pomocí utility funkcí (`validateString`, `validateArray`). Žádný Zod/io-ts. Nové typy jako `interface` v `types.ts`. |
| III | Czech-First UI | PASS | Chybové zprávy v češtině. Error boundary fallback text česky. |
| IV | Build-as-Verification | PASS | `npm run build` před každým commitem. Žádné nové test dependencies. |
| V | Simplicity (YAGNI) | PASS | Žádné nové abstrakce. Rate limiting = plain Map (stejný vzor jako demo). Build skripty = standalone Node.js skripty. |
| VI | Data Integrity | PASS | Data výhradně z opendata.sukl.cz (lékárny) a sukl.gov.cz (SCAU úhrady). |
| VII | Unified Monolith | PASS | Vše v jedné Next.js aplikaci. Sdílený kód v `src/lib/`. Build skripty v `scripts/`. |

**Gate Result**: PASS — žádné porušení, pokračujeme.

## Project Structure

### Documentation (this feature)

```text
specs/001-production-ready/
├── plan.md              # This file
├── spec.md              # Feature specification (complete)
├── research.md          # Phase 0: SÚKL data format research
├── data-model.md        # Phase 1: Entity definitions + CSV mappings
├── quickstart.md        # Phase 1: Development setup guide
├── contracts/
│   └── mcp-validation.md # Phase 1: MCP tool validation contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist (16/16 pass)
└── tasks.md             # Phase 2: Task breakdown (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                    # Landing page (wrap demo with ErrorBoundary)
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Tailwind + CSS variables
│   └── api/
│       ├── mcp/route.ts            # [MODIFY] Add rate limiting, CSP
│       └── demo/route.ts           # Existing (rate limiting reference)
├── components/
│   ├── sections/
│   │   └── demo-section.tsx        # [MODIFY] Wrap with ErrorBoundary
│   ├── demo/                       # Existing demo components
│   └── ui/
│       └── error-boundary.tsx      # [NEW] React error boundary
└── lib/
    ├── types.ts                    # [MODIFY] Add BundledPharmacy, BundledReimbursement
    ├── sukl-client.ts              # [MODIFY] Load pharmacies + reimbursements from bundle
    ├── mcp-handler.ts              # [MODIFY] Add validation + structured logging
    ├── demo-handler.ts             # Existing
    └── utils.ts                    # Existing cn() helper

scripts/                            # [NEW] Data build scripts
├── build-pharmacies.ts             # [NEW] Download + parse SÚKL pharmacy CSV
└── build-reimbursements.ts         # [NEW] Download + parse SCAU reimbursement data

data/
└── bundled-data.json               # [MODIFY] Add keys `p` (pharmacies) and `r` (reimbursements)

next.config.ts                      # [MODIFY] Add CSP header
.gitignore                          # [MODIFY] Add iCloud patterns
```

**Structure Decision**: Existující monolith struktura se zachovává. Přidává se `scripts/` adresář pro data build skripty (Constitution VI — data z oficiálních zdrojů SÚKL). Build skripty jsou standalone Node.js/tsx skripty spouštěné manuálně, ne součást Next.js build pipeline.

## Implementation Approach

### User Story 1 — Bezpečný MCP endpoint (P1)

**Soubory k úpravě:**

1. **`src/lib/mcp-handler.ts`** — Vstupní validace
   - Přidat `validateString()` volání pro `sukl_code` v: `get-medicine-details`, `check-availability`, `get-reimbursement`, `get-pil-content`, `get-spc-content` (aktuálně používají `args.sukl_code as string` bez validace)
   - Přidat validaci délky query v `search-medicine`: max 200 znaků
   - Přidat `validateArray()` funkci pro `batch-check-availability`: typ array, neprázdné, max 50 položek, každý element string
   - Aktuálně `batch-check-availability` dělá `codes.slice(0, 50)` tiše — změnit na explicitní chybu při >50
   - Přidat structured JSON logging: `console.log(JSON.stringify({ event: "mcp_tool_call", tool, params, duration_ms, status }))` před return v `executeTool()`

2. **`src/app/api/mcp/route.ts`** — Rate limiting
   - Přidat rate limiting Map (stejný vzor jako `demo/route.ts`)
   - 100 req/min per IP (vs 10 req/min v demo)
   - Přidat cleanup starých záznamů: po každém requestu odebrat záznamy kde `now > resetAt`
   - Při překročení limitu: HTTP 429 + JSON-RPC response `{ code: -32000, message: "Rate limit exceeded" }`

3. **`next.config.ts`** — CSP header
   - Přidat Content-Security-Policy do existujícího `headers()` pole
   - Hodnota: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'`
   - `unsafe-inline` a `unsafe-eval` vyžadovány Next.js runtime

### User Story 2 — Vyhledání lékárny (P2)

**Soubory k úpravě/vytvoření:**

1. **`scripts/build-pharmacies.ts`** (nový)
   - Stáhnout CSV z `https://opendata.sukl.cz/soubory/NKOD/LEKARNY/nkod_lekarny_seznam.csv`
   - Encoding: **UTF-8** (korekce spec assumption — skutečné encoding je UTF-8, ne win-1250)
   - Delimiter: **čárka** (`,`)
   - Sloupce: NAZEV, KOD_PRACOVISTE, KOD_LEKARNY, ICZ, ICO, MESTO, ULICE, PSC, LEKARNIK_PRIJMENI, LEKARNIK_JMENO, LEKARNIK_TITUL, WWW, EMAIL, TELEFON, FAX, ERP, TYP_LEKARNY, ZASILKOVY_PRODEJ, POHOTOVOST
   - Mapování na BundledPharmacy: `{ n: NAZEV, k: KOD_PRACOVISTE, a: ULICE, c: MESTO, z: PSC, t: TELEFON, e: EMAIL, w: WWW, r: ERP === "1", h: POHOTOVOST === "1" }`
   - Přidat do `bundled-data.json` pod klíč `p`

2. **`src/lib/sukl-client.ts`** — Načítání lékáren
   - Přidat `BundledPharmacy` interface do interních typů
   - Rozšířit `BundledData` interface: přidat `p?: BundledPharmacy[]`
   - V `initializeData()`: transformovat `data.p` → `store.pharmacies`
   - Mapovat BundledPharmacy → Pharmacy (existující interface v types.ts)

3. **`src/lib/types.ts`** — Minimální úprava Pharmacy interface
   - Případně přidat `web: string | null` (aktuálně chybí, SÚKL data obsahují WWW)
   - Existující interface je kompatibilní

### User Story 3 — Informace o úhradách (P2)

**Soubory k úpravě/vytvoření:**

1. **`scripts/build-reimbursements.ts`** (nový)
   - Stáhnout SCAU TXT z sukl.gov.cz
   - Encoding: **WIN-1250** (vyžaduje `iconv-lite` nebo Node.js `TextDecoder("windows-1250")`)
   - Delimiter: **pipe** (`|`)
   - Žádný header řádek — pozice sloupců z SCAU dokumentace v21
   - Relevantní sloupce (pozice z SCAU formátu): SÚKL kód, úhradová skupina, maximální cena, výše úhrady, doplatek
   - Mapování na BundledReimbursement: `{ c: sukl_code, g: reimbursement_group, m: max_price, a: reimbursement_amount, s: patient_surcharge }`
   - Přidat do `bundled-data.json` pod klíč `r`

2. **`src/lib/sukl-client.ts`** — Načítání úhrad
   - Přidat `BundledReimbursement` interface
   - Rozšířit `BundledData`: přidat `r?: BundledReimbursement[]`
   - V `initializeData()`: transformovat `data.r` → `store.reimbursements` Map (key = sukl_code)

### User Story 4 — Logging & Error Boundary (P3)

**Soubory k úpravě/vytvoření:**

1. **`src/lib/mcp-handler.ts`** — Structured logging (společně s US1)
   - V `executeTool()`: měřit `performance.now()` před/po
   - Na konci: `console.log(JSON.stringify({ event: "mcp_tool_call", tool: name, params: args, duration_ms, status: "ok" }))`
   - V catch bloku: `console.log(JSON.stringify({ event: "mcp_tool_call", tool: name, params: args, duration_ms, status: "error", error: message }))`

2. **`src/components/ui/error-boundary.tsx`** (nový)
   - React class component (error boundaries vyžadují class component)
   - `getDerivedStateFromError` + `componentDidCatch`
   - Fallback: "Omlouváme se, v této sekci došlo k chybě. Zkuste obnovit stránku."
   - Prop `fallback?: React.ReactNode` pro custom fallback

3. **`src/components/sections/demo-section.tsx`** nebo `src/app/page.tsx`
   - Obalit DemoSection/GuidedTour komponentou ErrorBoundary

### Cross-cutting

1. **`.gitignore`** — Přidat iCloud patterns:
   ```
   # iCloud
   *.icloud
   .icloud
   ```

2. **`data/bundled-data.json`** — Rozšíření struktury:
   - Přidat klíč `p`: pole BundledPharmacy objektů
   - Přidat klíč `r`: pole BundledReimbursement objektů
   - Aktualizovat `_` metadata: přidat `c.p` a `c.r` počty
   - Odhadovaná velikost po rozšíření: ~11-12 MB (z 9.5 MB)

## Complexity Tracking

> Žádná porušení Constitution — tato sekce je prázdná.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Dependencies Between User Stories

```
US1 (P1: Validace + Rate Limiting)
  ↓ (žádná závislost, ale doporučeno jako první — security first)
US2 (P2: Lékárny) ←→ US3 (P2: Úhrady) — nezávislé, paralelizovatelné
  ↓
US4 (P3: Logging + Error Boundary) — logging je součást US1 implementace v mcp-handler.ts
```

**Doporučené pořadí**: US1 → US2 ∥ US3 → US4 (error boundary)

Logging se implementuje společně s validací v US1 (stejný soubor `mcp-handler.ts`), error boundary je nezávislý.

## Risk Assessment

| Risk | Pravděpodobnost | Dopad | Mitigace |
|------|----------------|-------|----------|
| SCAU formát se liší od dokumentace | Střední | Vysoký | Ověřit stažený soubor před parsováním, fail-fast s popisnou chybou |
| Bundled JSON překročí 15 MB | Nízká | Střední | Komprimovat klíče (už používáme krátké), omezit pole lékáren |
| CSP blokuje Next.js funkčnost | Střední | Střední | Povolit unsafe-inline/eval, testovat lokálně před deployem |
| Rate limit Map memory leak | Nízká | Nízký | Cleanup starých entries po každém requestu |
