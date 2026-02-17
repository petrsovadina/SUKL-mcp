# Research: Epic 1 — Production Ready

**Date**: 2026-02-16
**Feature**: [spec.md](./spec.md)

## R1: SÚKL Open Data — Lékárny (Pharmacy CSV)

### Decision
Použít přímý CSV soubor z opendata.sukl.cz, parsovat jako UTF-8 s čárkovým delimiterem.

### Rationale
- Opendata.sukl.cz poskytuje CSV v UTF-8 (nikoli win-1250 jak původně předpokládáno)
- Delimiter je čárka (`,`), ne pipe
- Přímá URL k CSV: `https://opendata.sukl.cz/soubory/NKOD/LEKARNY/nkod_lekarny_seznam.csv`
- Soubor obsahuje header řádek s 19 sloupci
- Aktualizace měsíčně (27. den měsíce)

### CSV Column Mapping (19 sloupců)

| # | CSV sloupec | Popis | Mapování → BundledPharmacy |
|---|-------------|-------|---------------------------|
| 1 | NAZEV | Název lékárny | `n` |
| 2 | KOD_PRACOVISTE | Kód pracoviště | `k` (→ Pharmacy.id) |
| 3 | KOD_LEKARNY | Kód lékárny | — (nepoužito) |
| 4 | ICZ | IČZ | — (nepoužito) |
| 5 | ICO | IČO | — (nepoužito) |
| 6 | MESTO | Město | `c` |
| 7 | ULICE | Ulice + číslo | `a` (→ Pharmacy.address) |
| 8 | PSC | PSČ | `z` |
| 9 | LEKARNIK_PRIJMENI | Příjmení lékárníka | — (nepoužito, GDPR) |
| 10 | LEKARNIK_JMENO | Jméno lékárníka | — (nepoužito, GDPR) |
| 11 | LEKARNIK_TITUL | Titul lékárníka | — (nepoužito, GDPR) |
| 12 | WWW | Web | `w` |
| 13 | EMAIL | Email | `e` |
| 14 | TELEFON | Telefon | `t` |
| 15 | FAX | Fax | — (nepoužito) |
| 16 | ERP | eRecept napojení | `r` (boolean) |
| 17 | TYP_LEKARNY | Typ lékárny | — (nepoužito) |
| 18 | ZASILKOVY_PRODEJ | Zásilkový prodej | — (nepoužito) |
| 19 | POHOTOVOST | Pohotovost 24h | `h` (boolean) |

### Alternatives Considered
1. **ZIP archiv s měsíčním snímkem** — zbytečná komplexita, přímý CSV stačí
2. **API volání** — SÚKL neposkytuje REST API pro lékárny
3. **Scraping HTML** — porušení Constitution VI, nespolehlivé

### Korekce spec.md
- Assumption "SÚKL CSV formát lékáren používá `|` jako delimiter a win-1250 encoding" je **nesprávná**
- Skutečnost: UTF-8, čárka jako delimiter
- Spec.md bude aktualizován v Clarifications sekci

---

## R2: SÚKL SCAU — Úhrady (Reimbursement Data)

### Decision
Použít SCAU TXT soubor ze sukl.gov.cz, parsovat jako WIN-1250 s pipe delimiterem. Použít Node.js `TextDecoder("windows-1250")` (nativní, žádná nová závislost).

### Rationale
- SCAU (Seznam cen a úhrad) je primární zdroj úhradových dat
- Formát: pipe-delimited TXT v WIN-1250 encoding
- Žádný header řádek — pozice sloupců definovány v datovém rozhraní
- Aktuální verze formátu: v21 (od 1.1.2026)
- Soubory na: `https://sukl.gov.cz/wp-content/uploads/YYYY/MM/SCAU[date]v21.txt`
- Aktualizace měsíčně

### Relevantní sloupce z SCAU v21

Pro účely `get-reimbursement` potřebujeme tyto sloupce (pozice jsou 0-indexed):

| Pozice | Popis | Mapování → BundledReimbursement |
|--------|-------|-------------------------------|
| 0 | Kód SÚKL | `c` (sukl_code) |
| ~5 | Název přípravku | — (již v medicines) |
| ~25 | Úhradová skupina | `g` (reimbursement_group) |
| ~30 | Maximální cena výrobce | `m` (max_price) |
| ~35 | Výše úhrady | `a` (reimbursement_amount) |
| ~40 | Doplatek pacienta | `s` (patient_surcharge) |

> **Poznámka**: Přesné pozice sloupců MUSÍ být ověřeny ze stažené SCAU dokumentace v21 (DOCX). Výše uvedené pozice jsou orientační.

### WIN-1250 Dekódování
- Node.js 18+ podporuje `TextDecoder("windows-1250")` nativně
- Alternativa: `iconv-lite` npm balíček
- **Rozhodnutí**: Použít nativní `TextDecoder` — žádná nová závislost (Constitution V)

### Alternatives Considered
1. **XLS formát** — větší soubor (6 MB), vyžaduje xlsx parser závislost
2. **Ruční zadání dat** — porušení Constitution VI, neškálovatelné
3. **iconv-lite** — funkční, ale zbytečná závislost když TextDecoder stačí

---

## R3: Rate Limiting — MCP Endpoint

### Decision
In-memory Map se sliding window cleanup, stejný vzor jako existující demo/route.ts. 100 req/min per IP.

### Rationale
- Demo route již implementuje rate limiting (10 req/min) — ověřený vzor
- MCP endpoint potřebuje vyšší limit (100 req/min) protože AI agenti mohou dělat burst requesty
- Cleanup: po každém requestu odebrat záznamy kde `now > resetAt`
- Při překročení: HTTP 429 + JSON-RPC error `{ code: -32000, message: "..." }`

### Alternatives Considered
1. **Vercel Edge Config / KV** — přehnaná komplexita pro tento use case
2. **Redis** — vyžaduje external service, porušení Constitution V
3. **Žádný rate limit** — bezpečnostní riziko (DoS)

---

## R4: Content-Security-Policy

### Decision
Permisivní CSP s `unsafe-inline` a `unsafe-eval` pro Next.js kompatibilitu.

### Rationale
- Next.js vyžaduje inline skripty pro hydration a runtime
- Striktní CSP (s nonce) vyžaduje middleware konfiguraci — Epic 2 kandidát
- Pro Epic 1 stačí základní CSP, která blokuje XSS z externích zdrojů
- `frame-ancestors 'none'` zabraňuje clickjacking

### CSP Hodnota
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https:;
frame-ancestors 'none'
```

### Alternatives Considered
1. **Strict CSP s nonce** — vyžaduje Next.js middleware, složitější implementace
2. **Žádná CSP** — bezpečnostní riziko
3. **Report-only CSP** — nezablokuje útoky, pouze loguje

---

## R5: Error Boundary

### Decision
React class component `ErrorBoundary` v `src/components/ui/error-boundary.tsx`. Obálka kolem DemoSection.

### Rationale
- React error boundaries vyžadují class component (`getDerivedStateFromError`)
- Funkční komponenty nemají ekvivalent
- Obalit DemoSection (ne celou page) — izolace chyby na demo sekci
- Fallback text v češtině per Constitution III

### Alternatives Considered
1. **react-error-boundary** npm balíček — zbytečná závislost (Constitution V)
2. **try/catch v komponentách** — nechytá render chyby
3. **Suspense boundary** — neslouží k error handling

---

## R6: Structured Logging

### Decision
JSON logging do stdout pomocí `console.log(JSON.stringify({...}))` v `executeTool()`.

### Rationale
- Vercel automaticky agreguje stdout logy
- JSON formát umožňuje strojové zpracování
- Klíče: `event`, `tool`, `params`, `duration_ms`, `status`, (volitelně `error`)
- Params se logují pro debugování — neobsahují PII (jen kódy léků a dotazy)

### Alternatives Considered
1. **winston/pino** — zbytečná závislost pro 1 log call
2. **Vercel Log Drain** — konfiguruje se externě, logging format je na nás
3. **console.error only** — ztratíme success logy
