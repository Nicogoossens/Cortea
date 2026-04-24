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

## Cortéa App Architecture

**Cortéa** is an etiquette intelligence app with 3 modules:
- **The Atelier** — Scenario-based training filtered by `activeRegion` and pillar (1–5)
- **The Counsel** — AI etiquette advisor powered by Claude claude-sonnet-4-5 via `/api/counsel` POST
- **The Cultural Compass** — Country-by-country etiquette guides with Quick Brief panel

### Key Design Decisions

- **Locale vs Region**: `locale` (9 languages) controls UI text; `activeRegion` (20 `RegionCode` values) controls etiquette context
- **ACTIVE_REGIONS**: 17 priority countries have full Compass content (GB, AU, CN, US, JP, DE, IT, FR, BE, CH, SG, IN, MX, BR, ES, CO, AE). ~238 total country stubs in DB with `is_published=false`
- **API routes**: All mounted at `/api` prefix in `app.ts`. Route handlers use paths WITHOUT `/api/` prefix
- **Counsel AI**: `artifacts/api-server/src/routes/counsel.ts` — POST `/api/counsel` calls Anthropic; uses `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` + `AI_INTEGRATIONS_ANTHROPIC_API_KEY` env vars
- **Region detection**: GET `/api/detect-region` returns IP-guessed region (session-only, GDPR-safe; no persistence unless user confirms)
- **i18n (Task #6 — complete)**: react-i18next with `i18next-http-backend`. 9 locales: en, nl, fr, de, es, pt, it, ar (RTL), ja. 386 keys each. Bundled JSON in `src/locales/{lang}/translation.json`; DB-backed via `GET /api/translations?language_code={lng}` (upsert with `ON CONFLICT`). RTL direction applied to `<html dir="rtl">` for Arabic. Accessibility panel with high-contrast + text-size controls. All 60 scenarios translated into ar + ja.
- **Content labels**: `pillarDomainKey()`, `levelKey()`, `triggerLabel()` in `artifacts/sowiso/src/lib/content-labels.ts`
- **Noble Score**: 5 levels (Aware 0–19, Composed 20–39, Refined 40–59, Distinguished 60–79, Sovereign 80–100)
- **Auth model (deliberate design decision)**: Cortéa uses magic-link email authentication — no passwords, no OAuth, no SMS. `POST /api/auth/signin` emails a one-time link; `GET /api/auth/verify` exchanges the token for a session. Session token is stored server-side in the DB and sent as a Bearer token. All protected routes resolve user identity from this token only (no query-param identity). This is intentional for the current scope.
- **Email service**: `artifacts/api-server/src/lib/email.ts` — builds branded HTML activation email; sends via SMTP if `SMTP_HOST/SMTP_USER/SMTP_PASS` env vars are set, otherwise logs token + link to console for development
- **Auth routes**: `artifacts/api-server/src/routes/auth.ts` — `POST /api/auth/register`, `GET /api/auth/verify`, `POST /api/auth/resend`, `POST /api/auth/signin`
- **Registration pages**: `/register` (Register.tsx) and `/verify-email` (EmailVerify.tsx) — full locale-aware UI
- **Users schema**: includes `email`, `email_verified`, `verification_token`, `token_expires_at`, `full_name`, `birth_year`, `gender_identity`, `is_admin` (bool), `suspended_at` (nullable timestamp) columns
- **noble_score_log schema**: includes `level_name_after` (nullable text) — captured on level-up events
- **Profile.tsx** (Task #16 + #17): Full rewrite — auth-aware (lock screen for guests), Personal Details panel (masked email, birth year, gender), Preferences section (language selector → persists via PUT /api/users/profile; region picker → persists via PATCH /api/users/profile/region), Noble Standing + Domain Mastery cards, enriched Recent Log timeline (scenario title, pillar domain, level-up badge, Review link), Account/Danger Zone with DELETE confirmation dialog
- **Enriched log API**: `GET /api/noble-score/log` LEFT JOINs scenarios table, returns `scenario_title`, `scenario_pillar`, `scenario_pillar_domain`, `level_name_after` per entry
- **Account deletion**: `DELETE /api/users/profile` cascades: removes `noble_score_log` + `zuil_voortgang` rows before deleting user record
- **i18n**: 25+ new keys added to English (`profile.personal_details`, `profile.delete_account_*`, `profile.log.*`, etc.) — all other locales auto-fallback to English via `t()` chain

- **Task #27 — Behavioral Psychology Layer (SILENT)**: Invisible behavior profiling embedded across all modules. Key implementation:
  - **DB**: `behavior_profile` JSON column on users (Bolton cluster tracking: listening_score, assertiveness_style, conflict_mode, nonverbal_awareness, eq_dimensions); `behavioral_tags`, `bolton_cluster`, `correction_style` columns on scenarios
  - **noble_score.ts**: `updateBehaviorProfile()` updates user behavior profile on every scenario answer based on `bolton_cluster` (1=listening, 2=assertiveness, 3=conflict). Saves `correction_style` as mentor feedback when user answers incorrectly.
  - **counsel.ts**: Enriched system prompt with Bolton 3-step structure (Acknowledge → Illuminate → Guide) + Mehrabian nonverbal weighting map for 18 regions (tone/nonverbal/words breakdown per culture)
  - **culture.ts**: `MEHRABIAN_WEIGHTS` map added; compass region detail API now includes `mehrabian_weight: { nonverbal, tone, words, note }` in response
  - **seed.ts**: 3 Bolton cluster scenarios added (Cluster 1: "The Interrupted Confidence" GB, Cluster 2: "The Persistent Host" CN, Cluster 3: "The Misread Remark" US)
  - **Profile.tsx**: Refinement Compass card with SVG pentagon radar chart (5 etiquette-language dimensions: Attentiveness, Composure, Discernment, Diplomacy, Presence). Fetches `GET /api/users/behavior-profile` in parallel with profile fetch. Card only appears for authenticated users with a behavior profile.
  - All user-facing labels are in etiquette language — no psychological labels shown to the user

- **CC Screening Worker (Task #24)**: Admin tool for extracting etiquette rules from book fragments. Key implementation:
  - **Routes**: `POST /api/admin/cc-screen` (AI extraction) + `POST /api/admin/cc-save` (persist)
  - **Multilingual**: `cc-save` automatically translates `rule_cc` into 8 languages (nl/fr/de/es/pt/it/ar/ja) via single Claude call after insert, stored in `rule_cc_i18n jsonb` column on `culture_protocols`
  - **Culture protocols API**: `GET /api/culture/protocols?locale=nl-NL` resolves locale-aware `display_rule` field per record (`rule_cc_i18n[lang]` → `rule_cc` → `rule_description` fallback chain)
  - **Admin UI**: After save, translations panel shows all 8 language versions of `rule_cc` immediately

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Subscription Tiers (Task #4)

Three tiers are implemented: **The Guest** (free), **The Traveller** (€9.99/mo, €79/yr), **The Ambassador** (€29/mo, €249/yr).

- **Feature flags**: `artifacts/api-server/src/lib/tier-features.ts`
- **Backend routes**: `artifacts/api-server/src/routes/subscription.ts` — `/api/subscription/tiers`, `/api/subscription/plans`, `/api/subscription/checkout`, `/api/subscription/portal`, `/api/subscription/features`
- **Webhook handler**: `artifacts/api-server/src/webhookHandlers.ts` — auto-updates `subscription_tier` in DB on Stripe events
- **Frontend gate**: `artifacts/sowiso/src/components/TierGate.tsx` — inline blurred content with upgrade prompt (never pop-ups)
- **Membership page**: `artifacts/sowiso/src/pages/Membership.tsx` — 3-tier comparison with monthly/yearly toggle
- **DB schema**: `stripe_customer_id` column added to `users` table

### Payment Integration — PRE-LAUNCH TODO

> **IMPORTANT**: Stripe is not available in all countries worldwide. Before launching, we must add additional payment providers to ensure full global coverage. Options to evaluate:
> - **Mollie** — strong EU coverage, ideal for Belgian/Dutch market
> - **PayPal** — broad international reach
> - **Local/regional methods** — iDEAL (NL), Bancontact (BE), etc.
>
> The Stripe integration code is ready but **Stripe credentials are not yet connected**. To activate payments:
> 1. Connect Stripe via the Replit integrations panel (connector ID: `ccfg_stripe_default_org_ernmlb`)
> 2. Run `pnpm --filter @workspace/scripts exec tsx src/seed-products.ts` to create products in Stripe
> 3. Set `STRIPE_WEBHOOK_SECRET` in environment secrets for the webhook endpoint
> 4. Evaluate and add at least one additional payment provider before launch
