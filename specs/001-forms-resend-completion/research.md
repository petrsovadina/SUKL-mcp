# Research: Dokončení formulářů a Resend email integrace

**Date**: 2026-03-17 | **Branch**: `001-forms-resend-completion`

## R1: Notion API — query databáze pro detekci duplicit

**Decision**: Použít `notion.databases.query()` s filter na email property před vytvořením záznamu.

**Rationale**: Notion API podporuje filtrování přes `filter.property` s `equals` operátorem pro email type. Jeden API call vrátí výsledky — pokud existuje záznam se stejným emailem, vrátíme informativní zprávu. Při selhání query (timeout, 5xx) vytvoříme záznam bez kontroly (per clarification: ztráta odběratele horší než duplicita).

**Alternatives considered**:
- Lokální cache emailů v paměti — zavrženo (resetuje se při cold start, nekonzistentní s Notion)
- Notion unique constraint — Notion API nepodporuje unique constraints na properties

## R2: Notion API — vytvoření databází přes MCP

**Decision**: Použít Notion MCP tool `notion-create-database` k vytvoření tří databází pod existující parent page "SUKL MCP — CRM" (ID: `318f7f27-154d-81ac-9dee-d1da9151e64c`).

**Rationale**: Parent page již existuje (vytvořena v předchozí session). MCP nástroj umožňuje definovat properties (typy sloupců) přímo při vytváření. Database IDs z response se zapíší do `.env.local` a Vercel env vars.

**Alternatives considered**:
- Manuální vytvoření přes Notion UI — zavrženo (error-prone, nedokumentovatelné)
- Setup skript v `scripts/` — zavrženo (jednorázová operace, MCP je efektivnější)

## R3: Resend — inline HTML email šablony

**Decision**: Pokračovat s inline HTML v `resend.ts`. Vytvořit sdílenou helper funkci `emailWrapper(title, body)` pro konzistentní brand layout (header s názvem služby, body, patička s kontaktem).

**Rationale**: React Email by vyžadoval novou závislost + build pipeline. Projekt má 3 email šablony — inline HTML s wrapper funkcí je dostatečné. Konstituce V (YAGNI) zakazuje přidávání závislostí bez jasného důvodu.

**Alternatives considered**:
- React Email — zavrženo (nová závislost, build complexity, overkill pro 3 šablony)
- MJML — zavrženo (nová závislost, same argument)
- Bez wrapperu (ponechat stávající) — zavrženo (nekonzistentní vzhled, FR-006)

## R4: Newsletter GDPR — datový model

**Decision**: Rozšířit Notion Newsletter DB o sloupec "GDPR Souhlas" (type: `date`), shodně s Leads a Enterprise DB. Newsletter API route přidá validaci `gdprConsentAt` fieldu. Frontend přidá checkbox do `NewsletterForm` v `footer.tsx`.

**Rationale**: Konzistence s existujícím vzorem v Register a Contact formulářích. `date` type v Notion umožňuje přesné datum+čas souhlasu pro GDPR audit trail.

**Alternatives considered**:
- Checkbox (boolean) type — zavrženo (ztratí přesný čas souhlasu)
- Bez persistence (jen frontend checkbox) — zavrženo (neprokázatelný souhlas)

## R5: Analytické eventy — newsletter konzistence

**Decision**: Importovat `trackEvent` z `@/lib/analytics` do `NewsletterForm` komponenty v `footer.tsx`. Použít shodný pattern jako `RegisterModal` a `ContactModal`: `form_submit`, `form_success`, `form_error` s `{ form: "newsletter" }`.

**Rationale**: Přímé kopírování existujícího vzoru. Žádná nová závislost, žádná nová abstrakce. Analytics modul (`analytics.ts`) již existuje a odesílá do Vercel Analytics + Umami.

**Alternatives considered**: Žádné — existující vzor je jednoznačný.
