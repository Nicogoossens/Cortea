# SOWISO Translation Workers

The SOWISO front-end and database content are kept in sync across all
supported locales (en, nl, fr, de, es, pt, it, ar, ja, zh) by a set of
**background sweepers running inside the api-server process**. No manual
CLI step is required for new content to be translated and calibrated.

## Auto-running sweepers

All three sweepers start automatically when the api-server process starts
(`artifacts/api-server/src/index.ts`). They share these properties:

- They no-op silently if the Anthropic env vars are missing.
- They run on a fixed interval (defaults below) and skip ticks while a
  prior pass is still running, so they cannot overlap or overload the API.
- They log structured JSON per pass: items found, processed, errors, and
  elapsed time per language/register.

| Sweeper | Watches | Interval | Action |
| --- | --- | --- | --- |
| `register-calibration-sweeper` | `translations` rows with content key prefixes (`scenario.`, `counsel_advice.`, `hint.`, …) and `calibrated_module IS NULL` | 5 min | Calls `calibrateTranslationsByIds` with the `elite` or `standard` module derived from `formality_register`. |
| `register-scenario-translation-sweeper` | `scenarios` rows with `content_i18n IS NULL` | 2 min | Spawns `scripts/scenario-translate.mjs` for the next batch. |
| `ui-translation-sweeper` | `artifacts/sowiso/src/locales/*/translation.json` for missing keys vs the EN source | 5 min | Spawns `scripts/translate-ui.mjs --all --missing` to fill the gap for every non-EN locale. |

## Register context (Elite + Middle Class)

Every translation/calibration prompt is anchored on the two social-class
registers defined in `lib/db/src/schema/social-class-config.ts`:

- **ELITE** — formal, refined, prestige-class voice (formal address forms,
  Latinate vocabulary, no contractions, classical literary tone).
- **MIDDLE CLASS** — warm, plain, direct everyday voice (natural address
  forms, concrete vocabulary, contractions where natural, friendly tone).

The active register is selected per call:

- `register-calibration-sweeper` reads `translations.formality_register`
  (`high → elite`, `low → standard/middle_class`).
- `scripts/translate-ui.mjs` accepts `--register elite|middle_class`
  (default `elite`).
- `scripts/elite-register-worker.mjs` accepts `--register elite|middle_class`
  (default `elite`); both register descriptions are included in every
  system prompt so the model is grounded in the full spectrum.
- `artifacts/sowiso/scripts/translate.mjs` accepts `--register elite|middle_class`.

## Manual CLI use (still supported)

The CLI scripts remain available for ad-hoc audits and one-off backfills:

```bash
# Audit gaps across every locale (exits non-zero on blocking gaps)
node artifacts/sowiso/scripts/i18n-audit.mjs

# Backfill missing UI keys for a single locale (or use --all)
node scripts/translate-ui.mjs --lang nl --missing
node scripts/translate-ui.mjs --all --missing --register middle_class

# Re-evaluate a locale's `translations` rows for a register
node scripts/elite-register-worker.mjs --locale nl --register elite

# Translate scenario content rows directly
node scripts/scenario-translate.mjs --lang nl --from 1 --to 50
```

When the api-server is running, you almost never need any of these — the
sweepers will pick up new English keys, new scenarios, and new translation
rows on their next pass.
