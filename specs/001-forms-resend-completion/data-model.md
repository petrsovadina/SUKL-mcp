# Data Model: Dokončení formulářů a Resend email integrace

**Date**: 2026-03-17 | **Branch**: `001-forms-resend-completion`

## Notion Databases

### DB 1: Leads (Pro registrace)

**Parent**: "SUKL MCP — CRM" page
**Notion DB Name**: `SUKL MCP — Leads`

| Property | Notion Type | Required | Notes |
|----------|-------------|----------|-------|
| Firma | title | Yes | Název firmy/projektu (primary column) |
| Email | email | Yes | Kontaktní email |
| Jméno | rich_text | Yes | Jméno kontaktní osoby |
| Use Case | select | Yes | Options: Chatbot, Lékárna, Klinický systém, Výzkum, Jiné |
| Use Case Detail | rich_text | No | Volný text (max 500 znaků) |
| GDPR Souhlas | date | Yes | ISO datetime souhlasu |
| Datum | date | Yes | Datum registrace (YYYY-MM-DD) |
| Status | select | Yes | Options: Nový, Kontaktován, Trial, Konvertován, Zamítnut |

### DB 2: Enterprise (Enterprise kontakty)

**Parent**: "SUKL MCP — CRM" page
**Notion DB Name**: `SUKL MCP — Enterprise`

| Property | Notion Type | Required | Notes |
|----------|-------------|----------|-------|
| Firma | title | Yes | Název organizace (primary column) |
| Email | email | Yes | Kontaktní email |
| Jméno | rich_text | Yes | Jméno kontaktní osoby |
| Telefon | phone_number | No | Telefonní číslo |
| Velikost | select | Yes | Options: 1–10, 11–50, 51–200, 200+ |
| Zpráva | rich_text | Yes | Popis potřeby (max 2000 znaků) |
| GDPR Souhlas | date | Yes | ISO datetime souhlasu |
| Datum | date | Yes | Datum poptávky (YYYY-MM-DD) |

### DB 3: Newsletter (Odběratelé)

**Parent**: "SUKL MCP — CRM" page
**Notion DB Name**: `SUKL MCP — Newsletter`

| Property | Notion Type | Required | Notes |
|----------|-------------|----------|-------|
| Name | title | Yes | Email jako primární identifikátor (primary column) |
| Email | email | Yes | Emailová adresa odběratele |
| GDPR Souhlas | date | Yes | ISO datetime souhlasu (**nový sloupec**) |
| Datum | date | Yes | Datum přihlášení (YYYY-MM-DD) |

**Duplicate detection**: Query `notion.databases.query()` s filter `Email.email.equals(input)` před insert.

## Email Templates

### Template 1: Registration Confirmation (existující, vylepšit)

- **Recipient**: Uživatel (registrant)
- **Trigger**: Úspěšné uložení leadu do Notion DB
- **Subject**: "SÚKL MCP Pro — Vaše registrace byla přijata"
- **Body**: Brand header → pozdrav s jménem → info o trialu (14 dní, 1000 req/min, API klíč) → kontakt

### Template 2: Enterprise Notification (existující, vylepšit)

- **Recipient**: Vlastník (RESEND_OWNER_EMAIL)
- **Trigger**: Úspěšné uložení enterprise kontaktu do Notion DB
- **Subject**: "Nová Enterprise poptávka: {company}"
- **Body**: Brand header → tabulka s údaji (jméno, email, firma, velikost) → zpráva → kontakt

### Template 3: Newsletter Confirmation (**nový**)

- **Recipient**: Uživatel (odběratel)
- **Trigger**: Úspěšné uložení newsletter odběratele do Notion DB
- **Subject**: "SÚKL MCP — Přihlášení k odběru novinek"
- **Body**: Brand header → potvrzení přihlášení → info o frekvenci (max 2x měsíčně) → typ obsahu (nové funkce, aktualizace dat, tipy) → kontakt

### Shared Email Wrapper

```
emailWrapper(title: string, bodyHtml: string): string
```

Returns HTML string with:
- Header: logo/název "SÚKL MCP", brand barva (#1a1a2e nebo odpovídající)
- Body: `title` jako h2 + `bodyHtml` jako obsah
- Footer: kontaktní email, odkaz na web, rok

## Environment Variables

| Variable | Purpose | Where |
|----------|---------|-------|
| NOTION_DB_LEADS | Database ID for Leads | .env.local + Vercel |
| NOTION_DB_ENTERPRISE | Database ID for Enterprise | .env.local + Vercel |
| NOTION_DB_NEWSLETTER | Database ID for Newsletter | .env.local + Vercel |
| NOTION_API_KEY | Notion integration token | .env.local + Vercel |
| RESEND_API_KEY | Resend API key | .env.local + Vercel |
| RESEND_FROM_EMAIL | Sender address | .env.local + Vercel |
| RESEND_OWNER_EMAIL | Enterprise notification recipient | .env.local + Vercel |
