# Tasks: Dokončení formulářů a Resend email integrace

**Input**: Design documents from `/specs/001-forms-resend-completion/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/newsletter-api.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Notion CRM databáze — vytvoření přes MCP a konfigurace env proměnných

- [x] T001 Vytvořit Notion databázi "SUKL MCP — Leads" pod parent page 318f7f27 přes Notion MCP — ID: 1c851a6a887d49198b4bdd29275b8ac2
- [x] T002 Vytvořit Notion databázi "SUKL MCP — Enterprise" pod parent page 318f7f27 přes Notion MCP — ID: edc64118b1424db48d33a2ebafb41b2f
- [x] T003 Vytvořit Notion databázi "SUKL MCP — Newsletter" pod parent page 318f7f27 přes Notion MCP — ID: 2e03cd2171b94ce6a1d0e3e97093daa0
- [x] T004 Zapsat Database IDs z T001–T003 do .env.local a .env.example

**Checkpoint**: Tři Notion databáze existují, env proměnné nastaveny.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sdílené helpery potřebné pro více user stories

**⚠️ CRITICAL**: US1–US5 závisí na dokončení této fáze.

- [x] T005 Přidat funkci `emailWrapper(title: string, bodyHtml: string): string` do src/lib/resend.ts
- [x] T006 Přidat funkci `checkNewsletterDuplicate(email: string): Promise<boolean>` do src/lib/notion.ts
- [x] T007 Rozšířit funkci `createNewsletterSubscriber` v src/lib/notion.ts — +gdprConsentAt parametr, +GDPR Souhlas property

**Checkpoint**: Helpery připraveny, newsletter Notion funkce rozšířena o GDPR.

---

## Phase 3: User Story 1 — Newsletter: Resend potvrzovací email (Priority: P1) 🎯 MVP

**Goal**: Po přihlášení k newsletteru systém odešle potvrzovací email přes Resend.

**Independent Test**: Odeslat newsletter formulář → ověřit záznam v Notion DB + email v Resend logu.

### Implementation for User Story 1

- [x] T008 [US1] Přidat funkci `sendNewsletterConfirmation(email: string)` do src/lib/resend.ts
- [x] T009 [US1] Upravit POST handler v src/app/api/newsletter/route.ts — Resend integrace (non-blocking)
- [x] T010 [US1] Přidat validaci `gdprConsentAt` do src/app/api/newsletter/route.ts

**Checkpoint**: Newsletter API odesílá potvrzovací email + vyžaduje GDPR souhlas. Manuální test: POST /api/newsletter s platným emailem + gdprConsentAt.

---

## Phase 4: User Story 5 — Ochrana proti duplicitním newsletter přihlášením (Priority: P2)

**Goal**: Systém detekuje duplicitní email v Newsletter DB a vrátí informativní zprávu místo vytvoření duplicity.

**Independent Test**: Dvojité odeslání stejného emailu → druhé vrátí success s message, jen 1 záznam v Notion.

### Implementation for User Story 5

- [x] T011 [US5] Přidat dedup check do src/app/api/newsletter/route.ts — checkNewsletterDuplicate před insert

**Checkpoint**: Duplicitní email vrací 200 s informativní zprávou, nový email se vytvoří normálně.

---

## Phase 5: User Story 3 — Newsletter: analytické sledování (Priority: P2)

**Goal**: Newsletter formulář odesílá analytické eventy shodně s Register a Contact formuláři.

**Independent Test**: Odeslat newsletter formulář → v browser console/network tab vidět trackEvent volání.

### Implementation for User Story 3

- [x] T012 [US3] Přidat analytické eventy do NewsletterForm v src/components/sections/footer.tsx
- [x] T013 [US3] Přidat GDPR checkbox do NewsletterForm v src/components/sections/footer.tsx

**Checkpoint**: Newsletter formulář sleduje eventy a vyžaduje GDPR souhlas v UI.

---

## Phase 6: User Story 4 — Resend email šablony: vylepšení designu (Priority: P3)

**Goal**: Všechny Resend emaily mají konzistentní, profesionální vzhled s brandem SÚKL MCP.

**Independent Test**: Odeslat registrační a enterprise formulář → vizuální kontrola emailu.

### Implementation for User Story 4

- [x] T014 [P] [US4] Refaktorovat `sendRegistrationConfirmation` v src/lib/resend.ts — emailWrapper()
- [x] T015 [P] [US4] Refaktorovat `sendEnterpriseNotification` v src/lib/resend.ts — emailWrapper()

**Checkpoint**: Všechny 3 emaily (registrace, enterprise, newsletter) mají shodný brand layout.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testy, verifikace, dokumentace

- [x] T016 Vytvořit test soubor tests/lib/newsletter-route.test.ts — 8 testů
- [x] T017 Spustit `npm run build` — PASS
- [x] T018 Spustit `npm test` — 36 testů PASS (28 existujících + 8 nových)
- [x] T019 Manuální end-to-end test: Register, Contact, Newsletter — všechny PASS, dedup funguje
- [x] T020 Aktualizovat CLAUDE.md — newsletter Resend integrace, počet testů 36

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Žádné závislosti — začít ihned
- **Phase 2 (Foundational)**: Závisí na Phase 1 (potřebuje Newsletter DB ID pro query)
- **Phase 3 (US1)**: Závisí na Phase 2 (potřebuje emailWrapper + GDPR rozšíření)
- **Phase 4 (US5)**: Závisí na Phase 2 (potřebuje checkNewsletterDuplicate)
- **Phase 5 (US3)**: Nezávisí na Phase 3/4 — může běžet paralelně (frontend only)
- **Phase 6 (US4)**: Závisí na Phase 2 (potřebuje emailWrapper)
- **Phase 7 (Polish)**: Závisí na dokončení Phase 3–6

### User Story Dependencies

- **US2 (Notion DB)**: Phase 1 — prerequisite pro vše
- **US1 (Newsletter Resend)**: Phase 3 — závisí na Phase 2, nezávisí na jiné US
- **US5 (Dedup)**: Phase 4 — závisí na Phase 2, nezávisí na jiné US
- **US3 (Analytics + GDPR UI)**: Phase 5 — nezávisí na backend změny, paralelizovatelné
- **US4 (Email design)**: Phase 6 — závisí jen na emailWrapper z Phase 2

### Parallel Opportunities

```
Phase 2: T005, T006, T007 mohou běžet paralelně (různé funkce v různých souborech)
Phase 3+4+5+6: US1, US5, US3, US4 mohou běžet paralelně po Phase 2
Phase 6: T014, T015 mohou běžet paralelně (různé funkce)
```

---

## Parallel Example: After Phase 2

```bash
# Tyto tasky mohou běžet paralelně (různé soubory/funkce):
Task T008: "sendNewsletterConfirmation v src/lib/resend.ts" (US1)
Task T012: "Analytics eventy v src/components/sections/footer.tsx" (US3)
Task T014: "Refaktor sendRegistrationConfirmation v src/lib/resend.ts" (US4)
# Pozor: T008 a T014 jsou ve stejném souboru — lépe sekvenčně
```

---

## Implementation Strategy

### MVP First (US2 + US1 Only)

1. Complete Phase 1: Notion DB creation ✅
2. Complete Phase 2: Foundational helpers ✅
3. Complete Phase 3: Newsletter Resend email ✅
4. **STOP and VALIDATE**: Test newsletter API — email doručen, GDPR uložen
5. Deploy pokud ready

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. Phase 3 (US1) → Newsletter funguje s Resend → **MVP!**
3. Phase 4 (US5) → Dedup ochrana
4. Phase 5 (US3) → Analytics + GDPR UI
5. Phase 6 (US4) → Polished email design
6. Phase 7 → Testy + verifikace → **PR ready**

---

## Notes

- T001–T003 (Notion DB creation) se provádí přes Notion MCP nástroje, ne kódem
- Resend selhání je vždy non-blocking — pattern ze stávajících routes
- Newsletter formulář je v `footer.tsx` jako `NewsletterForm` komponenta (ne modal)
- Všechny texty v češtině (FR-009)
- Po Phase 7 spustit quickstart.md verification checklist
