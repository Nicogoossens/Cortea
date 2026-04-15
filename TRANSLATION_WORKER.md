# SOWISO Translation Worker

Two scripts manage translation quality in this project. Both read from the
same `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` / `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
environment variables set automatically by the Replit AI integration.

---

## 1. Coverage worker — `artifacts/sowiso/scripts/translate.mjs`

Fills **missing** translation keys. Compares every key in the English (`en`)
locale block inside `artifacts/sowiso/src/lib/i18n.tsx` against every other
language block and translates any absent keys using Claude Haiku.

```bash
node artifacts/sowiso/scripts/translate.mjs
```

No flags. Safe to run repeatedly — only processes missing keys.

---

## 2. Elite Register worker — `scripts/elite-register-worker.mjs`

Audits **all translations in the database** and rewrites any string that falls
below the elite register standard for its locale and formality level.

### What it does

1. Queries `translations` table, ordered by `language_code`, `formality_register`, `key`.
2. For each row, selects a system prompt based on `language_code` and
   `formality_register` (e.g. `nl:high`, `fr:medium`, `en:low`).
3. Calls Claude Haiku to score the string 1–10 and propose a rewrite when it
   fails the register standard.
4. Writes the refined value back to `translations.value` and stamps
   `translations.quality_reviewed_at = NOW()`.

### Usage

```bash
# Dry run — see what would change without touching the database
node scripts/elite-register-worker.mjs --dry-run

# Process only Dutch strings with verbose output
node scripts/elite-register-worker.mjs --locale nl --verbose

# Re-evaluate already-reviewed strings (re-runs all rows)
node scripts/elite-register-worker.mjs --force

# Combine flags: dry-run verbose French audit
node scripts/elite-register-worker.mjs --locale fr --dry-run --verbose
```

### Flags

| Flag | Description |
|------|-------------|
| `--locale <code>` | Restrict to a single locale. Accepts a base code (`nl`, `fr`) **or** a full locale (`nl-NL`, `en-GB`). Base codes filter on `language_code`; full locales filter on `region_link`, guaranteeing region-level isolation (e.g. `--locale nl-NL` leaves `nl-BE` rows untouched). |
| `--dry-run` | Print planned rewrites; do **not** write to the database |
| `--verbose` | Show every evaluated string, even those that pass |
| `--force` | Re-evaluate rows that already have `quality_reviewed_at` set |

### Locale filtering in detail

The `--locale` flag detects whether a code contains a hyphen:

| Argument | Filter applied | Example rows matched |
|----------|---------------|---------------------|
| `--locale nl` | `WHERE language_code = 'nl'` | All Dutch rows (nl-NL and nl-BE) |
| `--locale nl-NL` | `WHERE region_link = 'nl-NL'` | Only Netherlands Dutch rows |
| `--locale nl-BE` | `WHERE region_link = 'nl-BE'` | Only Belgian Dutch / Flemish rows |
| `--locale en-GB` | `WHERE region_link = 'en-GB'` | Only British English rows |
| `--locale en-US` | `WHERE region_link = 'en-US'` | Only American English rows |

### Protected keys

The following keys are never rewritten, regardless of their current value:

- `app.name`
- `app.established`
- `atelier.duration`

### Adding a new region or register level

System prompts live in the `LOCALE_PROMPTS` object at the top of
`scripts/elite-register-worker.mjs`. Keys follow the pattern:

- `"<language_code>"` — used when no formality-specific prompt matches
- `"<language_code>:<formality_register>"` — used when the DB row's
  `formality_register` matches (e.g. `"nl:high"`, `"en:medium"`)

To add a new locale (e.g. Belgian Dutch `nl-BE`):

1. Ensure the translation rows have `language_code = "nl"` (the base language)
   and `region_link = "nl-BE"` (the full locale tag). This is the schema convention:
   `language_code` is always the base code; `region_link` carries the full locale.
2. Add a `"nl-BE"` key to `LOCALE_PROMPTS` describing Belgian aristocratic norms
   (use of `u`, Flemish literary vocabulary, avoidance of Dutch-Netherlands
   idioms, etc.). Optionally add `"nl-BE:high"` / `"nl-BE:medium"` variants.
3. Run the worker with `--locale nl-BE` (full locale → filters `WHERE region_link = 'nl-BE'`,
   leaving `nl-NL` rows untouched).

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Anthropic proxy base URL (auto-set by Replit) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic proxy key (auto-set by Replit) |

### Schema setup note

The `quality_reviewed_at` column was added to `translations` via `pnpm run db:push`
(Drizzle schema-push — this project does not use migration files). If deploying to a
fresh database that has not received the push, run:

```bash
pnpm --filter @workspace/db run db:push
```

The column is nullable, so existing rows are not affected.

---

## 3. Real-time register quality check (API + Counsel page)

A live quality check fires as the user types in the Counsel textarea. After a
900 ms debounce and a minimum of 30 characters, the text is sent to
`POST /api/register-quality/check` (authenticated endpoint) and evaluated
against the same per-locale elite register standard. If the score is below 8/10,
an amber suggestion card appears below the textarea with a hint in the user's
own language.

**Endpoint**: `POST /api/register-quality/check`  
**Auth**: Bearer token required (same as all other authenticated routes)  
**Body**: `{ "text": "…", "locale": "nl-NL" }`  
**Response**: `{ "pass": boolean, "score": number, "hint": string|null }`
