## Overview

Cortéa is an etiquette intelligence app designed to enhance social and cultural understanding. It provides scenario-based training, an AI etiquette advisor, and country-specific cultural guides. The project aims to deliver a sophisticated, personalized learning experience in etiquette through a multi-module application.

Its core capabilities include:
- **The Atelier**: Scenario-based training tailored to specific regions and etiquette pillars.
- **The Counsel**: An AI-powered advisor for real-time etiquette guidance using Anthropic Claude.
- **The Cultural Compass**: Comprehensive, country-by-country etiquette guides, including curated local venue recommendations.

The app uses a pnpm workspace monorepo with TypeScript, Express.js for the API, PostgreSQL with Drizzle ORM for data management, and React for the frontend. Key features include a unique magic-link authentication system, a sophisticated behavioral psychology layer for personalized profiling, gamification elements, and a multi-tier subscription model.

## User Preferences

I prefer clear, concise explanations and direct answers.
I expect an iterative development process, with frequent updates and opportunities for feedback.
Please ask for confirmation before making any significant architectural changes or adding new external dependencies.
Ensure all code adheres to the established coding standards, especially regarding error handling, module structure, and documentation.
Prioritize the use of Drizzle ORM for database interactions and Tailwind CSS for styling.
Do not introduce global state management solutions beyond React Query for server state.
For any user-facing strings, ensure they are externalized for internationalization.

## System Architecture

The Cortéa application is structured as a pnpm workspace monorepo.

**Core Technologies**:
- **Monorepo Tool**: pnpm workspaces
- **Backend**: Node.js 24, Express 5, TypeScript 5.9
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **AI Integration**: Anthropic Claude (`@anthropic-ai/sdk`)
- **Frontend**: React (details on specific frameworks like Next.js or Vite are not provided, assuming standard React setup), Tailwind CSS for styling, React Query for server state management.
- **Internationalization**: `react-i18next` with `i18next-http-backend` supporting 9 locales, including RTL for Arabic.

**Architectural Patterns & Decisions**:
- **Monorepo Structure**: Facilitates shared code, consistent tooling, and independent package development.
- **API Design**: All API routes are prefixed with `/api` and defined in `app.ts`. Route handlers avoid the `/api` prefix internally.
- **Authentication**: Magic-link email authentication (passwordless) and Google OAuth 2.0 via OpenID Connect (PKCE). Session tokens are server-side stored and used as Bearer tokens. Google sign-in uses `prompt: "select_account"` to force the account picker and routes new users to `/onboarding`; `APP_PUBLIC_URL` is set in production to ensure the correct redirect URI is used (`https://sowiso-01.replit.app/api/auth/google/callback`).
- **Internationalization (i18n)**: Supports 9 languages with locale-aware content and UI. Content is bundled JSON or fetched via API with upsert capabilities. RTL direction is handled dynamically.
- **Content Segmentation**: Differentiates `locale` (UI language) from `activeRegion` (etiquette context).
- **Module Structure**: Emphasizes separation of concerns; routes handle validation and service calls, while services contain business logic and DB queries.
- **Behavioral Psychology Layer**: Invisible profiling (`behavior_profile` JSON column on users) tracks user behavior (e.g., listening score, assertiveness style, conflict mode) and influences AI responses and personalized content. User-facing labels are etiquette-focused, not psychological.
- **Gamification Layer**: Includes daily streaks, quests, wardrobe unlocks, and an "Oeps-Knop" (emergency apology guide). Pillar mastery unlocks avatar customizations. Badge system covers four Atelier types (pillar → phase → country → ambassador) plus a fifth type `compass` (one per country, register-agnostic) awarded silently when a user visits a Compass region page. Triggered via `POST /api/compass/:regionCode/visited`.
- **Subscription Tiers**: Three tiers (Guest, Traveller, Ambassador) with feature flagging and Stripe integration for payments. Content gating is implemented with blurred overlays and upgrade prompts.
- **Cultural Compass (The Local)**: Integrates curated venue data for specific regions and categories, providing context to AI counsel. This data is static and in-memory.
- **Admin Tools**: `CC Screening Worker` for AI-driven extraction and multilingual translation of etiquette rules from text fragments.

**UI/UX Decisions**:
- **Styling**: Exclusively uses Tailwind CSS.
- **Component Design**: `FlagEmoji` component for consistent country flag display. `TierGate` for subscription content gating. `VenueCard` for displaying curated local venues.
- **Dynamic Content**: Uses `useState` for local UI state and React Query for server state.
- **Accessibility**: Includes an accessibility panel with high-contrast and text-size controls.
- **Narrative Modes**: Scenario.tsx features Classic/Story Mode toggle.

## Dev → Productie Workflow

### Eenmalige initiële sync (dev → prod)

1. **Stel `PROD_DATABASE_URL` in als secret** (Replit Settings → Secrets).
   Kopieer de connection string vanuit je Replit deployment database-instellingen.

2. **Controleer de sync-status** (toont row-counts per tabel):
   ```bash
   node scripts/check-sync-status.mjs
   ```

3. **Droog-run** om te zien wat er gesynchroniseerd zou worden:
   ```bash
   node scripts/sync-data-to-prod.mjs --dry-run
   ```

4. **Voer de sync uit** (upsert van dev → prod, idempotent):
   ```bash
   node scripts/sync-data-to-prod.mjs
   ```
   Of voor één specifieke tabel:
   ```bash
   node scripts/sync-data-to-prod.mjs --table learning_track_questions
   ```

### Toekomstige vertaalruns direct naar prod

Alle worker-scripts ondersteunen nu `--target prod`:

- `node scripts/translate-learning-track-questions.mjs --lang nl --target prod`
- `node scripts/translate-compass-content.mjs --lang fr --target prod`
- `node scripts/scenario-translate.mjs --lang de --target prod`
- `node scripts/generate-learning-track-questions.mjs --region AE --target prod`

In de Admin-UI (Vertalingen-tab) selecteer "prod" in de **Omgeving**-dropdown
vóór je een worker start. Kies altijd terug "dev" na afloop.

### Tabellen die NIET gesynchroniseerd worden
- `users` — productiegebruikers mogen nooit overschreven worden.
- `worker_runs` — run-history blijft altijd in dev.

### Conflict-kolommen per tabel
| Tabel | Conflict-kolom |
|---|---|
| `learning_track_questions` | `question_hash` |
| `culture_protocols` | `id` |
| `translations` | `id` |
| `compass_regions` | `region_code` |
| `scenarios` | `id` |
| `badges` | `slug` |
| `counsel_region_seeds` | `id` |

## External Dependencies

- **Database**: PostgreSQL
- **AI**: Anthropic Claude (via Replit-managed integration)
- **Payment Gateway**: Stripe (with a note for future integration of Mollie, PayPal, and regional methods)
- **i18n**: `react-i18next`, `i18next-http-backend`
- **ORM**: Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API Codegen**: Orval
- **Build Tool**: esbuild
- **Frontend State Management**: `@tanstack/react-query` (React Query)
