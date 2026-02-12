# SUKL MCP — Implementační plán

> **Cíl:** Konsolidovat 3 oddělené projekty do jednoho Next.js 16 projektu. Výsledek: landing page + MCP server + interaktivní demo chat na jedné URL.

---

## Stav implementace

| Fáze | Popis | Stav |
|------|-------|------|
| Fáze 1 | Konsolidace do Next.js 16 | DOKONČENO |
| Fáze 2 | Deployment na Vercel | ZBÝVÁ |
| Fáze 3 | Security hardening & optimalizace | ZBÝVÁ |
| Fáze 4 | Rozšíření dat a funkcionality | ZBÝVÁ |

---

## Fáze 1: Konsolidace do Next.js 16 — DOKONČENO

### US-001: Inicializace Next.js a migrace legacy kódu
- [x] Python FastMCP server přesunut do `legacy/`
- [x] Next.js 16 projekt inicializován (App Router, TypeScript, Tailwind CSS 4)
- [x] Legacy kód smazán (rozhodnutí: nepotřebujeme referenci)

### US-002: Instalace závislostí a konfigurace
- [x] Dependencies: next 16, react 19, fuse.js, framer-motion, lucide-react, next-themes, @radix-ui/react-accordion, clsx, tailwind-merge
- [x] `tailwind.config.ts` s custom barvami (pink, pixel-blue, teal, dark-bg/card/border)
- [x] `postcss.config.mjs` s `@tailwindcss/postcss`
- [x] `vercel.json` — region fra1, rewrite `/mcp` → `/api/mcp`, CORS headers
- [x] `smithery.yaml` — HTTP transport na `sukl-mcp.vercel.app/mcp`
- [x] `.gitignore` — node_modules, .next, .env*.local, .vercel

### US-003: Data layer a TypeScript typy
- [x] `src/lib/types.ts` — plain TypeScript interfaces (bez Zod)
- [x] `src/lib/sukl-client.ts` — lazy-loading bundled JSON (9.5 MB, 68k+ léků)
- [x] `data/bundled-data.json` — komprimovaná DB z TS serveru
- [x] Fuse.js pro fuzzy vyhledávání (threshold 0.3, klíče: name, substance, sukl_code, holder)

### US-004: MCP JSON-RPC handler
- [x] `src/lib/mcp-handler.ts` — 9 MCP tools s českými popisy
- [x] JSON-RPC 2.0 metody: initialize, ping, tools/list, tools/call
- [x] Input validace (validateString, validateNumber)
- [x] Safe error handling (generic zprávy klientovi, full log na serveru)
- [x] Protocol version: 2025-03-26

### US-005: MCP API route
- [x] `src/app/api/mcp/route.ts` — POST (JSON-RPC), GET (server info), OPTIONS (CORS)
- [x] Batch request support
- [x] Notifications → HTTP 202

### US-006: Landing page migrace
- [x] 11 sekcí v `src/components/sections/`
- [x] 11 UI komponent v `src/components/ui/`
- [x] theme-provider, theme-toggle, icons
- [x] `src/lib/utils.ts` (cn helper)
- [x] `src/app/globals.css` (Tailwind + SUKL CSS proměnné)
- [x] Vizuální shoda s originálem ověřena

### US-007: Demo intent parser
- [x] `src/lib/demo-handler.ts` — regex/pattern matching (bez LLM)
- [x] Intenty: search, detail (7-ciferný kód), pharmacy, atc

### US-008: Demo API route
- [x] `src/app/api/demo/route.ts` — POST endpoint
- [x] Rate limiting: 10 req/min per IP (in-memory Map)
- [x] Validace: query 2-200 znaků

### US-009: Demo chat UI komponenty
- [x] `src/components/demo/chat-widget.tsx` — hlavní chat s auto-scroll
- [x] `src/components/demo/message-bubble.tsx` — user/assistant zprávy
- [x] `src/components/demo/medicine-card.tsx` — karta léku
- [x] `src/components/demo/example-chips.tsx` — Ibuprofen, Paralen, Lékárny v Brně, ATC N02, 0254045

### US-010: Integrace demo sekce do landing page
- [x] `src/components/sections/demo-section.tsx` — "Vyzkoušejte si to"
- [x] Přidáno do `page.tsx` mezi HowItWorks a UseCases

### US-011: Metadata a SEO
- [x] `metadataBase: new URL("https://sukl-mcp.vercel.app")`
- [x] OpenGraph URL aktualizováno na sukl-mcp.vercel.app
- [x] Security headers v `next.config.ts` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

### US-012: Cleanup
- [x] Legacy kód kompletně smazán
- [x] CLAUDE.md aktualizován pro Next.js stack
- [x] `npm run build` projde bez chyb

### Ověření (provedeno lokálně)
- [x] MCP endpoint: `initialize` → vrací server info
- [x] MCP endpoint: `tools/list` → vrací 9 tools
- [x] MCP endpoint: `tools/call search-medicine` → vrací výsledky
- [x] Demo API: "ibuprofen" → search results
- [x] Demo API: "ATC N02" → ATC info
- [x] Demo API: "lekarna brno" → pharmacy intent
- [x] Landing page vizuálně odpovídá originálu
- [x] Demo chat widget funguje s example chips

---

## Fáze 2: Deployment na Vercel — ZBÝVÁ

### US-013: Vercel deployment
- [ ] Připojit repozitář `petrsovadina/SUKL-mcp` k Vercel
- [ ] Nastavit root directory `.`, branch `main`
- [ ] Přejmenovat projekt na `sukl-mcp`
- [ ] Ověřit deployment na `sukl-mcp.vercel.app`
- [ ] Smazat starý projekt `sukl-landing` na Vercel

### US-014: Post-deployment verifikace
- [ ] Landing page na produkci funguje (light + dark mode)
- [ ] MCP endpoint odpovídá na `sukl-mcp.vercel.app/mcp`
- [ ] Demo chat funguje na produkci
- [ ] Smithery registrace funguje
- [ ] CORS headers správně nastaveny

---

## Fáze 3: Security hardening & optimalizace — ZBÝVÁ

### US-015: Content Security Policy
- [ ] Přidat CSP header (script-src, style-src, connect-src)
- [ ] Otestovat, že landing page + demo chat funguje s CSP

### US-016: Rate limiting pro MCP endpoint
- [ ] Implementovat rate limiting pro `/api/mcp` (100 req/min per IP)
- [ ] Zvážit Vercel Edge Middleware nebo Upstash Redis

### US-017: Monitoring a logging
- [ ] Přidat structured logging pro MCP tool calls
- [ ] Zvážit Vercel Analytics / Speed Insights
- [ ] Error tracking (Sentry nebo alternativa)

### US-018: Performance optimalizace
- [ ] Lazy loading pro těžké komponenty (framer-motion, particles)
- [ ] Bundle size analýza a optimalizace
- [ ] Edge runtime pro MCP route (pokud kompatibilní s fuse.js)

---

## Fáze 4: Rozšíření dat a funkcionality — ZBÝVÁ

### US-019: Reálná data lékáren
- [ ] Přidat data lékáren do bundled-data.json
- [ ] Implementovat geolokační vyhledávání

### US-020: PIL/SPC obsah
- [ ] Implementovat skutečné stahování příbalových letáků z SÚKL
- [ ] Parsování PDF dokumentů

### US-021: Reálná data o úhradách
- [ ] Přidat cenová data do bundled-data.json
- [ ] Implementovat kalkulaci doplatku pacienta

### US-022: Real-time dostupnost
- [ ] Napojení na SÚKL API pro real-time data o dostupnosti
- [ ] Cache strategie (5 min TTL)

---

## Architektura (aktuální stav)

```
SUKL-mcp/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing page + Demo sekce
│   │   ├── layout.tsx            ← Root layout (fonty, metadata, ThemeProvider)
│   │   ├── globals.css           ← Tailwind + SÚKL CSS proměnné
│   │   └── api/
│   │       ├── mcp/route.ts      ← MCP Streamable HTTP endpoint (JSON-RPC 2.0)
│   │       └── demo/route.ts     ← Demo chat backend (rate limited)
│   ├── components/
│   │   ├── sections/             ← 11 landing page sekcí + demo-section
│   │   ├── demo/                 ← Chat widget (4 komponenty)
│   │   ├── ui/                   ← 11 UI komponent
│   │   ├── icons/                ← SVG ikony
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   └── lib/
│       ├── sukl-client.ts        ← Data layer (Fuse.js, lazy-loaded JSON)
│       ├── types.ts              ← TypeScript interfaces
│       ├── mcp-handler.ts        ← JSON-RPC handler (9 tools)
│       ├── demo-handler.ts       ← Intent parser (regex)
│       └── utils.ts              ← cn() helper
├── data/
│   └── bundled-data.json         ← 9.5 MB (68k+ léků, ATC kódy)
├── package.json                  ← sukl-mcp v5.0.0
├── next.config.ts                ← Security headers
├── tailwind.config.ts            ← Custom theme
├── vercel.json                   ← Deployment config (fra1, rewrites, CORS)
├── smithery.yaml                 ← MCP registry config
└── CLAUDE.md                     ← AI assistant guidance
```

## MCP Tools (9)

| # | Tool | Popis |
|---|------|-------|
| 1 | `search-medicine` | Fuzzy vyhledávání léčiv |
| 2 | `get-medicine-details` | Detail léku dle SÚKL kódu |
| 3 | `check-availability` | Kontrola dostupnosti |
| 4 | `find-pharmacies` | Vyhledání lékáren |
| 5 | `get-atc-info` | ATC klasifikace |
| 6 | `get-reimbursement` | Úhrady a ceny |
| 7 | `get-pil-content` | Příbalový leták |
| 8 | `get-spc-content` | Souhrn údajů o přípravku |
| 9 | `batch-check-availability` | Hromadná kontrola dostupnosti |
