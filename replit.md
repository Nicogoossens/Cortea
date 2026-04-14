# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude (via Replit-managed integration, `@anthropic-ai/sdk`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed-compass` — seed/update compass region data (all 13 locales)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## SOWISO App Architecture

**SOWISO** is an etiquette intelligence app with 3 modules:
- **The Atelier** — Scenario-based training filtered by `activeRegion` and pillar (1–5)
- **The Counsel** — AI etiquette advisor powered by Claude claude-sonnet-4-5 via `/api/counsel` POST
- **The Cultural Compass** — Country-by-country etiquette guides with Quick Brief panel

### Key Design Decisions

- **Locale vs Region**: `locale` (8 languages) controls UI text; `activeRegion` (14 `RegionCode` values) controls etiquette context
- **ACTIVE_REGIONS**: Only `["GB", "CN", "CA"]` have seeded Atelier + Compass data
- **API routes**: All mounted at `/api` prefix in `app.ts`. Route handlers use paths WITHOUT `/api/` prefix
- **Counsel AI**: `artifacts/api-server/src/routes/counsel.ts` — POST `/api/counsel` calls Anthropic; uses `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` + `AI_INTEGRATIONS_ANTHROPIC_API_KEY` env vars
- **Region detection**: GET `/api/detect-region` returns IP-guessed region (session-only, GDPR-safe; no persistence unless user confirms)
- **i18n**: 144+ keys × 8 languages in `artifacts/sowiso/src/lib/i18n.tsx`. Use `useLanguage()` for translated strings. Includes `register.*` and `verify.*` key groups.
- **Content labels**: `pillarDomainKey()`, `levelKey()`, `triggerLabel()` in `artifacts/sowiso/src/lib/content-labels.ts`
- **Noble Score**: 5 levels (Aware 0–19, Composed 20–39, Refined 40–59, Distinguished 60–79, Sovereign 80–100)
- **Default user**: `"default-user"` (prototype; `custom-fetch.ts` appends `user_id=default-user` to all requests)
- **Email service**: `artifacts/api-server/src/lib/email.ts` — builds branded HTML activation email; sends via SMTP if `SMTP_HOST/SMTP_USER/SMTP_PASS` env vars are set, otherwise logs token + link to console for development
- **Auth routes**: `artifacts/api-server/src/routes/auth.ts` — `POST /api/auth/register`, `GET /api/auth/verify`, `POST /api/auth/resend`, `POST /api/auth/signin`
- **Registration pages**: `/register` (Register.tsx) and `/verify-email` (EmailVerify.tsx) — full locale-aware UI
- **Users schema**: includes `email`, `email_verified`, `verification_token`, `token_expires_at`, `full_name`, `birth_year`, `gender_identity`, `is_admin` (bool), `suspended_at` (nullable timestamp) columns
- **noble_score_log schema**: includes `level_name_after` (nullable text) — captured on level-up events
- **Profile.tsx** (Task #16 + #17): Full rewrite — auth-aware (lock screen for guests), Personal Details panel (masked email, birth year, gender), Preferences section (language selector → persists via PUT /api/users/profile; region picker → persists via PATCH /api/users/profile/region), Noble Standing + Domain Mastery cards, enriched Recent Log timeline (scenario title, pillar domain, level-up badge, Review link), Account/Danger Zone with DELETE confirmation dialog
- **Enriched log API**: `GET /api/noble-score/log` LEFT JOINs scenarios table, returns `scenario_title`, `scenario_pillar`, `scenario_pillar_domain`, `level_name_after` per entry
- **Account deletion**: `DELETE /api/users/profile` cascades: removes `noble_score_log` + `zuil_voortgang` rows before deleting user record
- **i18n**: 25+ new keys added to English (`profile.personal_details`, `profile.delete_account_*`, `profile.log.*`, etc.) — all other locales auto-fallback to English via `t()` chain

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
