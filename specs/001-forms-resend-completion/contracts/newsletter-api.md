# API Contract: Newsletter endpoint

**Endpoint**: `POST /api/newsletter`
**Rate limit**: 5 req/min per IP

## Request

```json
{
  "email": "jan@firma.cz",
  "gdprConsentAt": "2026-03-17T14:30:00.000Z"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Must contain `@`, max 200 chars |
| gdprConsentAt | string (ISO 8601) | Yes | Non-empty ISO datetime string |

## Responses

### 200 OK — New subscriber

```json
{
  "success": true
}
```

### 200 OK — Duplicate email (already subscribed)

```json
{
  "success": true,
  "message": "Tento email je již přihlášen k odběru."
}
```

### 400 Bad Request — Validation error

```json
{
  "error": "Zadejte platný email."
}
```

```json
{
  "error": "Souhlas se zpracováním údajů je povinný."
}
```

### 429 Too Many Requests

```json
{
  "error": "Příliš mnoho požadavků. Zkuste to za minutu."
}
```

### 500 Internal Server Error — Notion API failure

```json
{
  "error": "Nepodařilo se přihlásit k odběru. Zkuste to znovu."
}
```

## Behavior

1. Validate input (email format, GDPR consent present)
2. Check rate limit (5 req/min per IP)
3. Query Notion Newsletter DB for existing email
   - If found → return 200 with `message`
   - If query fails → proceed to step 4 (log error, don't block)
4. Create new record in Notion Newsletter DB
5. Send confirmation email via Resend (non-blocking)
   - If Resend fails → log error, still return 200
6. Return 200 success

## Changes from current implementation

| Aspect | Before | After |
|--------|--------|-------|
| GDPR consent | Not required | Required (`gdprConsentAt` field) |
| Duplicate check | None | Query Notion DB before insert |
| Email confirmation | None | Resend `sendNewsletterConfirmation()` |
| Analytics | None | `form_submit`, `form_success`, `form_error` events (frontend) |
