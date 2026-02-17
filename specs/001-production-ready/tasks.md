# Tasks: Epic 1 — Production Ready

**Input**: Design documents from `/specs/001-production-ready/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/mcp-validation.md, quickstart.md

**Tests**: Spec nespecifikuje test runner — ověření pomocí `npm run build` a manuálních curl testů (viz quickstart.md).

**Organization**: Tasky organizovány podle user stories pro nezávislou implementaci a testování každé story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralelizovatelný (jiné soubory, žádné závislosti)
- **[Story]**: US1, US2, US3, US4

---

## Phase 1: Setup

**Purpose**: Příprava repozitáře a adresářové struktury

- [x] T001 Add iCloud patterns (`*.icloud`, `.icloud`) to `.gitignore`
- [x] T002 [P] Create `scripts/` directory at repository root

**Checkpoint**: Repozitář připraven pro implementaci.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sdílená infrastruktura vyžadovaná všemi user stories

**CRITICAL**: Žádná user story nemůže začít bez dokončení této fáze.

- [x] T003 Add `validateArray()` utility function in `src/lib/mcp-handler.ts` — accepts `(value: unknown, name: string, maxItems: number): string[]`, validates non-empty array of non-empty strings with max items limit, throws Error with Czech message
- [x] T004 [P] Add `BundledPharmacy` interface to internal types in `src/lib/sukl-client.ts` — short keys: `n` (name), `k` (workplace code), `a` (address), `c` (city), `z` (postal code), `t` (phone), `e` (email), `w` (web), `r` (eRecept boolean), `h` (24h boolean)
- [x] T005 [P] Add `BundledReimbursement` interface to internal types in `src/lib/sukl-client.ts` — short keys: `c` (sukl_code), `g` (reimbursement_group), `m` (max_price), `a` (reimbursement_amount), `s` (patient_surcharge)
- [x] T006 Extend `BundledData` interface in `src/lib/sukl-client.ts` — add optional `p?: BundledPharmacy[]` and `r?: BundledReimbursement[]` keys, extend metadata `_` with optional `c.p?: number` and `c.r?: number` counts (depends on T004, T005)

**Checkpoint**: Foundation ready — user story implementace může začít.

---

## Phase 3: User Story 1 — Bezpečný MCP endpoint (Priority: P1) MVP

**Goal**: Validace vstupů všech 9 MCP tools + rate limiting 100 req/min + CSP header + structured logging.

**Independent Test**: Odeslat MCP požadavky s nevalidními parametry (prázdný string, číslo místo stringu, query >200 znaků, batch >50) a ověřit chybové zprávy. Odeslat 101 požadavků za minutu a ověřit HTTP 429. Zkontrolovat stdout JSON logy.

### Implementation for User Story 1

- [x] T007 [US1] Add `validateString()` call for `sukl_code` parameter in `get-medicine-details` case in `src/lib/mcp-handler.ts` — replace `const code = args.sukl_code as string` with `const code = validateString(args.sukl_code, "sukl_code")`
- [x] T008 [US1] Add `validateString()` call for `sukl_code` parameter in `check-availability`, `get-reimbursement`, `get-pil-content`, `get-spc-content` cases in `src/lib/mcp-handler.ts` — same pattern as T007 for each case block
- [x] T009 [US1] Add `validateString()` call for `atc_code` parameter in `get-atc-info` case in `src/lib/mcp-handler.ts` — replace `const atcCode = args.atc_code as string` with `const atcCode = validateString(args.atc_code, "atc_code")`
- [x] T010 [US1] Add query length validation (max 200 chars) in `search-medicine` case in `src/lib/mcp-handler.ts` — after existing `validateString()` call, add `if (query.length > 200) throw new Error("Vyhledávací dotaz nesmí překročit 200 znaků.")`
- [x] T011 [US1] Replace silent `codes.slice(0, 50)` with `validateArray(args.sukl_codes, "sukl_codes", 50)` in `batch-check-availability` case in `src/lib/mcp-handler.ts` — use new validateArray from T003
- [x] T012 [US1] Add structured JSON logging in `executeTool()` function in `src/lib/mcp-handler.ts` — add `const startTime = performance.now()` at top, log `JSON.stringify({ event: "mcp_tool_call", tool: name, params: args, duration_ms, status: "ok" })` before return, and `status: "error"` with error message in catch block
- [x] T013 [US1] Add rate limiting (100 req/min per IP) to MCP endpoint in `src/app/api/mcp/route.ts` — implement `rateLimitMap` Map with `checkRateLimit()` function (same pattern as `src/app/api/demo/route.ts` but with RATE_LIMIT=100), add stale entry cleanup, return HTTP 429 with JSON-RPC error `{ code: -32000, message: "Překročen limit požadavků..." }`
- [x] T014 [P] [US1] Add Content-Security-Policy header in `next.config.ts` — add to existing `headers()` array: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'`
- [x] T015 [US1] Verify build passes with `npm run build` after all US1 changes

**Checkpoint**: Všech 9 MCP tools validuje vstupy, MCP endpoint rate-limitován na 100 req/min, CSP header přítomen, každé volání logováno jako JSON.

---

## Phase 4: User Story 2 — Vyhledání lékárny (Priority: P2)

**Goal**: `find-pharmacies` tool vrací reálná data lékáren z SÚKL.

**Independent Test**: Zavolat `find-pharmacies` s `city: "Praha"` a ověřit neprázdný seznam lékáren.

### Implementation for User Story 2

- [x] T016 [US2] Create pharmacy data build script `scripts/build-pharmacies.ts` — download CSV from `https://opendata.sukl.cz/soubory/NKOD/LEKARNY/nkod_lekarny_seznam.csv` (UTF-8, comma delimiter), parse 19 columns, map to BundledPharmacy format (see data-model.md), read existing `data/bundled-data.json`, add/replace key `p` with pharmacy array, update `_.c.p` count, write back
- [x] T017 [US2] Add `transformBundledPharmacy()` function and pharmacy loading in `initializeData()` in `src/lib/sukl-client.ts` — check `if (data.p)`, transform each `BundledPharmacy` → `Pharmacy` (map: k→id, n→name, a→address, c→city, z→postal_code, t→phone, e→email, h→is_24h, r→has_erecept), assign to `store.pharmacies`
- [x] T018 [US2] Run `npx tsx scripts/build-pharmacies.ts` to populate `data/bundled-data.json` with pharmacy data
- [x] T019 [US2] Verify build passes and `find-pharmacies` returns results with `npm run build`

**Checkpoint**: `find-pharmacies` vrací reálné lékárny pro česká města. Tool status: funkční.

---

## Phase 5: User Story 3 — Informace o úhradách (Priority: P2)

**Goal**: `get-reimbursement` tool vrací reálné úhradové informace.

**Independent Test**: Zavolat `get-reimbursement` s platným SÚKL kódem a ověřit objekt s reimbursement_group, max_price, reimbursement_amount, patient_surcharge.

### Implementation for User Story 3

- [x] T020 [US3] Create reimbursement data build script `scripts/build-reimbursements.ts` — download SCAU TXT from sukl.gov.cz (WIN-1250 encoding, pipe delimiter, no header row), decode with `TextDecoder("windows-1250")`, parse relevant column positions for SÚKL code, reimbursement group, max price, reimbursement amount, patient surcharge (positions from SCAU v21 documentation), map to BundledReimbursement format, read existing `data/bundled-data.json`, add/replace key `r`, update `_.c.r` count, write back
- [x] T021 [US3] Add `transformBundledReimbursement()` function and reimbursement loading in `initializeData()` in `src/lib/sukl-client.ts` — check `if (data.r)`, transform each `BundledReimbursement` → `ReimbursementInfo` (map: c→sukl_code, g→reimbursement_group, m→max_price, a→reimbursement_amount, s→patient_surcharge, remaining fields null), populate `store.reimbursements` Map with sukl_code as key
- [x] T022 [US3] Run `npx tsx scripts/build-reimbursements.ts` to populate `data/bundled-data.json` with reimbursement data
- [x] T023 [US3] Verify build passes and `get-reimbursement` returns results with `npm run build`

**Checkpoint**: `get-reimbursement` vrací úhradové informace. Tool status: funkční. Celkem 6/9 tools plně funkčních (SC-001).

---

## Phase 6: User Story 4 — Error Boundary (Priority: P3)

**Goal**: Landing page zůstane funkční i při výjimce v demo komponentě.

**Independent Test**: Simulovat chybu v demo komponentě — stránka zobrazí fallback text místo pádu.

> **Poznámka**: Structured logging (FR-010) je implementováno v T012 (US1), protože se týká stejného souboru `mcp-handler.ts`.

### Implementation for User Story 4

- [x] T024 [US4] Create React error boundary component `src/components/ui/error-boundary.tsx` — class component with `getDerivedStateFromError` + `componentDidCatch`, fallback text: "Omlouváme se, v této sekci došlo k chybě. Zkuste obnovit stránku.", accept optional `fallback?: React.ReactNode` prop, log error in `componentDidCatch`
- [x] T025 [US4] Wrap DemoSection with ErrorBoundary in `src/components/sections/demo-section.tsx` or `src/app/page.tsx` — import ErrorBoundary, wrap the dynamic GuidedTour/demo component
- [x] T026 [US4] Verify build passes with `npm run build` after error boundary changes

**Checkpoint**: Landing page gracefully zvládne chybu v demo sekci. SC-007 splněno.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finální ověření všech success criteria a build stability

- [x] T027 Final `npm run build` verification — ensure clean build after all changes (SC-008)
- [x] T028 Manual verification of all 8 success criteria using curl commands from `quickstart.md` — SC-001 through SC-008

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (needs validateArray from T003)
- **US2 (Phase 4)**: Depends on Phase 2 (needs BundledPharmacy from T004, T006)
- **US3 (Phase 5)**: Depends on Phase 2 (needs BundledReimbursement from T005, T006)
- **US4 (Phase 6)**: No Phase 2 dependency (can run after Phase 1, but recommended after US1)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

```
Phase 1: Setup ──────────────────────────────────────────┐
Phase 2: Foundational ───────────────────────────────────┤
                                                         │
Phase 3: US1 (P1: Validace + Rate Limiting + Logging) ◄──┤
    ↓ doporučeno (ne blokováno)                          │
Phase 4: US2 (P2: Lékárny) ◄────────────────────────────┤
    ∥ paralelizovatelné                                  │
Phase 5: US3 (P2: Úhrady) ◄─────────────────────────────┤
    ↓                                                    │
Phase 6: US4 (P3: Error Boundary) ◄─────────────────────┘
    ↓
Phase 7: Polish
```

### Within Each User Story

- Implementation tasks in order (validation → service → endpoint)
- Build verification at end of each story
- Story complete before moving to next priority (recommended)

### Parallel Opportunities

**Within Phase 2 (Foundational):**
```
T004 (BundledPharmacy interface) ∥ T005 (BundledReimbursement interface)
→ then T006 (extend BundledData — depends on T004, T005)
```

**Between User Stories (after Phase 2):**
```
US2 (T016-T019) ∥ US3 (T020-T023)  — completely independent
US4 (T024-T026) ∥ US2/US3           — no shared files
```

**Within US1:**
```
T014 (CSP in next.config.ts) ∥ T007-T012 (mcp-handler.ts changes)
T013 (rate limiting in route.ts) — independent file, but logically after validation
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T015)
4. **STOP and VALIDATE**: Test US1 independently via curl commands
5. Deploy if ready — all 9 tools now validate inputs, endpoint rate-limited

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Security hardened → Deploy (MVP!)
3. US2 → Pharmacy search works → Deploy (5/9 → 6/9 tools!)
4. US3 → Reimbursement data works → Deploy (6/9 tools!)
5. US4 → Error boundary → Deploy (production-ready)

### Parallel Execution (if team capacity allows)

After Phase 2 completes:
- Agent A: US1 (mcp-handler.ts + route.ts + next.config.ts)
- Agent B: US2 (scripts/build-pharmacies.ts + sukl-client.ts pharmacy loading)
- Agent C: US3 (scripts/build-reimbursements.ts + sukl-client.ts reimbursement loading)

Note: US2 and US3 both modify `sukl-client.ts` — if parallelized, coordinate `initializeData()` changes to avoid merge conflicts.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- T012 implements logging (US4/FR-010) alongside US1 because they share `mcp-handler.ts`
- Build verification (T015, T019, T023, T026, T027) is the primary gate per Constitution IV
- Data build scripts (T018, T022) require network access to download SÚKL data
- Commit after each phase or user story completion
