# Feature Specification: Dokončení formulářů a Resend email integrace

**Feature Branch**: `001-forms-resend-completion`
**Created**: 2026-03-17
**Status**: Draft
**Input**: User description: "Chci dokončit plnohodnotnou implementaci relevantních formulářů a jejich napojení na Resend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Newsletter: potvrzovací email po přihlášení (Priority: P1)

Návštěvník se přihlásí k odběru newsletteru v patičce webu. Po úspěšném odeslání formuláře obdrží potvrzovací email přes Resend s informací, že byl úspěšně přihlášen a co může očekávat (frekvence, typ obsahu).

**Why this priority**: Newsletter je jediný formulář bez Resend integrace. Register a Contact již Resend mají — newsletter je poslední chybějící kus.

**Independent Test**: Odeslání newsletterového formuláře na webu a ověření záznamu v Notion DB + doručení potvrzovacího emailu.

**Acceptance Scenarios**:

1. **Given** návštěvník zadá platný email do newsletter formuláře, **When** odešle formulář, **Then** systém uloží záznam do Notion Newsletter DB a odešle potvrzovací email přes Resend.
2. **Given** Resend API klíč není nastaven, **When** návštěvník odešle newsletter formulář, **Then** záznam se uloží do Notion DB, formulář zobrazí úspěch (email se tiše přeskočí).
3. **Given** návštěvník zadá neplatný email, **When** odešle formulář, **Then** systém vrátí srozumitelnou chybovou hlášku v češtině.

---

### User Story 2 - Notion CRM databáze: vytvoření a ověření (Priority: P1)

Formuláře (Register, Contact, Newsletter) potřebují existující Notion databáze s odpovídající strukturou. Systém musí mít vytvořené tři Notion databáze (Leads, Enterprise, Newsletter) s definovanými property sloupci a ověřené propojení přes env proměnné.

**Why this priority**: Bez funkčních Notion databází žádný formulář nefunguje — API vrátí 500 error. Toto je prerequisite pro všechny tři formuláře.

**Independent Test**: Odeslání testovacích dat přes každý z API endpointů a ověření, že se záznamy objeví v příslušné Notion databázi.

**Acceptance Scenarios**:

1. **Given** Notion databáze "Leads" existuje se sloupci (Email, Firma, Use Case, Jméno, Use Case Detail, GDPR Souhlas, Datum, Status), **When** Register formulář odešle data, **Then** záznam se vytvoří se správnými hodnotami ve všech sloupcích.
2. **Given** Notion databáze "Enterprise" existuje se sloupci (Email, Firma, Jméno, Telefon, Velikost, Zpráva, GDPR Souhlas, Datum), **When** Contact formulář odešle data, **Then** záznam se vytvoří se správnými hodnotami.
3. **Given** Notion databáze "Newsletter" existuje se sloupci (Name, Email, Datum), **When** Newsletter formulář odešle email, **Then** záznam se vytvoří.
4. **Given** NOTION_API_KEY není nastaven nebo je neplatný, **When** libovolný formulář odešle data, **Then** systém vrátí srozumitelnou chybovou hlášku (status 500) a zaloguje chybu.

---

### User Story 3 - Newsletter: analytické sledování (Priority: P2)

Newsletter formulář v patičce aktuálně nesleduje události přes analytiku. Po dokončení bude formulář odesílat analytické eventy (`form_submit`, `form_success`, `form_error`) shodně s Register a Contact formuláři.

**Why this priority**: Konzistence analytického sledování napříč formuláři je klíčová pro měření konverzního funnelu. Register a Contact již eventy odesílají.

**Independent Test**: Odeslání newsletter formuláře a ověření, že se v analytics zobrazí eventy `form_submit` a `form_success` s `form: "newsletter"`.

**Acceptance Scenarios**:

1. **Given** návštěvník odešle newsletter formulář, **When** odesílání probíhá, **Then** systém zaznamená `form_submit` event s `{ form: "newsletter" }`.
2. **Given** newsletter odeslání proběhne úspěšně, **When** server vrátí success, **Then** systém zaznamená `form_success` event.
3. **Given** newsletter odeslání selže, **When** server vrátí chybu, **Then** systém zaznamená `form_error` event.

---

### User Story 4 - Resend email šablony: vylepšení designu (Priority: P3)

Stávající Resend emaily (registrace, enterprise notifikace) používají základní inline HTML. Emaily by měly mít konzistentní, profesionální vzhled odpovídající brandu SUKL MCP — název služby, barvy, patička s kontaktem.

**Why this priority**: Funkčně emaily fungují. Vylepšení designu je kosmetické, ale zvyšuje profesionalitu a důvěru.

**Independent Test**: Odeslání registračního a enterprise formuláře a vizuální kontrola doručeného emailu v poštovním klientu.

**Acceptance Scenarios**:

1. **Given** uživatel odešle Pro registraci, **When** potvrzovací email dorazí, **Then** email obsahuje název služby, strukturované informace o trialu a kontakt na podporu.
2. **Given** někdo odešle Enterprise poptávku, **When** notifikační email dorazí vlastníkovi, **Then** email obsahuje přehlednou tabulku s údaji poptávajícího a jeho zprávou.
3. **Given** uživatel se přihlásí k newsletteru, **When** potvrzovací email dorazí, **Then** email obsahuje informaci o frekvenci zasílání (max 2x měsíčně) a kontakt.

---

### User Story 5 - Ochrana proti duplicitním newsletter přihlášením (Priority: P2)

Systém by měl detekovat, pokud se uživatel pokouší přihlásit k newsletteru s emailem, který je již v databázi. Místo vytvoření duplicitního záznamu zobrazí informativní zprávu.

**Why this priority**: Duplicitní záznamy znečišťují CRM data a mohou vést k duplicitním emailům.

**Independent Test**: Dvojité odeslání stejného emailu přes newsletter formulář a ověření, že se vytvoří jen jeden záznam.

**Acceptance Scenarios**:

1. **Given** email "jan@firma.cz" je již v Newsletter databázi, **When** někdo odešle stejný email znovu, **Then** systém vrátí úspěšnou odpověď s informací "Tento email je již přihlášen k odběru." a nevytvoří duplicitní záznam.
2. **Given** email "novy@firma.cz" není v databázi, **When** někdo odešle formulář, **Then** systém vytvoří nový záznam normálně.

---

### Edge Cases

- Co se stane při odeslání formuláře s vypnutým JavaScriptem? Formuláře jsou client-side komponenty — bez JS nelze odeslat. Progressive enhancement není v scope.
- Co se stane, když Resend API vrátí rate limit (429)? Email se tiše přeskočí, formulář stále hlásí úspěch (email je non-blocking).
- Co se stane, když Notion API je dočasně nedostupné? Formulář vrátí 500 s českou chybovou hláškou. Uživatel může zkusit znovu.
- Co se stane při extrémně dlouhém emailu (>200 znaků)? Validace na backendu ořízne na 200 znaků.
- Co se stane, když Notion databáze nemá očekávané sloupce? Notion API vrátí error, backend zaloguje a vrátí 500.
- Co se stane, když kontrola duplicit v Newsletter DB selže (Notion API timeout)? Systém vytvoří záznam i bez ověření duplicity — ztráta odběratele je horší než duplicita. Duplicity lze čistit dávkově.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Systém MUSÍ odeslat potvrzovací email přes Resend po úspěšném přihlášení k newsletteru.
- **FR-002**: Selhání Resend API NESMÍ způsobit selhání žádného formuláře — email je vždy non-blocking.
- **FR-003**: Newsletter formulář MUSÍ sledovat analytické eventy (`form_submit`, `form_success`, `form_error`) s identifikátorem `form: "newsletter"`.
- **FR-004**: Systém MUSÍ mít vytvořené tři Notion databáze (Leads, Enterprise, Newsletter) s definovanými sloupci odpovídajícími datovému modelu.
- **FR-005**: Notion Database IDs MUSÍ být konfigurovatelné přes env proměnné (`NOTION_DB_LEADS`, `NOTION_DB_ENTERPRISE`, `NOTION_DB_NEWSLETTER`).
- **FR-006**: Všechny Resend email šablony MUSÍ mít konzistentní vizuální styl (název služby, barvy, patička).
- **FR-007**: Newsletter potvrzovací email MUSÍ obsahovat informaci o frekvenci zasílání a kontaktní údaj.
- **FR-008**: Systém MUSÍ detekovat duplicitní email v Newsletter databázi a informovat uživatele místo vytvoření duplicity. Pokud kontrola duplicit selže (výpadek Notion API), systém vytvoří záznam bez ověření — přednost má zachování odběratele před prevencí duplicit.
- **FR-009**: Veškerý uživatelsky viditelný text (emaily, chybové hlášky, UI) MUSÍ být v češtině.
- **FR-010**: Newsletter formulář MUSÍ obsahovat GDPR checkbox se souhlasem se zpracováním osobních údajů, shodně s Register a Contact formuláři. Datum souhlasu se ukládá do Notion DB.

### Key Entities

- **Lead (Pro registrace)**: Jméno, email, firma, use case, volitelný detail, GDPR souhlas, datum, status. Uložen v Notion DB "Leads".
- **Enterprise kontakt**: Jméno, email, firma, telefon (volitelný), velikost firmy, zpráva, GDPR souhlas, datum. Uložen v Notion DB "Enterprise".
- **Newsletter odběratel**: Email, GDPR souhlas (datum), datum přihlášení. Uložen v Notion DB "Newsletter".
- **Email notifikace**: Tři typy — potvrzení registrace (odesíláno uživateli), enterprise notifikace (odesíláno vlastníkovi), potvrzení newsletter přihlášení (odesíláno uživateli).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Všechny tři formuláře (Register, Contact, Newsletter) úspěšně ukládají data do příslušných Notion databází při ručním testu.
- **SC-002**: Všechny tři typy emailů (registrace, enterprise, newsletter) jsou doručeny při ručním testu s platným Resend API klíčem.
- **SC-003**: Newsletter formulář odesílá analytické eventy (`form_submit`, `form_success`, `form_error`) shodně s Register a Contact formuláři.
- **SC-004**: Selhání Resend API neblokuje úspěšné odeslání žádného ze tří formulářů.
- **SC-005**: Duplicitní newsletter přihlášení je detekováno a uživatel obdrží informativní zprávu místo chybové hlášky.
- **SC-006**: Všechny emaily obsahují brand identitu (název služby, kontakt, česky) a zobrazují se správně v běžných emailových klientech.

## Assumptions

- Resend účet je nakonfigurován s ověřenou doménou (nebo sandbox pro testování).
- Notion integrace token má právo vytvářet stránky a dotazovat databáze ve workspace.
- Notion databáze budou vytvořeny přes Notion MCP nástroje během implementace (přímé vytvoření přes API, bez potřeby setup skriptu).
- Email šablony používají inline HTML bez externích závislostí (React Email není v scope).
- Progressive enhancement (fungování bez JS) není v scope — formuláře vyžadují JavaScript.

## Out of Scope

- Double opt-in pro newsletter (potvrzovací odkaz v emailu).
- Odhlášení z newsletteru (unsubscribe link v emailu).
- React Email šablonovací systém.
- ~~GDPR consent checkbox pro newsletter formulář~~ — přesunuto do scope (viz Clarifications).
- Automatické retry při selhání Notion API.
- Migrace dat z existujících zdrojů do Notion databází.

## Clarifications

### Session 2026-03-17

- Q: Má newsletter formulář obsahovat GDPR checkbox? → A: Ano, přidat GDPR checkbox shodně s Register/Contact formuláři (Option A).
- Q: Co dělat při selhání kontroly duplicit v newsletter DB? → A: Vytvořit záznam bez ověření — ztráta odběratele je horší než duplicita (Option A).
- Q: Jak vytvořit Notion databáze? → A: Přes Notion MCP nástroje přímo během implementace — efektivnější než manuální postup nebo setup skript.
