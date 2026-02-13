# SUKL MCP Server

**MCP server pro českou databázi léčivých přípravků SUKL** — landing page, MCP endpoint a interaktivní demo chat v jednom Next.js 16 projektu.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26-green.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Konsolidovaná aplikace: landing page + MCP Streamable HTTP endpoint + demo chat na jedné URL.

---

## O projektu

SUKL MCP Server implementuje [Model Context Protocol](https://modelcontextprotocol.io/) a poskytuje AI agentům (Claude, GPT-4, atd.) přístup k databázi **68 000+ léčivých přípravků** registrovaných v České republice.

### Hlavní funkce

- **9 MCP tools** pro komplexní práci s farmaceutickými daty
- **Fuzzy vyhledávání** pomocí Fuse.js s tolerancí překlepů
- **Landing page** s informacemi o projektu a interaktivním demo
- **Guided demo onboarding** — 3-krokový interaktivní tour (hledání → detail → ATC)
- **MCP Streamable HTTP** endpoint (JSON-RPC 2.0) na `/mcp`
- **Demo chat** bez LLM — regex/pattern matching pro ukázku tool calls
- **Dark/Light mode** s plně responzivním designem

---

## Quick Start

### Připojení MCP serveru ke Claude

Pro okamžité použití bez instalace:

```json
{
  "mcpServers": {
    "sukl": {
      "type": "url",
      "url": "https://sukl-mcp.vercel.app/mcp"
    }
  }
}
```

### Lokální vývoj

```bash
# 1. Klonovat repozitář
git clone https://github.com/petrsovadina/SUKL-mcp.git
cd SUKL-mcp

# 2. Instalovat závislosti
npm install

# 3. Spustit dev server
npm run dev

# 4. Otevřít http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

---

## MCP Tools (9)

| # | Tool | Popis |
|---|------|-------|
| 1 | `search-medicine` | Fuzzy vyhledávání léčiv podle názvu, účinné látky nebo SUKL kódu |
| 2 | `get-medicine-details` | Detail léčivého přípravku podle SUKL kódu |
| 3 | `check-availability` | Kontrola dostupnosti na trhu |
| 4 | `find-pharmacies` | Vyhledání lékáren podle města, PSC nebo 24h provozu |
| 5 | `get-atc-info` | ATC klasifikace léčiv |
| 6 | `get-reimbursement` | Informace o úhradách a cenách |
| 7 | `get-pil-content` | Příbalový leták (PIL) |
| 8 | `get-spc-content` | Souhrn údajů o přípravku (SPC) |
| 9 | `batch-check-availability` | Hromadná kontrola dostupnosti (max 50 léků) |

### Příklady použití

```bash
# Test MCP endpointu - initialize
curl -X POST https://sukl-mcp.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Seznam nástrojů
curl -X POST https://sukl-mcp.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Vyhledání léku
curl -X POST https://sukl-mcp.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search-medicine","arguments":{"query":"ibuprofen","limit":5}}}'
```

---

## Architektura

```
SUKL-mcp/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page + demo sekce
│   │   ├── layout.tsx            # Root layout (fonty, metadata, theme)
│   │   ├── globals.css           # Tailwind + SUKL CSS proměnné
│   │   └── api/
│   │       ├── mcp/route.ts      # MCP Streamable HTTP (JSON-RPC 2.0)
│   │       └── demo/route.ts     # Demo chat backend (rate limited)
│   ├── components/
│   │   ├── sections/             # 12 landing page sekcí (vč. demo)
│   │   ├── demo/                 # Guided tour + chat widget (10 komponent)
│   │   ├── ui/                   # 11 UI komponent
│   │   └── theme-provider.tsx    # next-themes provider
│   └── lib/
│       ├── sukl-client.ts        # Data layer (Fuse.js, lazy-loaded JSON)
│       ├── types.ts              # TypeScript interfaces
│       ├── mcp-handler.ts        # JSON-RPC handler (9 tools)
│       ├── demo-handler.ts       # Intent parser (regex)
│       └── utils.ts              # cn() helper
├── data/
│   └── bundled-data.json         # 9.5 MB (68k+ léků, ATC kódy)
├── vercel.json                   # Deployment config
└── smithery.yaml                 # MCP registry
```

### Technologie

- **Next.js 16** — App Router, React 19, Turbopack
- **TypeScript 5** — Strict mode, plain interfaces (bez Zod)
- **Tailwind CSS 4** — Custom theme s CSS proměnnými
- **Fuse.js** — Fuzzy search přes 68k+ záznamů
- **Framer Motion** — Animace na landing page
- **Vercel** — Deployment (region `fra1`)

### Data

Aplikace používá bundled JSON soubor (`data/bundled-data.json`, 9.5 MB) obsahující:
- **68 000+** léčivých přípravků z SUKL Open Data
- **6 900+** ATC klasifikačních kódů
- Lazy-loaded při prvním požadavku, cachováno v paměti

Data pochází z oficiálního portálu SUKL: https://opendata.sukl.cz

---

## Deployment

Projekt je nasazený na Vercel:

- **URL:** https://sukl-mcp.vercel.app
- **MCP endpoint:** https://sukl-mcp.vercel.app/mcp
- **Region:** Frankfurt (fra1)

### Vercel konfigurace

- Framework: Next.js (automatická detekce)
- Root directory: `.`
- Build command: `next build`
- `/mcp` → rewrite na `/api/mcp`
- CORS headers pro MCP endpoint (Access-Control-Allow-Origin: *)

---

## Známá omezení

- **Lékárny** — data lékáren zatím nejsou v bundled JSON, `find-pharmacies` vrací prázdný výsledek
- **PIL/SPC** — obsah dokumentů zatím není implementován, vrací placeholder
- **Úhrady** — cenová data zatím nejsou v bundled JSON, `get-reimbursement` vrací null
- **Cold start** — první požadavek na Vercel může být pomalejší kvůli lazy-loading 9.5 MB JSON

---

## Právní upozornění

Tento server poskytuje informace výhradně pro informační účely. Data mohou být zpožděná a neměla by nahrazovat konzultaci s lékařem nebo lékárníkem. Oficiální a právně závazné informace naleznete na https://www.sukl.cz.

---

## License

MIT License — viz [LICENSE](LICENSE).

Data poskytnutá SUKL pod podmínkami Open Data: https://opendata.sukl.cz/?q=podminky-uziti

---

**Vytvořeno s [Next.js](https://nextjs.org)** | **Data od [SUKL](https://opendata.sukl.cz)** | **Protokol [MCP](https://modelcontextprotocol.io)**
