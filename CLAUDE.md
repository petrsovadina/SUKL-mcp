# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SÚKL MCP Server — Next.js 16 application providing AI agents access to the Czech SÚKL pharmaceutical database (~68k medicines) via MCP protocol. Single deployment: landing page + MCP Streamable HTTP endpoint + interactive guided demo.

**Live URL:** https://sukl-mcp.vercel.app
**MCP endpoint:** https://sukl-mcp.vercel.app/mcp

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Dev server (http://localhost:3000)
npm run build     # Production build (also runs TypeScript check)
npm start         # Start production server
npm test          # Run Vitest tests
npm run test:watch # Vitest watch mode
npm run analyze   # Bundle size analysis (opens browser)
```

Tests: `npm test` runs Vitest (28 tests: unit + integration). Config in `vitest.config.ts`.

## Architecture

### Three entry points in one Next.js app

1. **Landing page** (`src/app/page.tsx`) — Client-side `"use client"` page composing 12 section components. Section order matters for scroll navigation anchors (`#quickstart`, `#tools`, `#demo`, etc.).

2. **MCP endpoint** (`src/app/api/mcp/route.ts`) — JSON-RPC 2.0 over HTTP. Delegates to `src/lib/mcp-handler.ts` which implements 9 tools. Supports batch requests. CORS wildcard enabled via `vercel.json` headers + OPTIONS handler. URL rewrite: `/mcp` → `/api/mcp`.

3. **Demo API** (`src/app/api/demo/route.ts`) — Backend for the interactive demo chat. Uses regex/pattern matching (no LLM). Rate limited: 10 req/min per IP via in-memory Map.

### Data flow

```
bundled-data.json (10.4 MB, committed)
        ↓ fs.readFileSync (lazy, cached in memory)
    sukl-client.ts (Fuse.js fuzzy search index)
       ↙        ↘
mcp-handler.ts    demo-handler.ts → demo/route.ts
       ↓
  api/mcp/route.ts
```

**Critical:** `sukl-client.ts` uses `fs.readFileSync` — it is server-only. Never import it in client components.

### Demo: Guided Tour system

The demo section uses a state machine orchestrator pattern:

- `guided-tour.tsx` — `useReducer` state machine: `intro → step-1 → step-2 → step-3 → complete → free`
- Steps chain data: step 1 search returns SÚKL code → step 2 uses it for detail → step 2 returns ATC → step 3 uses it
- `chat-widget.tsx` supports two modes via `mode` prop: `"guided"` (single suggested query) and `"free"` (enriched example chips)
- `localStorage` keys `sukl-tour-complete` / `sukl-tour-skipped` skip tour for returning visitors
- `GuidedTour` is lazy-loaded via `next/dynamic` in `demo-section.tsx` to defer framer-motion bundle

### Component layers

- `src/components/sections/` — Landing page sections (stateless, visual)
- `src/components/demo/` — Demo chat system (guided tour + chat widget + message rendering)
- `src/components/ui/` — Reusable animated components (shimmer-button, particles, typing-animation, etc.)

## Coding Conventions

- **No Zod** — Plain TypeScript interfaces in `src/lib/types.ts`
- **No xMCP framework** — MCP tools are plain functions in `mcp-handler.ts` calling `sukl-client.ts`
- **Czech UI text** — All user-facing strings must be in Czech
- **Tailwind CSS 4** — Theming via CSS variables (`--sukl-navy`, `--sukl-blue`, `--sukl-light-blue`) defined in `globals.css`
- **framer-motion** — Used for animations; wrap heavy animated components with `next/dynamic`
- **`@/*` path alias** — Maps to `./src/*` (configured in `tsconfig.json`)

## Deployment

- **Platform:** Vercel, region `fra1` (Frankfurt)
- **Config:** `vercel.json` — rewrites `/mcp` to `/api/mcp`, CORS headers for MCP endpoint
- **`bundled-data.json` must be committed** — needed at build time and runtime on Vercel (10.4 MB with medicines, pharmacies, reimbursements)

## Known Constraints

- PIL/SPC returns download URL from SÚKL API (prehledy.sukl.cz) — PDF parsing via docling-mcp companion
- In-memory rate limiting resets on serverless cold start
- Cold start may be slow due to 10.4 MB JSON lazy-loading
