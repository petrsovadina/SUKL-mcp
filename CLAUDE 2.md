# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

SÚKL MCP Server is a Next.js 16 application that consolidates a landing page, MCP Streamable HTTP endpoint, and interactive demo chat into a single deployment. It provides AI agents access to the Czech SÚKL pharmaceutical database (~68k medicines) via the MCP protocol.

**Live URL:** https://sukl-mcp.vercel.app

## Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Architecture

### Next.js 16 App Router

- **Landing page** (`src/app/page.tsx`) — 12 sections including interactive demo
- **MCP endpoint** (`src/app/api/mcp/route.ts`) — JSON-RPC 2.0 over HTTP, 9 tools
- **Demo API** (`src/app/api/demo/route.ts`) — Pattern-matching intent parser, rate limited

### Data Layer

- **`src/lib/sukl-client.ts`** — Fuse.js search over bundled JSON data, lazy-loaded from `data/bundled-data.json` (9.5 MB, 68k+ medicines)
- **`src/lib/types.ts`** — Plain TypeScript interfaces (no Zod)
- **`src/lib/mcp-handler.ts`** — JSON-RPC 2.0 handler with MCP protocol support
- **`src/lib/demo-handler.ts`** — Regex/pattern-matching intent parser for demo chat

### MCP Tools (9 total)

1. `search-medicine` — Fuzzy search by name, substance, or SÚKL code
2. `get-medicine-details` — Full medicine info by SÚKL code
3. `check-availability` — Market availability status
4. `find-pharmacies` — Pharmacy search by location
5. `get-atc-info` — ATC classification lookup
6. `get-reimbursement` — Insurance reimbursement info
7. `get-pil-content` — Patient information leaflet
8. `get-spc-content` — Summary of product characteristics
9. `batch-check-availability` — Bulk availability check

### Key Directories

```
src/
├── app/
│   ├── api/mcp/route.ts      # MCP Streamable HTTP endpoint
│   ├── api/demo/route.ts     # Demo chat backend
│   ├── page.tsx               # Landing page
│   ├── layout.tsx             # Root layout (fonts, metadata, theme)
│   └── globals.css            # Tailwind + SÚKL CSS variables
├── components/
│   ├── sections/              # 12 landing page sections
│   ├── demo/                  # Chat widget components
│   ├── ui/                    # Reusable UI components
│   └── theme-provider.tsx     # next-themes provider
├── lib/
│   ├── sukl-client.ts         # Data access layer (server-only!)
│   ├── types.ts               # TypeScript interfaces
│   ├── mcp-handler.ts         # MCP JSON-RPC handler
│   ├── demo-handler.ts        # Demo intent parser
│   └── utils.ts               # cn() helper
data/
└── bundled-data.json          # Compressed medicine database
```

## Coding Conventions

- **No Zod** — Use plain TypeScript interfaces
- **No xMCP** — Tools are plain functions calling `sukl-client.ts`
- **Server-only imports** — `sukl-client.ts` uses `fs.readFileSync`, never import in client components
- **Czech UI text** — All user-facing strings in Czech
- **Tailwind CSS** — Using CSS variables for theming (light/dark mode)
- **Rate limiting** — Demo API: 10 req/min per IP (in-memory Map)

## Known Constraints

- `bundled-data.json` must be committed (needed for Vercel build)
- Pharmacy data not yet in bundled JSON — `find-pharmacies` returns empty results
- PIL/SPC document content not yet implemented — returns placeholder text
- Reimbursement data not yet in bundled JSON — `get-reimbursement` returns null
- Cold start on Vercel may be slow due to 9.5 MB JSON lazy-loading
