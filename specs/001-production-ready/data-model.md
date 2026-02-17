# Data Model: Epic 1 — Production Ready

**Date**: 2026-02-16
**Feature**: [spec.md](./spec.md)

## Entity Overview

```
BundledData (bundled-data.json)
├── m: BundledMedicine[]        # Existující (68k+ záznamů)
├── a: BundledATC[]             # Existující (~6k záznamů)
├── p: BundledPharmacy[]        # NOVÉ (odhad ~2500 záznamů)
├── r: BundledReimbursement[]   # NOVÉ (odhad ~8000 záznamů)
└── _: Metadata                 # Rozšířit o počty p, r
```

## Entity 1: BundledPharmacy (NEW)

**Zdroj**: opendata.sukl.cz CSV (UTF-8, čárka delimiter)
**Klíč v bundled-data.json**: `p`

### Bundled Format (short keys for JSON size)

```typescript
interface BundledPharmacy {
  n: string;   // name (NAZEV)
  k: string;   // workplace code (KOD_PRACOVISTE) — unique ID
  a: string;   // address (ULICE)
  c: string;   // city (MESTO)
  z: string;   // postal code (PSC)
  t: string;   // phone (TELEFON)
  e: string;   // email (EMAIL)
  w: string;   // web (WWW)
  r: boolean;  // has eRecept (ERP)
  h: boolean;  // is 24h emergency (POHOTOVOST)
}
```

### Runtime Format (Pharmacy interface in types.ts)

```typescript
// Existující v src/lib/types.ts — minimální úprava
export interface Pharmacy {
  id: string;           // ← BundledPharmacy.k (KOD_PRACOVISTE)
  name: string;         // ← BundledPharmacy.n
  address: string;      // ← BundledPharmacy.a
  city: string;         // ← BundledPharmacy.c
  postal_code: string;  // ← BundledPharmacy.z
  phone: string | null; // ← BundledPharmacy.t || null
  email: string | null; // ← BundledPharmacy.e || null
  opening_hours: string | null;  // null (data not in CSV)
  latitude: number | null;       // null (data not in CSV)
  longitude: number | null;      // null (data not in CSV)
  distance_km: number | null;    // null (computed, not stored)
  is_24h: boolean;      // ← BundledPharmacy.h
  has_erecept: boolean;  // ← BundledPharmacy.r
}
```

### Transform Function

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
    is_24h: p.h,
    has_erecept: p.r,
  };
}
```

### Validation Rules
- `k` (KOD_PRACOVISTE) MUSÍ být unikátní — slouží jako primární identifikátor
- `c` (MESTO) MUSÍ být neprázdný řetězec
- `z` (PSC) MUSÍ odpovídat formátu `\d{3}\s?\d{2}` (české PSČ)
- `h` (POHOTOVOST) — boolean, v CSV jako "1"/"0" nebo "true"/"false"

### Filtrovací operace (existující v sukl-client.ts)
- `city` — case-insensitive `includes()` match
- `postal_code` — `startsWith()` match (umožňuje prefix hledání, např. "110" pro Prahu 1)
- `is_24h` — exact boolean match

---

## Entity 2: BundledReimbursement (NEW)

**Zdroj**: sukl.gov.cz SCAU TXT (WIN-1250, pipe delimiter, bez headeru)
**Klíč v bundled-data.json**: `r`

### Bundled Format

```typescript
interface BundledReimbursement {
  c: string;        // sukl_code
  g: string | null;  // reimbursement_group (úhradová skupina)
  m: number | null;  // max_price (maximální cena)
  a: number | null;  // reimbursement_amount (výše úhrady)
  s: number | null;  // patient_surcharge (doplatek pacienta)
}
```

### Runtime Format (ReimbursementInfo interface in types.ts)

```typescript
// Existující v src/lib/types.ts — beze změny
export interface ReimbursementInfo {
  sukl_code: string;                    // ← BundledReimbursement.c
  reimbursement_group: string | null;    // ← BundledReimbursement.g
  max_price: number | null;              // ← BundledReimbursement.m
  reimbursement_amount: number | null;   // ← BundledReimbursement.a
  patient_surcharge: number | null;      // ← BundledReimbursement.s
  reimbursement_conditions: string | null; // null (not in SCAU basic extract)
  valid_from: string | null;             // null (not extracted in v1)
  valid_until: string | null;            // null (not extracted in v1)
}
```

### Transform Function

```typescript
function transformBundledReimbursement(r: BundledReimbursement): ReimbursementInfo {
  return {
    sukl_code: r.c,
    reimbursement_group: r.g,
    max_price: r.m,
    reimbursement_amount: r.a,
    patient_surcharge: r.s,
    reimbursement_conditions: null,
    valid_from: null,
    valid_until: null,
  };
}
```

### Validation Rules
- `c` (sukl_code) MUSÍ být neprázdný řetězec — slouží jako klíč v Map
- `m`, `a`, `s` (cenové údaje) — čísla >= 0, nebo null pokud nejsou k dispozici
- Duplikátní SÚKL kódy: poslední záznam vyhrává (Map.set přepíše)

### Lookup operace
- `store.reimbursements.get(sukl_code)` — O(1) lookup z Map

---

## Entity 3: RateLimitEntry (IN-MEMORY)

**Úložiště**: In-memory Map v `src/app/api/mcp/route.ts`

```typescript
// Stejný vzor jako demo/route.ts
interface RateLimitEntry {
  count: number;     // Počet požadavků v aktuálním okně
  resetAt: number;   // Unix timestamp pro reset (Date.now() + 60_000)
}

const rateLimitMap = new Map<string, RateLimitEntry>();
// Key = IP adresa (z x-forwarded-for nebo x-real-ip)
```

### Pravidla
- Window: 60 sekund (60_000 ms)
- Limit: 100 požadavků per IP per window
- Cleanup: po každém requestu odebrat entries kde `now > resetAt`
- Cold start: Map se resetuje — přijatelné omezení

---

## Extended BundledData Interface

```typescript
interface BundledData {
  m: BundledMedicine[];           // medicines (existující)
  a: BundledATC[];                // ATC codes (existující)
  p?: BundledPharmacy[];          // pharmacies (NOVÉ, optional pro zpětnou kompatibilitu)
  r?: BundledReimbursement[];     // reimbursements (NOVÉ, optional pro zpětnou kompatibilitu)
  _: {
    t: string;                    // timestamp
    c: {
      m: number;                  // medicines count
      a: number;                  // ATC count
      p?: number;                 // pharmacies count (NOVÉ)
      r?: number;                 // reimbursements count (NOVÉ)
    };
  };
}
```

### Zpětná kompatibilita
- Klíče `p` a `r` jsou optional (`?`) — existující bundled-data.json bez nich bude stále fungovat
- `initializeData()` MUSÍ kontrolovat `if (data.p)` před transformací
- `findPharmacies()` vrátí prázdný seznam pokud `data.p` chybí (stávající chování)
- `getReimbursement()` vrátí null pokud `data.r` chybí (stávající chování)

---

## Data Size Estimates

| Entita | Počet záznamů | Bundled size (est.) | Poznámka |
|--------|--------------|---------------------|----------|
| Medicines | ~68,000 | ~8.5 MB | Existující |
| ATC Codes | ~6,000 | ~0.5 MB | Existující |
| Pharmacies | ~2,500 | ~0.5 MB | Nové |
| Reimbursements | ~8,000 | ~0.3 MB | Nové |
| Metadata | 1 | <1 KB | Rozšíření |
| **Celkem** | | **~10 MB** | Z 9.5 MB → ~10 MB |

Nárůst je akceptovatelný — pod limitem 15 MB stanoveným v Technical Context.
