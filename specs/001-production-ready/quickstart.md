# Quickstart: Epic 1 — Production Ready

**Date**: 2026-02-16
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js 18+ (pro `TextDecoder("windows-1250")` support)
- npm 9+
- Git

## Setup

```bash
# Clone a přepni na feature branch
git clone <repo-url>
cd SUKL-mcp
git checkout 001-production-ready

# Instalace závislostí
npm install

# Ověření, že projekt buildí
npm run build
```

## Development Workflow

```bash
# Dev server
npm run dev
# http://localhost:3000        — Landing page
# http://localhost:3000/mcp    — MCP endpoint (GET = info, POST = JSON-RPC)

# Po každé změně
npm run build  # TypeScript type-check + Next.js build
```

## Data Build Scripts (pro US2 + US3)

```bash
# Stažení a zpracování dat lékáren
npx tsx scripts/build-pharmacies.ts

# Stažení a zpracování úhradových dat
npx tsx scripts/build-reimbursements.ts

# Oba skripty aktualizují data/bundled-data.json
# Po spuštění ověřit: npm run build
```

## Testování MCP Endpoint

### Inicializace

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

### Vyhledání léku

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search-medicine","arguments":{"query":"ibuprofen"}}}'
```

### Test validace — nevalidní vstup

```bash
# Číslo místo stringu → měl by vrátit chybu
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get-medicine-details","arguments":{"sukl_code":123}}}'
```

### Test rate limiting

```bash
# Poslat 101 požadavků — poslední by měl vrátit 429
for i in $(seq 1 101); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":'$i',"method":"tools/list"}'
done
```

### Test lékáren (po spuštění build-pharmacies.ts)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"find-pharmacies","arguments":{"city":"Praha"}}}'
```

### Test úhrad (po spuštění build-reimbursements.ts)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get-reimbursement","arguments":{"sukl_code":"0254045"}}}'
```

## Ověření Success Criteria

| SC | Test | Jak ověřit |
|----|------|-----------|
| SC-001 | 6/9 tools funkčních | Zavolat každý tool s validním vstupem, ověřit non-null response |
| SC-002 | find-pharmacies vrací data | `find-pharmacies` s `city: "Praha"` → neprázdný seznam |
| SC-003 | get-reimbursement vrací data | `get-reimbursement` s platným kódem → objekt s cenami |
| SC-004 | Validace odmítne nevalidní vstup | Poslat `sukl_code: 123` → JSON-RPC error |
| SC-005 | Rate limit 429 | 101 requestů za minutu → HTTP 429 |
| SC-006 | Structured logging | `npm run dev`, zavolat tool, zkontrolovat stdout JSON log |
| SC-007 | Error boundary | Simulovat throw v demo → stránka zůstane funkční |
| SC-008 | Build projde | `npm run build` → exit code 0 |

## File Change Summary

| Soubor | Akce | User Story |
|--------|------|------------|
| `src/lib/mcp-handler.ts` | MODIFY | US1 + US4 |
| `src/app/api/mcp/route.ts` | MODIFY | US1 |
| `next.config.ts` | MODIFY | US1 |
| `src/lib/sukl-client.ts` | MODIFY | US2 + US3 |
| `src/lib/types.ts` | MODIFY | US2 |
| `scripts/build-pharmacies.ts` | NEW | US2 |
| `scripts/build-reimbursements.ts` | NEW | US3 |
| `src/components/ui/error-boundary.tsx` | NEW | US4 |
| `src/components/sections/demo-section.tsx` | MODIFY | US4 |
| `.gitignore` | MODIFY | Cross-cutting |
| `data/bundled-data.json` | MODIFY | US2 + US3 |
