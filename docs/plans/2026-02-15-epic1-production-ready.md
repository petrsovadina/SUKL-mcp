# EPIC 1: Production Ready — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilní, bezpečná produkce se 6/9 MCP tools funkčními na reálných datech SÚKL.

**Architecture:** Rozšíření stávajícího Next.js 16 monolitu. Data lékáren a úhrad se stáhnou z opendata.sukl.cz (CSV, win-1250 encoding) a transformují do bundled-data.json. Security se přidá na úrovni Next.js config (CSP) a route handleru (rate limiting). Žádné nové dependencies kromě `iconv-lite` pro dekódování win-1250.

**Tech Stack:** Next.js 16.1.6, TypeScript 5, Fuse.js, Node.js fs/path/zlib

**Data zdroje SÚKL:**
- Lékárny: `https://opendata.sukl.cz/soubory/SOD20260127/LEKARNY20260127.zip` (CSV, win-1250, 19 sloupců)
- Úhrady: `https://sukl.gov.cz/wp-content/uploads/2025/12/SCAU251204v21.txt` (TXT, tab-separated)

---

## Task 1: Smazat iCloud duplikáty + aktualizovat .gitignore

**Files:**
- Delete: `IMPLEMENTATION-PLAN 2.md`, `package-lock 2.json`, `postcss.config 2.mjs`, `tailwind.config 2.ts`, `vercel 2.json`
- Modify: `.gitignore`

**Step 1: Smazat duplikáty z disku**

```bash
rm -f "IMPLEMENTATION-PLAN 2.md" "package-lock 2.json" "postcss.config 2.mjs" "tailwind.config 2.ts" "vercel 2.json"
```

**Step 2: Přidat iCloud pattern do .gitignore**

Přidat na konec `.gitignore`:
```
# iCloud duplicates
* 2.*
* 2
```

**Step 3: Ověřit**

```bash
ls -la *\ 2* 2>/dev/null || echo "No duplicates found - OK"
git status
```

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: remove iCloud duplicates, add gitignore pattern"
```

---

## Task 2: Opravit validaci vstupů v MCP handler

**Files:**
- Modify: `src/lib/mcp-handler.ts:244-356`

**Step 1: Identifikovat chybějící validace**

Tyto case bloky používají `args.sukl_code as string` bez validace:
- `get-medicine-details` (řádek ~245)
- `check-availability` (řádek ~260)
- `get-reimbursement` (řádek ~311)
- `get-pil-content` (řádek ~327)
- `get-spc-content` (řádek ~341)
- `batch-check-availability` — `args.sukl_codes as string[]` bez kontroly (řádek ~357)

**Step 2: Přidat validaci na všechny sukl_code parametry**

V každém case bloku nahradit `const code = args.sukl_code as string;` za:
```typescript
const code = validateString(args.sukl_code, "sukl_code");
```

**Step 3: Přidat validaci na batch-check-availability**

Nahradit `const codes = args.sukl_codes as string[];` za:
```typescript
const rawCodes = args.sukl_codes;
if (!Array.isArray(rawCodes) || rawCodes.length === 0) {
  throw new Error("Parametr 'sukl_codes' musí být neprázdné pole.");
}
const codes = rawCodes.map((c, i) => validateString(c, `sukl_codes[${i}]`));
```

**Step 4: Ověřit build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/lib/mcp-handler.ts
git commit -m "fix: add input validation to all MCP tools"
```

---

## Task 3: CSP header

**Files:**
- Modify: `next.config.ts`

**Step 1: Přidat CSP header**

V `next.config.ts` rozšířit headers array o CSP. Povolit:
- `script-src`: `'self'`, `'unsafe-inline'`, `'unsafe-eval'` (Next.js potřebuje), `https://umami-production-ab67.up.railway.app`, `https://va.vercel-scripts.com`
- `style-src`: `'self'`, `'unsafe-inline'` (Tailwind)
- `connect-src`: `'self'`, `https://umami-production-ab67.up.railway.app`, `https://va.vercel-scripts.com`
- `img-src`: `'self'`, `data:`, `blob:`
- `font-src`: `'self'`, `https://fonts.gstatic.com`
- `frame-ancestors`: `'none'`

```typescript
import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://umami-production-ab67.up.railway.app https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://umami-production-ab67.up.railway.app https://va.vercel-scripts.com",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Step 2: Ověřit build**

```bash
npm run build
```

**Step 3: Ověřit lokálně — dev server a prohlížeč**

```bash
npm run dev
# Otevřít http://localhost:3000, zkontrolovat konzoli na CSP violations
```

**Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: add Content-Security-Policy header"
```

---

## Task 4: Rate limiting na MCP endpoint

**Files:**
- Modify: `src/app/api/mcp/route.ts`

**Step 1: Přidat rate limiting (stejný pattern jako demo API)**

Na začátek `route.ts` přidat rate limiting logiku:

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MCP_RATE_LIMIT = 100;
const MCP_RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + MCP_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MCP_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
```

V `POST` handler přidat na začátek:

```typescript
const ip =
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

if (!checkRateLimit(ip)) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32000, message: "Rate limit exceeded. Try again later." },
    },
    { status: 429 }
  );
}
```

**Step 2: Ověřit build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/mcp/route.ts
git commit -m "feat: add rate limiting to MCP endpoint (100 req/min per IP)"
```

---

## Task 5: Input sanitizace v batch operaci

**Files:**
- Modify: `src/lib/mcp-handler.ts` (batch-check-availability case)

**Step 1: Přidat max length validaci**

V `batch-check-availability` case, po validaci pole, přidat:

```typescript
if (codes.length > 50) {
  throw new Error("Parametr 'sukl_codes' může obsahovat maximálně 50 kódů.");
}
```

**Step 2: Přidat query length validaci do search-medicine**

V `search-medicine` case, po `validateString`, přidat:

```typescript
if (query.length > 200) {
  throw new Error("Vyhledávací dotaz může mít maximálně 200 znaků.");
}
```

**Step 3: Ověřit build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/lib/mcp-handler.ts
git commit -m "fix: add length validation to search query and batch codes"
```

---

## Task 6: Data build skript — stažení a parsování lékáren

**Files:**
- Create: `scripts/build-data.ts`
- Modify: `package.json` (přidat skript)

**Step 1: Instalovat iconv-lite pro dekódování win-1250**

```bash
npm install iconv-lite
npm install -D @types/node
```

**Step 2: Vytvořit build skript**

`scripts/build-data.ts`:

```typescript
/**
 * SÚKL Data Build Script
 * Downloads pharmacy and reimbursement data from opendata.sukl.cz
 * and merges into data/bundled-data.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import iconv from "iconv-lite";

const DATA_DIR = join(process.cwd(), "data");
const TEMP_DIR = join(DATA_DIR, "temp");
const BUNDLED_PATH = join(DATA_DIR, "bundled-data.json");

// SÚKL data URLs
const PHARMACY_URL = "https://opendata.sukl.cz/soubory/SOD20260127/LEKARNY20260127.zip";
const SCAU_URL = "https://sukl.gov.cz/wp-content/uploads/2025/12/SCAU251204v21.txt";

interface BundledPharmacy {
  n: string;   // name
  c: string;   // city
  a: string;   // address (ulice)
  z: string;   // postal code (PSČ)
  t: string;   // phone
  e: string;   // email
  w: string;   // web
  k: string;   // kod_pracoviste
  r: boolean;  // eRecept
  p: boolean;  // pohotovost (24h/emergency)
}

interface BundledReimbursement {
  s: string;   // sukl_code
  g: string;   // reimbursement group
  m: number | null;  // max price
  u: number | null;  // reimbursement amount
  d: number | null;  // patient surcharge (doplatek)
}

// --- Utility Functions ---

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function downloadFile(url: string, dest: string) {
  console.log(`Downloading: ${url}`);
  execSync(`curl -L -o "${dest}" "${url}"`, { stdio: "inherit" });
}

function parseWin1250CSV(buffer: Buffer, delimiter: string = "|"): string[][] {
  const text = iconv.decode(buffer, "win1250");
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(delimiter).map((field) => field.trim()));
}

// --- Pharmacy Processing ---

function processPharmacies(): BundledPharmacy[] {
  const zipPath = join(TEMP_DIR, "lekarny.zip");
  downloadFile(PHARMACY_URL, zipPath);

  // Extract ZIP
  execSync(`cd "${TEMP_DIR}" && unzip -o lekarny.zip`, { stdio: "inherit" });

  // Find the main CSV file
  const files = execSync(`ls "${TEMP_DIR}"/*.csv 2>/dev/null || echo ""`)
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);

  const mainFile = files.find((f) =>
    f.toLowerCase().includes("lekarny") && !f.toLowerCase().includes("rozhrani")
    && !f.toLowerCase().includes("prac_doba") && !f.toLowerCase().includes("typ")
  );

  if (!mainFile) {
    console.error("Pharmacy CSV not found in ZIP. Files:", files);
    return [];
  }

  console.log(`Processing: ${mainFile}`);
  const buffer = readFileSync(mainFile);
  const rows = parseWin1250CSV(buffer, "|");

  if (rows.length < 2) return [];

  // Header row
  const header = rows[0].map((h) => h.replace(/"/g, "").toUpperCase());
  const idx = (name: string) => header.indexOf(name);

  const pharmacies: BundledPharmacy[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;

    const get = (col: string) => {
      const j = idx(col);
      return j >= 0 && j < row.length ? row[j].replace(/"/g, "").trim() : "";
    };

    pharmacies.push({
      n: get("NAZEV"),
      c: get("MESTO"),
      a: get("ULICE"),
      z: get("PSC"),
      t: get("TELEFON"),
      e: get("EMAIL"),
      w: get("WWW"),
      k: get("KOD_PRACOVISTE"),
      r: get("ERP") === "1",
      p: get("POHOTOVOST") === "Ano",
    });
  }

  console.log(`Processed ${pharmacies.length} pharmacies`);
  return pharmacies;
}

// --- Reimbursement Processing ---

function processReimbursements(): BundledReimbursement[] {
  const txtPath = join(TEMP_DIR, "scau.txt");
  downloadFile(SCAU_URL, txtPath);

  const buffer = readFileSync(txtPath);
  const text = iconv.decode(buffer, "win1250");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) return [];

  // Tab-separated, first row is header
  const header = lines[0].split("\t").map((h) => h.trim().toUpperCase());
  const idx = (name: string) => {
    // Try exact match, then partial
    let i = header.indexOf(name);
    if (i >= 0) return i;
    i = header.findIndex((h) => h.includes(name));
    return i;
  };

  const reimbursements: BundledReimbursement[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t").map((c) => c.trim());
    if (cols.length < 5) continue;

    const get = (col: string) => {
      const j = idx(col);
      return j >= 0 && j < cols.length ? cols[j].replace(/"/g, "").trim() : "";
    };

    const parseNum = (val: string): number | null => {
      if (!val) return null;
      const n = parseFloat(val.replace(",", "."));
      return isNaN(n) ? null : n;
    };

    // Extract SUKL code — try common column names
    const suklCode = get("KOD_SUKL") || get("KOD") || get("SUKL") || cols[0];
    if (!suklCode || suklCode.length < 4) continue;

    reimbursements.push({
      s: suklCode,
      g: get("SKUPINA") || get("UHRADOVA_SKUPINA") || "",
      m: parseNum(get("MAX_CENA") || get("CENA_VYROBCE") || ""),
      u: parseNum(get("UHRADA") || get("ZAKLADNI_UHRADA") || ""),
      d: parseNum(get("DOPLATEK") || get("DOPLATEK_PACIENT") || ""),
    });
  }

  console.log(`Processed ${reimbursements.length} reimbursements`);
  return reimbursements;
}

// --- Main ---

async function main() {
  console.log("=== SÚKL Data Build ===\n");

  ensureDir(TEMP_DIR);

  // Load existing bundled data
  const bundled = JSON.parse(readFileSync(BUNDLED_PATH, "utf-8"));

  // Process pharmacies
  try {
    const pharmacies = processPharmacies();
    if (pharmacies.length > 0) {
      bundled.p = pharmacies;
      bundled._.c.p = pharmacies.length;
      console.log(`Added ${pharmacies.length} pharmacies to bundle\n`);
    }
  } catch (error) {
    console.error("Failed to process pharmacies:", error);
  }

  // Process reimbursements
  try {
    const reimbursements = processReimbursements();
    if (reimbursements.length > 0) {
      bundled.r = reimbursements;
      bundled._.c.r = reimbursements.length;
      console.log(`Added ${reimbursements.length} reimbursements to bundle\n`);
    }
  } catch (error) {
    console.error("Failed to process reimbursements:", error);
  }

  // Update timestamp
  bundled._.t = new Date().toISOString();

  // Write bundled data
  writeFileSync(BUNDLED_PATH, JSON.stringify(bundled));
  const sizeMB = (readFileSync(BUNDLED_PATH).length / 1024 / 1024).toFixed(1);
  console.log(`\nBundled data written: ${sizeMB} MB`);

  // Cleanup temp
  execSync(`rm -rf "${TEMP_DIR}"`);
  console.log("Temp files cleaned up");
  console.log("\n=== Done ===");
}

main().catch(console.error);
```

**Step 3: Přidat npm skript**

V `package.json` do `scripts` přidat:
```json
"build:data": "npx tsx scripts/build-data.ts"
```

**Step 4: Spustit a ověřit**

```bash
npm run build:data
```

Ověřit, že `data/bundled-data.json` obsahuje nový klíč `p` (pharmacies) a `r` (reimbursements).

**Step 5: Commit**

```bash
git add scripts/build-data.ts package.json data/bundled-data.json
git commit -m "feat: add SÚKL data build script with pharmacy and reimbursement processing"
```

---

## Task 7: Rozšířit sukl-client.ts o lékárny a úhrady

**Files:**
- Modify: `src/lib/sukl-client.ts`

**Step 1: Rozšířit BundledData interface**

Přidat do `BundledData` interface:

```typescript
interface BundledPharmacy {
  n: string;   // name
  c: string;   // city
  a: string;   // address
  z: string;   // postal code
  t: string;   // phone
  e: string;   // email
  w: string;   // web
  k: string;   // kod_pracoviste
  r: boolean;  // eRecept
  p: boolean;  // pohotovost
}

interface BundledReimbursement {
  s: string;   // sukl_code
  g: string;   // reimbursement group
  m: number | null;  // max price
  u: number | null;  // reimbursement amount
  d: number | null;  // patient surcharge
}

interface BundledData {
  m: BundledMedicine[];
  a: BundledATC[];
  p?: BundledPharmacy[];     // <-- new
  r?: BundledReimbursement[]; // <-- new
  _: {
    t: string;
    c: { m: number; a: number; p?: number; r?: number };
  };
}
```

**Step 2: Přidat transformační funkce**

```typescript
function transformBundledPharmacy(p: BundledPharmacy): Pharmacy {
  return {
    id: p.k,
    name: p.n,
    address: p.a,
    city: p.c,
    postal_code: p.z,
    phone: p.t || null,
    email: p.e || null,
    opening_hours: null,
    latitude: null,
    longitude: null,
    distance_km: null,
    is_24h: p.p,
    has_erecept: p.r,
  };
}

function transformBundledReimbursement(r: BundledReimbursement): ReimbursementInfo {
  return {
    sukl_code: r.s,
    reimbursement_group: r.g || null,
    max_price: r.m,
    reimbursement_amount: r.u,
    patient_surcharge: r.d,
    reimbursement_conditions: null,
    valid_from: null,
    valid_until: null,
  };
}
```

**Step 3: Aktualizovat initializeData()**

Po sekci `// Transform ATC codes` přidat:

```typescript
// Transform pharmacies
store.pharmacies = (data.p || []).map(transformBundledPharmacy);

// Transform reimbursements
store.reimbursements.clear();
for (const r of data.r || []) {
  const info = transformBundledReimbursement(r);
  store.reimbursements.set(info.sukl_code, info);
}
```

Aktualizovat log:

```typescript
console.log(
  `Loaded ${store.medicines.length} medicines, ${store.atcCodes.size} ATC codes, ${store.pharmacies.length} pharmacies, ${store.reimbursements.size} reimbursements from bundle`
);
```

**Step 4: Ověřit build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/lib/sukl-client.ts
git commit -m "feat: load pharmacy and reimbursement data from bundled JSON"
```

---

## Task 8: Structured logging pro MCP calls

**Files:**
- Modify: `src/lib/mcp-handler.ts`

**Step 1: Přidat logging do executeTool**

Obalit `executeTool` body logováním:

```typescript
async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: string; text: string }[] }> {
  const startTime = performance.now();
  try {
    // ... existing switch/case logic ...

    const elapsed = Math.round(performance.now() - startTime);
    console.log(JSON.stringify({
      event: "mcp_tool_call",
      tool: name,
      params: Object.keys(args),
      duration_ms: elapsed,
      status: "ok",
    }));

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    console.error(JSON.stringify({
      event: "mcp_tool_call",
      tool: name,
      params: Object.keys(args),
      duration_ms: elapsed,
      status: "error",
      error: error instanceof Error ? error.message : "unknown",
    }));
    // ... existing error handling ...
  }
}
```

**Step 2: Ověřit build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/lib/mcp-handler.ts
git commit -m "feat: add structured JSON logging to MCP tool calls"
```

---

## Task 9: Error boundary pro landing page

**Files:**
- Create: `src/components/error-boundary.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Vytvořit ErrorBoundary komponent**

```typescript
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <p className="text-muted-foreground">
            Něco se pokazilo. Zkuste obnovit stránku.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2: Obalit DemoSection v page.tsx**

```typescript
import { ErrorBoundary } from "@/components/error-boundary";
// ... v JSX:
<ErrorBoundary>
  <DemoSection />
</ErrorBoundary>
```

**Step 3: Ověřit build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/error-boundary.tsx src/app/page.tsx
git commit -m "feat: add error boundary around demo section"
```

---

## Task 10: Verifikace a deploy

**Step 1: Celkový build test**

```bash
npm run build
```

**Step 2: Lokální test MCP endpointu**

```bash
npm start &
sleep 3

# Test initialize
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Test search
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search-medicine","arguments":{"query":"ibuprofen","limit":3}}}'

# Test find-pharmacies (should return real data now)
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"find-pharmacies","arguments":{"city":"Praha"}}}'

kill %1
```

**Step 3: Commit a push**

```bash
git push origin neco
```

**Step 4: Vytvořit PR**

```bash
gh pr create --title "Epic 1: Production Ready" --body "$(cat <<'EOF'
## Summary
- Fixed input validation on all MCP tools
- Added CSP header and rate limiting (100 req/min) to MCP endpoint
- Integrated real pharmacy data from SÚKL Open Data
- Integrated reimbursement data from SÚKL SCAU
- Added structured JSON logging for MCP calls
- Added error boundary for graceful UI degradation
- Cleaned up iCloud duplicates

## MCP Tools Status After This PR
- 6/9 fully functional (was 4/9)
- `find-pharmacies` now returns real data
- `get-reimbursement` now returns real data

## Test plan
- [ ] `npm run build` passes
- [ ] MCP endpoint responds to initialize, tools/list, tools/call
- [ ] `find-pharmacies` returns pharmacies for "Praha"
- [ ] `get-reimbursement` returns data for valid SÚKL code
- [ ] Rate limiting returns 429 after 100 requests
- [ ] CSP header present in response headers
- [ ] Demo chat still works

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Pořadí realizace

```
Task 1 (iCloud cleanup)  ─┐
Task 2 (validace)         ─┤
Task 3 (CSP)              ─┼─→ Task 8 (logging) ─→ Task 9 (error boundary) ─→ Task 10 (deploy)
Task 4 (rate limit)       ─┤
Task 5 (sanitizace)       ─┤
Task 6 (data skript)      ─┼─→ Task 7 (sukl-client rozšíření)
```

Tasks 1-6 lze realizovat paralelně (nezávislé). Task 7 závisí na Task 6. Tasks 8-9 jsou nezávislé. Task 10 je finální.
