# Quickstart: Dokončení formulářů a Resend email integrace

## Prerequisites

1. Notion integration token s přístupem k workspace (NOTION_API_KEY)
2. Resend API klíč (RESEND_API_KEY) — volitelný pro testování bez emailů
3. Existující parent page "SUKL MCP — CRM" v Notion (ID: `318f7f27-154d-81ac-9dee-d1da9151e64c`)

## Implementation Order

### Step 1: Notion databáze (P1 prerequisite)

Vytvořit 3 Notion databáze přes MCP nástroje:
- `SUKL MCP — Leads` (8 properties)
- `SUKL MCP — Enterprise` (8 properties)
- `SUKL MCP — Newsletter` (4 properties, **rozšířeno o GDPR Souhlas**)

Uložit Database IDs do `.env.local`:
```
NOTION_DB_LEADS=<id>
NOTION_DB_ENTERPRISE=<id>
NOTION_DB_NEWSLETTER=<id>
```

### Step 2: Newsletter backend (P1)

Soubory k úpravě:
- `src/lib/notion.ts` — přidat `checkNewsletterDuplicate(email)` + GDPR field do `createNewsletterSubscriber()`
- `src/lib/resend.ts` — přidat `sendNewsletterConfirmation(email)` + `emailWrapper()` helper
- `src/app/api/newsletter/route.ts` — přidat GDPR validaci, dedup check, Resend volání

### Step 3: Newsletter frontend (P1 + P2)

Soubory k úpravě:
- `src/components/sections/footer.tsx` — `NewsletterForm`: +GDPR checkbox, +gdprConsentAt v body, +trackEvent volání

### Step 4: Email šablony (P3)

Soubory k úpravě:
- `src/lib/resend.ts` — refaktor: `emailWrapper()` sdílený layout, vylepšit existující 2 šablony + nový newsletter template

### Step 5: Testy + verifikace

- Nový test soubor: `tests/lib/newsletter-route.test.ts`
- Spustit: `npm run build && npm test`
- Manuální test: odeslat formuláře na localhost:3000

## Verification Checklist

- [ ] Notion databáze vytvořeny a IDs v env
- [ ] Newsletter API přijímá gdprConsentAt
- [ ] Duplicitní email vrací informativní zprávu
- [ ] Newsletter email doručen (s platným Resend klíčem)
- [ ] Resend selhání neblokuje formulář
- [ ] Analytics eventy v newsletter formuláři
- [ ] GDPR checkbox v newsletter UI
- [ ] `npm run build` projde
- [ ] `npm test` projde (všechny testy)
