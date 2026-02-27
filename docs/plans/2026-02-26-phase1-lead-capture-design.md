# Phase 1: Lead Capture & Pricing — Design Document

**Datum:** 2026-02-26
**Status:** Schvaleno
**Branch:** formulare

## Cil

Pridat na landing page pricing sekci, registracni a kontaktni formulare a newsletter signup. Data z formularu se posilaji do Notion databazi (CRM). Zadny placeny backend, zadna autentizace — ciste lead capture pro validaci poptvky.

## Nove komponenty

### Sekce

- `src/components/sections/pricing.tsx` — 3 karty (Free / Pro / Enterprise), animovane pres framer-motion
- Vlozena do `page.tsx` mezi `<Why />` a `<FAQ />`

### Formulare

- `src/components/forms/register-modal.tsx` — Modal pro Pro trial registraci (email, firma, use case)
- `src/components/forms/contact-modal.tsx` — Modal pro Enterprise poptavku (email, firma, telefon, velikost, zprava)
- Newsletter inline formular primo ve `footer.tsx`

### API Routes

- `src/app/api/register/route.ts` — POST, validace, rate limit, Notion API
- `src/app/api/contact/route.ts` — POST, validace, rate limit, Notion API
- `src/app/api/newsletter/route.ts` — POST, validace, rate limit, Notion API

## Notion databaze

3 oddelene tabulky:
1. **SUKL MCP — Leads** (Email, Firma, Use Case, Datum, Status)
2. **SUKL MCP — Enterprise** (Email, Firma, Telefon, Velikost, Zprava, Datum)
3. **SUKL MCP — Newsletter** (Email, Datum)

## Konvence

- Czech UI text vsude
- Tailwind CSS 4 + existujici CSS promenne (--sukl-navy, --pink, --teal)
- framer-motion pro animace
- Validace plain TypeScript (bez Zod)
- Rate limit 5 req/min per IP na form endpointy
- @notionhq/client jako nova dependency

## Pricing tiers

| | Free | Pro | Enterprise |
|---|---|---|---|
| Cena | 0 Kc | 2 490 Kc/mesic | Na miru |
| Rate limit | 100 req/min | 1 000 req/min | Unlimited |
| Data refresh | Mesicni | Tydenni | Denni |
| API klic | Ne | Ano | Ano |
| Support | GitHub Issues | Email 48h | Dedicated 4h |
| SLA | Best effort | 99.5% | 99.9% |

## Poradi implementace

1. `npm install @notionhq/client`
2. API routes (register, contact, newsletter)
3. Form modaly (register-modal, contact-modal)
4. Pricing sekce
5. Update footer (newsletter)
6. Update page.tsx (pridat Pricing)
7. Build + test
