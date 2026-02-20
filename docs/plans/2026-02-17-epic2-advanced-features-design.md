# Epic 2: Advanced Features — Design

> **ARCHIV — DOKONČEN** (PR #36, merged). Aktuální stav viz `2026-02-20-roadmap-status.md`.

**Date:** 2026-02-17
**Status:** Implemented
**Prerekvizity:** Epic 1 (PR #35, merged)

## Goal

Vitest test suite, PIL/SPC URL resolution s docling-mcp companion, automatizovaná data pipeline, bundle optimalizace.

## Architecture Decisions

### PIL/SPC: URL Resolution + Docling Companion

Namísto stahování a parsování PDF dokumentů na serveru:

1. `get-pil-content` / `get-spc-content` vrací URL na PDF dokument ze SÚKL
2. Doporučujeme `docling-mcp` jako companion MCP server pro pokročilé zpracování
3. AI agent workflow: `sukl-mcp` (najdi lék, získej URL) → `docling-mcp` (parsuj PDF)

**Důvody:**
- PIL/SPC archivy mají stovky MB — nevejdou se na Vercel serverless
- Docling má 97.9% přesnost na tabulky, OCR support
- Zero infrastructure z naší strany (docling běží u klienta)
- Čistá separace zodpovědností

### Test Framework: Vitest

- Node environment (ne jsdom — testujeme server-side kód)
- Path alias `@/` pro konzistenci s Next.js
- Testy v `tests/` adresáři (ne `__tests__`)

### CI/CD: GitHub Action

- Cron 28. den měsíce (SÚKL publikuje ~27.)
- Spustí build-pharmacies.ts + build-reimbursements.ts
- Vytvoří PR pokud se data změní
- Manuální trigger přes workflow_dispatch

### Bundle Optimization

- @next/bundle-analyzer pro identifikaci
- framer-motion: LazyMotion + domAnimation
- Cíl: identifikovat a optimalizovat chunks >100 KB

## Scope

| Component | Popis | Priority |
|-----------|-------|----------|
| Vitest setup | Config, npm scripts | P1 |
| Unit testy | demo-handler, mcp-handler | P1 |
| Integration testy | MCP full flow | P1 |
| PIL/SPC URL resolution | Vrátit URL místo placeholder | P1 |
| Docling companion docs | Landing page sekce | P2 |
| GitHub Action | Měsíční data update | P2 |
| Bundle analyzer | Identifikace + optimalizace | P3 |

## Success Criteria

- SC-001: `npm test` projde všechny testy
- SC-002: `get-pil-content` vrací URL na SÚKL PDF (ne placeholder)
- SC-003: `get-spc-content` vrací URL na SÚKL PDF (ne placeholder)
- SC-004: GitHub Action se spustí manuálně bez chyb
- SC-005: Bundle analýza identifikuje největší chunks
- SC-006: `npm run build` prochází
- SC-007: Landing page obsahuje docling companion info
