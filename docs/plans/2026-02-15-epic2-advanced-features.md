# EPIC 2: Advanced Features — Implementation Plan

> **ARCHIV — NAHRAZEN** novým plánem `2026-02-18-epic2-implementation-plan.md` (PR #36). Tento dokument byl první verze, která plánovala PDF parsing lokálně. Finální implementace používá SÚKL REST API.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** PIL/SPC dokumenty z reálných SÚKL dat, automatizovaná data pipeline, test suite a performance optimalizace.

**Architecture:** Rozšířit data build skript o stahování PIL/SPC archivů (ZIP obsahující PDF/DOC). Pro parsování PDF použít `pdf-parse`. Vytvořit GitHub Action pro měsíční aktualizaci dat. Přidat Vitest pro unit a integration testy. PIL/SPC data se uloží jako separate JSON soubory (příliš velké pro bundled-data.json).

**Tech Stack:** Next.js 16.1.6, Vitest, pdf-parse, GitHub Actions

**Prerekvizity:** Epic 1 musí být dokončen (data build skript, rozšířený sukl-client).

---

## Task 1: Nastavit test runner (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Modify: `tsconfig.json` (pokud potřeba)

**Step 1: Instalovat Vitest**

```bash
npm install -D vitest @vitejs/plugin-react
```

**Step 2: Vytvořit vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Přidat test skript do package.json**

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest test runner configuration"
```

---

## Task 2: Unit testy pro demo handler

**Files:**
- Create: `tests/lib/demo-handler.test.ts`

**Step 1: Napsat testy**

```typescript
import { describe, it, expect } from "vitest";
import { parseQuery } from "@/lib/demo-handler";

describe("parseQuery", () => {
  describe("search intent", () => {
    it("returns search for plain text", () => {
      const result = parseQuery("Ibuprofen");
      expect(result.intent).toBe("search");
      expect(result.params.query).toBe("Ibuprofen");
    });

    it("returns search for multi-word query", () => {
      const result = parseQuery("paralen 500mg");
      expect(result.intent).toBe("search");
    });

    it("handles empty input", () => {
      const result = parseQuery("");
      expect(result.intent).toBe("search");
    });

    it("trims whitespace", () => {
      const result = parseQuery("  Ibuprofen  ");
      expect(result.intent).toBe("search");
    });
  });

  describe("detail intent", () => {
    it("detects 7-digit SÚKL code", () => {
      const result = parseQuery("0254045");
      expect(result.intent).toBe("detail");
      expect(result.params.sukl_code).toBe("0254045");
    });

    it("detects 4-digit code", () => {
      const result = parseQuery("1234");
      expect(result.intent).toBe("detail");
    });

    it("does not match 3-digit number as code", () => {
      const result = parseQuery("123");
      expect(result.intent).toBe("search");
    });
  });

  describe("atc intent", () => {
    it("detects ATC prefix", () => {
      const result = parseQuery("ATC N02");
      expect(result.intent).toBe("atc");
      expect(result.params.atc_code).toBe("N02");
    });

    it("detects ATC code pattern", () => {
      const result = parseQuery("N02BE01");
      expect(result.intent).toBe("atc");
      expect(result.params.atc_code).toBe("N02BE01");
    });

    it("is case insensitive", () => {
      const result = parseQuery("atc n02");
      expect(result.intent).toBe("atc");
      expect(result.params.atc_code).toBe("N02");
    });
  });

  describe("pharmacy intent", () => {
    it("detects lékárna keyword", () => {
      const result = parseQuery("lékárna v Praze");
      expect(result.intent).toBe("pharmacy");
    });

    it("detects without diacritics", () => {
      const result = parseQuery("lekarna Brno");
      expect(result.intent).toBe("pharmacy");
    });

    it("extracts city name", () => {
      const result = parseQuery("lékárny v Brně");
      expect(result.intent).toBe("pharmacy");
      expect(result.params.city).toBeDefined();
    });
  });
});
```

**Step 2: Spustit testy**

```bash
npm test
```

Expected: Všechny testy projdou (testujeme existující kód).

**Step 3: Commit**

```bash
git add tests/lib/demo-handler.test.ts
git commit -m "test: add unit tests for demo intent parser"
```

---

## Task 3: Unit testy pro MCP handler

**Files:**
- Create: `tests/lib/mcp-handler.test.ts`

**Step 1: Napsat testy**

```typescript
import { describe, it, expect } from "vitest";
import { handleJsonRpc, TOOLS } from "@/lib/mcp-handler";

describe("handleJsonRpc", () => {
  it("returns server info on initialize", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0" },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.result).toHaveProperty("serverInfo");
    expect(result!.result).toHaveProperty("protocolVersion", "2025-03-26");
  });

  it("returns tools list", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    expect(result).not.toBeNull();
    const tools = (result!.result as { tools: unknown[] }).tools;
    expect(tools).toHaveLength(9);
  });

  it("returns null for notifications (no id)", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      method: "ping",
    });
    expect(result).toBeNull();
  });

  it("returns error for unknown method", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "unknown/method",
      params: {},
    });
    expect(result!.error).toBeDefined();
    expect(result!.error!.code).toBe(-32601);
  });

  it("returns error for missing tool name", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {},
    });
    expect(result!.error).toBeDefined();
    expect(result!.error!.code).toBe(-32602);
  });

  it("returns pong for ping", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 5,
      method: "ping",
      params: {},
    });
    expect(result).not.toBeNull();
    expect(result!.result).toEqual({});
  });

  it("handles search-medicine tool call", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "ibuprofen", limit: 3 },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.result).toHaveProperty("content");
  });

  it("rejects empty query in search-medicine", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "" },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("Parametr");
  });
});

describe("TOOLS definitions", () => {
  it("has 9 tools defined", () => {
    expect(TOOLS).toHaveLength(9);
  });

  it("all tools have name, description, inputSchema", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("tool names are unique", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
```

**Step 2: Spustit testy**

```bash
npm test
```

**Step 3: Commit**

```bash
git add tests/lib/mcp-handler.test.ts
git commit -m "test: add unit tests for MCP JSON-RPC handler"
```

---

## Task 4: Integration test pro MCP API route

**Files:**
- Create: `tests/api/mcp-route.test.ts`

**Step 1: Napsat integration testy**

Pozn: Next.js App Router routes nelze snadno testovat izolovaně. Testujeme handler přímo.

```typescript
import { describe, it, expect } from "vitest";
import { handleJsonRpc } from "@/lib/mcp-handler";

describe("MCP API Integration", () => {
  it("full flow: initialize → tools/list → tools/call", async () => {
    // 1. Initialize
    const init = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "integration-test", version: "1.0" },
      },
    });
    expect(init!.result).toHaveProperty("serverInfo");

    // 2. List tools
    const list = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    const tools = (list!.result as { tools: { name: string }[] }).tools;
    expect(tools.length).toBe(9);
    expect(tools.map((t) => t.name)).toContain("search-medicine");

    // 3. Call search tool
    const search = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "paralen", limit: 5 },
      },
    });
    const content = (search!.result as { content: { text: string }[] }).content;
    const data = JSON.parse(content[0].text);
    expect(data).toHaveProperty("medicines");
    expect(data.medicines.length).toBeGreaterThan(0);
  });

  it("handles unknown tool gracefully", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "nonexistent-tool",
        arguments: {},
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("Neznámý nástroj");
  });
});
```

**Step 2: Spustit testy**

```bash
npm test
```

**Step 3: Commit**

```bash
git add tests/api/mcp-route.test.ts
git commit -m "test: add integration tests for MCP endpoint flow"
```

---

## Task 5: PIL/SPC stahování a parsování

**Files:**
- Create: `scripts/build-documents.ts`
- Modify: `package.json`

**Step 1: Instalovat pdf-parse**

```bash
npm install pdf-parse
npm install -D @types/pdf-parse
```

**Step 2: Vytvořit build-documents.ts**

```typescript
/**
 * SÚKL PIL/SPC Document Processor
 * Downloads PIL/SPC archives from opendata.sukl.cz
 * Extracts PDF text, indexes by SÚKL code
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, extname, basename } from "path";
import { execSync } from "child_process";

const DATA_DIR = join(process.cwd(), "data");
const TEMP_DIR = join(DATA_DIR, "temp-docs");
const PIL_OUTPUT = join(DATA_DIR, "pil-index.json");
const SPC_OUTPUT = join(DATA_DIR, "spc-index.json");

// Note: URLs need to be updated monthly
const PIL_URL = "https://opendata.sukl.cz/soubory/SOD20260127/PIL20260127.zip";
const SPC_URL = "https://opendata.sukl.cz/soubory/SOD20260127/SPC20260127.zip";

interface DocumentEntry {
  code: string;
  title: string;
  content: string;
  sections: { heading: string; content: string }[];
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function extractSuklCodeFromFilename(filename: string): string | null {
  // Common patterns: PIL_0254045.pdf, SPC_0254045.pdf, 0254045.pdf
  const match = filename.match(/(\d{4,7})/);
  return match ? match[1] : null;
}

function splitIntoSections(text: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  // Common PIL/SPC section patterns
  const sectionPattern = /^(\d+\.?\s+.{5,80})$/gm;
  const parts = text.split(sectionPattern);

  for (let i = 1; i < parts.length; i += 2) {
    sections.push({
      heading: parts[i].trim(),
      content: (parts[i + 1] || "").trim(),
    });
  }

  if (sections.length === 0 && text.length > 0) {
    sections.push({ heading: "Obsah", content: text.substring(0, 5000) });
  }

  return sections;
}

async function processArchive(
  url: string,
  type: "PIL" | "SPC",
  outputPath: string
): Promise<void> {
  const zipPath = join(TEMP_DIR, `${type.toLowerCase()}.zip`);
  const extractDir = join(TEMP_DIR, type.toLowerCase());

  ensureDir(extractDir);

  console.log(`Downloading ${type} archive...`);
  execSync(`curl -L -o "${zipPath}" "${url}"`, { stdio: "inherit" });

  console.log(`Extracting...`);
  execSync(`cd "${extractDir}" && unzip -o "${zipPath}"`, { stdio: "inherit" });

  // Find all PDF files
  const files = readdirSync(extractDir).filter(
    (f) => extname(f).toLowerCase() === ".pdf"
  );
  console.log(`Found ${files.length} PDF files`);

  // Dynamically import pdf-parse (ESM compatibility)
  const pdfParse = (await import("pdf-parse")).default;

  const index: Record<string, DocumentEntry> = {};
  let processed = 0;
  let failed = 0;

  for (const file of files) {
    const code = extractSuklCodeFromFilename(file);
    if (!code) continue;

    try {
      const buffer = readFileSync(join(extractDir, file));
      const data = await pdfParse(buffer);
      const text = data.text.substring(0, 10000); // Limit to 10k chars

      index[code] = {
        code,
        title: `${type} - ${basename(file, extname(file))}`,
        content: text,
        sections: splitIntoSections(text),
      };

      processed++;
      if (processed % 100 === 0) {
        console.log(`  Processed ${processed}/${files.length}...`);
      }
    } catch {
      failed++;
    }
  }

  writeFileSync(outputPath, JSON.stringify(index));
  const sizeMB = (readFileSync(outputPath).length / 1024 / 1024).toFixed(1);
  console.log(
    `${type}: ${processed} documents processed, ${failed} failed. Output: ${sizeMB} MB`
  );
}

async function main() {
  console.log("=== SÚKL Document Processor ===\n");
  ensureDir(TEMP_DIR);

  try {
    await processArchive(PIL_URL, "PIL", PIL_OUTPUT);
  } catch (error) {
    console.error("PIL processing failed:", error);
  }

  try {
    await processArchive(SPC_URL, "SPC", SPC_OUTPUT);
  } catch (error) {
    console.error("SPC processing failed:", error);
  }

  // Cleanup
  execSync(`rm -rf "${TEMP_DIR}"`);
  console.log("\n=== Done ===");
}

main().catch(console.error);
```

**Step 3: Přidat npm skript**

```json
"build:docs": "npx tsx scripts/build-documents.ts"
```

**Step 4: Přidat data/*.json do .gitignore (kromě bundled-data.json)**

```
# Document indices (generated, too large for git)
data/pil-index.json
data/spc-index.json
data/temp/
data/temp-docs/
```

**Step 5: Commit**

```bash
git add scripts/build-documents.ts package.json .gitignore
git commit -m "feat: add PIL/SPC document processor script"
```

---

## Task 6: Implementovat getDocumentContent s reálnými daty

**Files:**
- Modify: `src/lib/sukl-client.ts`

**Step 1: Přidat lazy-loading pro PIL/SPC index**

```typescript
let _pilIndex: Record<string, DocumentEntry> | null = null;
let _spcIndex: Record<string, DocumentEntry> | null = null;

interface DocumentEntry {
  code: string;
  title: string;
  content: string;
  sections: { heading: string; content: string }[];
}

function getDocumentIndex(type: "PIL" | "SPC"): Record<string, DocumentEntry> {
  if (type === "PIL") {
    if (!_pilIndex) {
      try {
        const path = join(process.cwd(), "data/pil-index.json");
        _pilIndex = JSON.parse(readFileSync(path, "utf-8"));
      } catch {
        _pilIndex = {};
      }
    }
    return _pilIndex!;
  }
  if (!_spcIndex) {
    try {
      const path = join(process.cwd(), "data/spc-index.json");
      _spcIndex = JSON.parse(readFileSync(path, "utf-8"));
    } catch {
      _spcIndex = {};
    }
  }
  return _spcIndex!;
}
```

**Step 2: Aktualizovat getDocumentContent**

```typescript
export async function getDocumentContent(
  suklCode: string,
  documentType: "PIL" | "SPC"
): Promise<DocumentContent | null> {
  const medicine = await getMedicineByCode(suklCode);
  if (!medicine) return null;

  const index = getDocumentIndex(documentType);
  const entry = index[suklCode] || index[normalizeCode(suklCode)];

  if (entry) {
    return {
      sukl_code: suklCode,
      document_type: documentType,
      title: `${documentType} - ${medicine.name}`,
      content: entry.content,
      sections: entry.sections,
      last_updated: null,
      language: "cs",
    };
  }

  // Fallback: placeholder if document not in index
  return {
    sukl_code: suklCode,
    document_type: documentType,
    title: `${documentType} - ${medicine.name}`,
    content: `Dokument ${documentType} pro ${medicine.name} není v aktuálním indexu k dispozici.`,
    sections: [],
    last_updated: null,
    language: "cs",
  };
}
```

**Step 3: Ověřit build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/lib/sukl-client.ts
git commit -m "feat: implement real PIL/SPC document lookup from index"
```

---

## Task 7: GitHub Action pro měsíční aktualizaci dat

**Files:**
- Create: `.github/workflows/update-data.yml`

**Step 1: Vytvořit workflow**

```yaml
name: Update SÚKL Data

on:
  schedule:
    # Run on 28th of each month (SÚKL publishes on 27th)
    - cron: '0 6 28 * *'
  workflow_dispatch: # Manual trigger

permissions:
  contents: write
  pull-requests: write

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build pharmacy and reimbursement data
        run: npm run build:data

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet data/bundled-data.json; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Create PR with updated data
        if: steps.changes.outputs.changed == 'true'
        run: |
          MONTH=$(date +%Y-%m)
          BRANCH="data-update-${MONTH}"
          git checkout -b "$BRANCH"
          git add data/bundled-data.json
          git commit -m "chore: update SÚKL data for ${MONTH}"
          git push origin "$BRANCH"
          gh pr create \
            --title "Update SÚKL data (${MONTH})" \
            --body "Automated monthly update of pharmacy and reimbursement data from opendata.sukl.cz" \
            --base main
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Step 2: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/update-data.yml
git commit -m "ci: add monthly SÚKL data update workflow"
```

---

## Task 8: Bundle size analýza a optimalizace

**Files:**
- Modify: `package.json`

**Step 1: Přidat analyze skript**

```bash
npm install -D @next/bundle-analyzer
```

V `next.config.ts` přidat podmíněný wrapper:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config
};

export default process.env.ANALYZE === "true"
  ? (await import("@next/bundle-analyzer")).default({ enabled: true })(nextConfig)
  : nextConfig;
```

V `package.json`:
```json
"analyze": "ANALYZE=true npm run build"
```

**Step 2: Spustit analýzu**

```bash
npm run analyze
```

Zkontrolovat output a identifikovat velké chunks (framer-motion, fuse.js).

**Step 3: Optimalizovat framer-motion imports**

Pokud framer-motion je velký chunk, změnit importy:
```typescript
// Místo:
import { motion, AnimatePresence } from "framer-motion";
// Použít:
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
```

**Step 4: Commit**

```bash
git add next.config.ts package.json
git commit -m "chore: add bundle analyzer, optimize heavy imports"
```

---

## Task 9: Finální deploy Epic 2

**Step 1: Spustit všechny testy**

```bash
npm test
```

**Step 2: Spustit build**

```bash
npm run build
```

**Step 3: Push a PR**

```bash
git push origin neco
gh pr create --title "Epic 2: Advanced Features" --body "$(cat <<'EOF'
## Summary
- PIL/SPC document processing from SÚKL Open Data
- Vitest test suite (demo handler, MCP handler, integration)
- GitHub Action for monthly data updates
- Bundle size optimization

## MCP Tools Status After This PR
- 8/9 fully functional
- `get-pil-content` returns real document text
- `get-spc-content` returns real document text

## Test plan
- [ ] `npm test` passes all tests
- [ ] `npm run build` passes
- [ ] PIL/SPC tools return document content for valid codes
- [ ] GitHub Action runs successfully on manual trigger

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Pořadí realizace

```
Task 1 (Vitest setup) ──→ Task 2 (demo tests) ──→ Task 3 (MCP tests) ──→ Task 4 (integration tests)
Task 5 (PIL/SPC script) ──→ Task 6 (getDocumentContent)
Task 7 (GitHub Action) — nezávislý
Task 8 (bundle optimization) — nezávislý
Task 9 (deploy) — závisí na všech
```

Tasks 1→4 (testy) a Tasks 5→6 (dokumenty) lze realizovat paralelně.
