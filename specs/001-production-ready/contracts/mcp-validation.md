# MCP Tool Validation Contracts

**Date**: 2026-02-16
**Feature**: [spec.md](../spec.md)

## Overview

Definice validačních pravidel pro všech 9 MCP tools. Každý tool specifikuje vstupní parametry, validační pravidla a očekávané chybové zprávy.

## Global Contracts

### Rate Limiting (MCP Endpoint)

```
Endpoint: POST /api/mcp (rewrite: /mcp)
Limit: 100 requests per minute per IP
Window: 60 seconds (sliding)

On exceed:
  HTTP Status: 429
  Body: {
    "jsonrpc": "2.0",
    "id": null,
    "error": {
      "code": -32000,
      "message": "Překročen limit požadavků. Zkuste to znovu za minutu."
    }
  }

IP Resolution: x-forwarded-for (first) → x-real-ip → "unknown"
```

### Structured Logging

```
On every tool call:
  stdout: JSON.stringify({
    event: "mcp_tool_call",
    tool: "<tool-name>",
    params: { ...args },
    duration_ms: <number>,
    status: "ok" | "error",
    error?: "<error message>"    // only when status === "error"
  })
```

---

## Tool 1: search-medicine

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| query | string | Yes | non-empty, max 200 chars | "Parametr 'query' musí být neprázdný řetězec." / "Vyhledávací dotaz nesmí překročit 200 znaků." |
| limit | number | No | 1-100, default 20 | Silently clamped to range |

### Current State → Change Needed
- `validateString(args.query, "query")` — EXISTS, OK
- Query length validation — MISSING, ADD check `if (query.length > 200) throw`
- `validateNumber` — EXISTS, OK

---

## Tool 2: get-medicine-details

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| sukl_code | string | Yes | non-empty string | "Parametr 'sukl_code' musí být neprázdný řetězec." |

### Current State → Change Needed
- Uses `args.sukl_code as string` — NO VALIDATION
- ADD: `const code = validateString(args.sukl_code, "sukl_code");`

---

## Tool 3: check-availability

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| sukl_code | string | Yes | non-empty string | "Parametr 'sukl_code' musí být neprázdný řetězec." |

### Current State → Change Needed
- Uses `args.sukl_code as string` — NO VALIDATION
- ADD: `const code = validateString(args.sukl_code, "sukl_code");`

---

## Tool 4: find-pharmacies

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| city | string | No | if provided, non-empty | "Parametr 'city' musí být neprázdný řetězec." |
| postal_code | string | No | if provided, non-empty | "Parametr 'postal_code' musí být neprázdný řetězec." |
| is_24h | boolean | No | if provided, must be boolean | Silently ignored if not boolean |

### Current State → Change Needed
- No validation — optional params cast directly
- ADD: validate non-empty if provided (optional but should not be empty string)

---

## Tool 5: get-atc-info

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| atc_code | string | Yes | non-empty string | "Parametr 'atc_code' musí být neprázdný řetězec." |
| include_medicines | boolean | No | — | Default: false |
| medicines_limit | number | No | 1-100, default 20 | Silently clamped |

### Current State → Change Needed
- Uses `args.atc_code as string` — NO VALIDATION
- ADD: `const atcCode = validateString(args.atc_code, "atc_code");`

---

## Tool 6: get-reimbursement

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| sukl_code | string | Yes | non-empty string | "Parametr 'sukl_code' musí být neprázdný řetězec." |

### Current State → Change Needed
- Uses `args.sukl_code as string` — NO VALIDATION
- ADD: `const code = validateString(args.sukl_code, "sukl_code");`

---

## Tool 7: get-pil-content

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| sukl_code | string | Yes | non-empty string | "Parametr 'sukl_code' musí být neprázdný řetězec." |

### Current State → Change Needed
- Uses `args.sukl_code as string` — NO VALIDATION
- ADD: `const code = validateString(args.sukl_code, "sukl_code");`

---

## Tool 8: get-spc-content

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| sukl_code | string | Yes | non-empty string | "Parametr 'sukl_code' musí být neprázdný řetězec." |

### Current State → Change Needed
- Uses `args.sukl_code as string` — NO VALIDATION
- ADD: `const code = validateString(args.sukl_code, "sukl_code");`

---

## Tool 9: batch-check-availability

### Input Validation

| Parameter | Type | Required | Validation | Error Message |
|-----------|------|----------|------------|---------------|
| sukl_codes | string[] | Yes | non-empty array, max 50 items, each item non-empty string | "Parametr 'sukl_codes' musí být neprázdné pole řetězců." / "Maximální počet kódů je 50." |

### Current State → Change Needed
- Uses `args.sukl_codes as string[]` — NO VALIDATION
- Does `codes.slice(0, 50)` silently — SHOULD REJECT >50
- ADD: `validateArray()` function:
  ```typescript
  function validateArray(value: unknown, name: string, maxItems: number): string[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`Parametr '${name}' musí být neprázdné pole řetězců.`);
    }
    if (value.length > maxItems) {
      throw new Error(`Maximální počet položek v '${name}' je ${maxItems}.`);
    }
    return value.map((item, i) => {
      if (typeof item !== "string" || item.trim().length === 0) {
        throw new Error(`Položka ${i + 1} v '${name}' musí být neprázdný řetězec.`);
      }
      return item.trim();
    });
  }
  ```

---

## Summary of Changes

| Tool | Current Validation | Needed Change |
|------|--------------------|---------------|
| search-medicine | query validated | Add max 200 chars check |
| get-medicine-details | None | Add `validateString` for sukl_code |
| check-availability | None | Add `validateString` for sukl_code |
| find-pharmacies | None | Add optional non-empty check |
| get-atc-info | None | Add `validateString` for atc_code |
| get-reimbursement | None | Add `validateString` for sukl_code |
| get-pil-content | None | Add `validateString` for sukl_code |
| get-spc-content | None | Add `validateString` for sukl_code |
| batch-check-availability | Silent slice | Add `validateArray`, reject >50 |
