# Implementation Plan: Dokončení formulářů a Resend email integrace

**Branch**: `001-forms-resend-completion` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-forms-resend-completion/spec.md`

## Summary

Dokončení tří akvizičních formulářů (Register, Contact, Newsletter) s plným napojením na Notion CRM a Resend email notifikace. Hlavní práce: (1) vytvoření tří Notion databází přes MCP, (2) přidání Resend integrace do newsletter route, (3) přidání GDPR checkboxu a analytiky do newsletter formuláře, (4) ochrana proti duplicitům, (5) vylepšení email šablon.

## Technical Context

**Language/Version**: TypeScript 5+ / Next.js 16.1.6 / React 19.2.3
**Primary Dependencies**: `resend` (email), `@notionhq/client` (CRM), `framer-motion` (animace), `lucide-react` (ikony)
**Storage**: Notion databases (3x: Leads, Enterprise, Newsletter) — external SaaS
**Testing**: Vitest 4 (28 existujících testů + nové pro newsletter route)
**Target Platform**: Vercel serverless (region fra1, Frankfurt)
**Project Type**: Web application (Next.js monolith)
**Performance Goals**: API response <500ms, email sending non-blocking
**Constraints**: Inline HTML emaily (bez React Email), in-memory rate limiting, Notion API query limit pro dedup
**Scale/Scope**: Nízký traffic (marketingový web), desítky formulářových submisí denně max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Server-Only Data Layer | N/A | Feature netýká se sukl-client.ts ani bundled dat |
| II. Plain TypeScript | PASS | Žádné nové validační knihovny. Validace via existující pattern (manual checks v route handlers) |
| III. Czech-First UI | PASS | FR-009 vyžaduje veškerý text v češtině |
| IV. Build & Test Verification | PASS | Nové testy pro newsletter route, build+test povinné před merge |
| V. Simplicity (YAGNI) | PASS | Žádné nové závislosti. Resend + Notion client již v package.json. Inline HTML šablony. |
| VI. Data Integrity | N/A | Feature netýká se farmaceutických dat SÚKL |
| VII. Unified Monolith | PASS | Změny v existujících souborech, žádné nové services/routes mimo stávající strukturu |

**Gate result: PASS** — žádná porušení.

## Project Structure

### Documentation (this feature)

```text
specs/001-forms-resend-completion/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── newsletter-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (changes to existing files)

```text
src/
├── lib/
│   ├── resend.ts              # MODIFY: +sendNewsletterConfirmation(), vylepšení šablon
│   └── notion.ts              # MODIFY: +checkNewsletterDuplicate(), +GDPR field pro newsletter
├── app/api/
│   └── newsletter/route.ts    # MODIFY: +Resend integrace, +dedup check, +GDPR validace
├── components/
│   └── sections/footer.tsx    # MODIFY: +GDPR checkbox, +analytics eventy v NewsletterForm

tests/
└── lib/
    └── newsletter-route.test.ts  # NEW: testy pro newsletter API (dedup, Resend, GDPR)
```

**Structure Decision**: Žádné nové adresáře ani soubory kromě testů. Veškeré změny v existujících souborech dle principu VII (Unified Monolith).

## Complexity Tracking

> Žádná porušení konstituce — tato sekce je prázdná.
