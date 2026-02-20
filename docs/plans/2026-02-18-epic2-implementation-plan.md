# Epic 2: Advanced Features — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vitest test suite, PIL/SPC on-demand z SÚKL API, GitHub Action pro měsíční aktualizaci dat, bundle optimalizace.

**Architecture:** Přidat Vitest pro unit/integration testy. Přepsat `getDocumentContent()` na fetch z SÚKL REST API (`prehledy.sukl.cz/dlp/v1/dokumenty-metadata/{kód}`). Vrátit metadata + download URL. Doporučit docling-mcp jako companion pro parsování PDF. GitHub Action pro automatický PR s aktualizovanými daty.

**Tech Stack:** Vitest 3.x, @next/bundle-analyzer, SÚKL REST API (`prehledy.sukl.cz/dlp/v1/`)

**SÚKL Document API:**
- Base: `https://prehledy.sukl.cz/dlp/v1/`
- `GET /dokumenty-metadata/{kodSukl}` → `[{id, typ, nazev}]`
- `GET /dokumenty/{id}` → PDF download
- `GET /dokumenty/{kodSukl}/pil` → přímý PIL PDF download
- `GET /dokumenty/{kodSukl}/spc` → přímý SPC PDF download

---

## Task 1: Nastavit Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Step 1: Instalovat Vitest**

```bash
npm install -D vitest
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

**Step 3: Přidat test skripty do package.json**

V `"scripts"` přidat:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Ověřit**

```bash
npx vitest run
```

Expected: `No test files found` (žádné testy zatím neexistují, ale vitest funguje).

**Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest test runner configuration"
```

---

## Task 2: Unit testy pro demo-handler

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
      expect(result.params.query).toBe("Ibuprofen");
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

    it("is case insensitive for ATC prefix", () => {
      const result = parseQuery("atc n02");
      expect(result.intent).toBe("atc");
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
npx vitest run tests/lib/demo-handler.test.ts
```

Expected: Všechny testy PASS.

**Step 3: Commit**

```bash
git add tests/lib/demo-handler.test.ts
git commit -m "test: add unit tests for demo intent parser"
```

---

## Task 3: Unit testy pro mcp-handler

**Files:**
- Create: `tests/lib/mcp-handler.test.ts`

**Step 1: Napsat testy**

```typescript
import { describe, it, expect } from "vitest";
import { handleJsonRpc, TOOLS } from "@/lib/mcp-handler";

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

  it("returns tools list with 9 tools", async () => {
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

  it("rejects empty query in search-medicine", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "" },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("Parametr");
  });

  it("rejects query over 200 chars", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "a".repeat(201) },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("200");
  });

  it("returns unknown tool message for nonexistent tool", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 8,
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
npx vitest run tests/lib/mcp-handler.test.ts
```

Expected: Všechny testy PASS. (Tyto testy vyžadují `data/bundled-data.json`.)

**Step 3: Commit**

```bash
git add tests/lib/mcp-handler.test.ts
git commit -m "test: add unit tests for MCP JSON-RPC handler"
```

---

## Task 4: Integration test — MCP full flow

**Files:**
- Create: `tests/api/mcp-integration.test.ts`

**Step 1: Napsat testy**

```typescript
import { describe, it, expect } from "vitest";
import { handleJsonRpc } from "@/lib/mcp-handler";

describe("MCP Full Flow Integration", () => {
  it("initialize → tools/list → search-medicine", async () => {
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

    // 3. Search
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

  it("get-reimbursement returns real data", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "get-reimbursement",
        arguments: { sukl_code: "0094156" },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    const data = JSON.parse(content[0].text);
    expect(data.reimbursement_group).toBe("ATB");
    expect(data.max_price).toBeGreaterThan(0);
  });

  it("find-pharmacies returns results for Praha", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "find-pharmacies",
        arguments: { city: "Praha" },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    const data = JSON.parse(content[0].text);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].city).toBe("Praha");
  });
});
```

**Step 2: Spustit všechny testy**

```bash
npx vitest run
```

Expected: Všechny testy PASS.

**Step 3: Commit**

```bash
git add tests/api/mcp-integration.test.ts
git commit -m "test: add integration tests for MCP endpoint flow"
```

---

## Task 5: Implementovat PIL/SPC on-demand z SÚKL API

**Files:**
- Modify: `src/lib/types.ts` (rozšířit DocumentContent)
- Modify: `src/lib/sukl-client.ts` (přepsat getDocumentContent)

**Step 1: Rozšířit DocumentContent typ v `src/lib/types.ts`**

Přidat pole `document_url` do `DocumentContent`:

```typescript
export interface DocumentContent {
  sukl_code: string;
  document_type: "PIL" | "SPC";
  title: string;
  content: string;
  sections: { heading: string; content: string }[];
  last_updated: string | null;
  language: string;
  document_url: string | null;  // NEW: přímá URL na PDF ze SÚKL
}
```

**Step 2: Přepsat getDocumentContent v `src/lib/sukl-client.ts`**

Nahradit stávající implementaci (řádky 350-366):

```typescript
const SUKL_API_BASE = "https://prehledy.sukl.cz/dlp/v1";

interface SuklDocumentMeta {
  id: number;
  typ: string;
  nazev: string;
}

export async function getDocumentContent(
  suklCode: string,
  documentType: "PIL" | "SPC"
): Promise<DocumentContent | null> {
  const medicine = await getMedicineByCode(suklCode);
  if (!medicine) return null;

  try {
    const res = await fetch(
      `${SUKL_API_BASE}/dokumenty-metadata/${suklCode}`
    );

    if (!res.ok) {
      return {
        sukl_code: suklCode,
        document_type: documentType,
        title: `${documentType} - ${medicine.name}`,
        content: `Dokumenty pro ${medicine.name} nejsou v SÚKL API k dispozici.`,
        sections: [],
        last_updated: null,
        language: "cs",
        document_url: null,
      };
    }

    const docs: SuklDocumentMeta[] = await res.json();
    const doc = docs.find(
      (d) => d.typ.toUpperCase() === documentType
    );

    if (!doc) {
      return {
        sukl_code: suklCode,
        document_type: documentType,
        title: `${documentType} - ${medicine.name}`,
        content: `Dokument ${documentType} pro ${medicine.name} není k dispozici.`,
        sections: [],
        last_updated: null,
        language: "cs",
        document_url: null,
      };
    }

    const downloadUrl = `${SUKL_API_BASE}/dokumenty/${doc.id}`;

    return {
      sukl_code: suklCode,
      document_type: documentType,
      title: `${documentType} - ${medicine.name}`,
      content: `Dokument ${documentType} pro přípravek ${medicine.name} je dostupný ke stažení. Pro zpracování obsahu PDF doporučujeme použít docling-mcp server.`,
      sections: [],
      last_updated: null,
      language: "cs",
      document_url: downloadUrl,
    };
  } catch {
    return {
      sukl_code: suklCode,
      document_type: documentType,
      title: `${documentType} - ${medicine.name}`,
      content: `Nepodařilo se získat dokument z SÚKL API.`,
      sections: [],
      last_updated: null,
      language: "cs",
      document_url: null,
    };
  }
}
```

**Step 3: Ověřit build**

```bash
npm run build
```

Expected: Build PASS.

**Step 4: Spustit testy**

```bash
npx vitest run
```

Expected: Všechny existující testy stále PASS.

**Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/sukl-client.ts
git commit -m "feat: implement PIL/SPC on-demand via SÚKL REST API"
```

---

## Task 6: Aktualizovat tool descriptions pro PIL/SPC

**Files:**
- Modify: `src/lib/mcp-handler.ts` (řádky 154-181)

**Step 1: Aktualizovat description pro get-pil-content**

Řádek 155-157, nahradit description:

```typescript
description:
  "Příbalový leták (PIL) léčivého přípravku. Vrací metadata a URL ke stažení PDF dokumentu ze SÚKL. Pro parsování obsahu PDF doporučujeme docling-mcp server.",
```

**Step 2: Aktualizovat description pro get-spc-content**

Řádek 170-171, nahradit description:

```typescript
description:
  "Souhrn údajů o přípravku (SPC/SmPC). Vrací metadata a URL ke stažení PDF dokumentu ze SÚKL. Pro parsování obsahu PDF doporučujeme docling-mcp server.",
```

**Step 3: Ověřit build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/lib/mcp-handler.ts
git commit -m "docs: update PIL/SPC tool descriptions with SÚKL API info"
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
    - cron: '0 6 28 * *'
  workflow_dispatch:

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

      - name: Build pharmacy data
        run: npx tsx scripts/build-pharmacies.ts

      - name: Build reimbursement data
        run: npx tsx scripts/build-reimbursements.ts

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
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git checkout -b "$BRANCH"
          git add data/bundled-data.json
          git commit -m "chore: update SÚKL data for ${MONTH}"
          git push origin "$BRANCH"
          gh pr create \
            --title "Update SÚKL data (${MONTH})" \
            --body "Automatická měsíční aktualizace lékárenských a úhradových dat z opendata.sukl.cz a sukl.gov.cz." \
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

## Task 8: Bundle analýza a optimalizace

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`

**Step 1: Instalovat bundle analyzer**

```bash
npm install -D @next/bundle-analyzer
```

**Step 2: Přidat podmíněný wrapper do next.config.ts**

Na začátek souboru přidat import a na konec podmíněný export:

```typescript
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // ... existing config unchanged
};

export default withBundleAnalyzer(nextConfig);
```

**Step 3: Přidat npm skript**

V `package.json` do `"scripts"`:

```json
"analyze": "ANALYZE=true next build"
```

**Step 4: Ověřit build**

```bash
npm run build
```

Expected: Build PASS (analyzer neběží bez ANALYZE=true).

**Step 5: Spustit analýzu**

```bash
npm run analyze
```

Expected: Otevře se browser s bundle vizualizací. Zaznamenat velikosti klíčových chunks.

**Step 6: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "chore: add bundle analyzer for performance monitoring"
```

---

## Task 9: Finální verifikace

**Step 1: Spustit všechny testy**

```bash
npx vitest run
```

Expected: Všechny testy PASS.

**Step 2: Spustit build**

```bash
npm run build
```

Expected: Build PASS.

**Step 3: Manuální test PIL/SPC**

```bash
npm run dev &
sleep 5
curl -s -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get-pil-content","arguments":{"sukl_code":"0254045"}}}'
```

Expected: JSON s `document_url` obsahující `https://prehledy.sukl.cz/dlp/v1/dokumenty/82916`.

**Step 4: Commit (pokud něco chybí)**

**Step 5: Push a PR**

```bash
git push -u origin 002-advanced-features
gh pr create --title "Epic 2: Advanced Features" --body "..."
```

---

## Pořadí realizace

```
Task 1 (Vitest setup) → Task 2 (demo tests) → Task 3 (MCP tests) → Task 4 (integration)
Task 5 (PIL/SPC API) → Task 6 (tool descriptions)
Task 7 (GitHub Action) — nezávislý na testech
Task 8 (bundle analyzer) — nezávislý
Task 9 (final) — závisí na všech
```

Tasks 1→4 a Tasks 5→6 lze realizovat sekvenčně v jednom proudu.
Task 7 a Task 8 jsou nezávislé a mohou běžet paralelně.
