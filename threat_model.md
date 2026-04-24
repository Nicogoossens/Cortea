# Threat Model

## Project Overview

Cortéa is a production web application for etiquette training and cultural guidance. It uses a React + Vite frontend in `artifacts/sowiso`, an Express 5 API in `artifacts/api-server`, and PostgreSQL via Drizzle in `lib/db`. The product exposes public content, authenticated profile and progress features, premium subscription features via Stripe, and privileged admin tools for user management and content seeding. The mockup sandbox in `artifacts/mockup-sandbox` is development-only and should be ignored unless production reachability is demonstrated.

Production assumptions for this scan:
- `NODE_ENV` is `production` in deployed environments.
- Replit provides TLS for browser-to-server traffic.
- Findings should reflect production-reachable behavior, not local-only sandbox behavior.

## Assets

- **User accounts and sessions** — email addresses, password hashes, verification tokens, session tokens, OAuth identities, and admin status. Compromise enables impersonation and privileged access.
- **Personal profile data** — full name, birth year, gender identity/expression, country of origin, behavior profile, situational interests, privacy settings, and progress history. This is sensitive personal and behavioral data.
- **Premium entitlements and billing state** — subscription tier, subscription status, Stripe customer IDs, and payment-related state. Integrity matters because it controls paid access and revenue.
- **Admin capabilities** — admin-only user management, content import/seed flows, and AI-assisted screening tools. Compromise would expose user data and allow destructive changes.
- **Application secrets and third-party credentials** — Stripe connector credentials, SMTP credentials, Anthropic API credentials, OIDC configuration, and database access. Leakage can cause account compromise, billing abuse, or data exposure.
- **Content corpus and proprietary logic** — scenarios, cultural protocols, compass content, and premium AI guidance. Unauthorized access weakens the commercial model and exposes proprietary content.

## Trust Boundaries

- **Browser ↔ API** — all request bodies, query parameters, headers, and cookies are untrusted. The server must enforce authentication, authorization, and rate limits independently of frontend UI state.
- **API ↔ PostgreSQL** — the API has broad database access. Broken access control or unsafe update logic in routes directly affects data confidentiality and integrity.
- **API ↔ Stripe** — subscription state is derived from external payment events. Webhook authenticity and event validation are required before mutating entitlements.
- **API ↔ Anthropic / SMTP / OAuth providers** — external calls use privileged secrets and can incur cost or expose user data. These integrations require strict boundary checks, timeouts, and minimal data disclosure.
- **Public ↔ Authenticated ↔ Admin surfaces** — public content, signed-in user features, paid features, and admin tools must remain clearly separated with server-side enforcement.
- **Production ↔ Dev-only tooling** — `artifacts/mockup-sandbox`, attached assets, and most scripts are dev-only, but any script reachable through production admin routes becomes in-scope.

## Scan Anchors

- **Production API entry point:** `artifacts/api-server/src/app.ts`, mounted routes in `artifacts/api-server/src/routes/index.ts`
- **Frontend entry point:** `artifacts/sowiso/src/main.tsx`, app routes in `artifacts/sowiso/src/App.tsx`
- **Highest-risk backend areas:** `routes/auth.ts`, `routes/admin.ts`, `routes/users.ts`, `routes/subscription.ts`, `webhookHandlers.ts`, `routes/counsel.ts`, `routes/scenarios.ts`, `routes/culture.ts`, `routes/oidc.ts`, `routes/google-oauth.ts`
- **Sensitive data model:** `lib/db/src/schema/users.ts`
- **Public surfaces:** culture, scenarios, detect-region, health, some auth and AI endpoints
- **Authenticated surfaces:** profile, progress, subscription portal/checkout, privacy settings
- **Admin surfaces:** `/api/admin/*`, first-admin bootstrap path in auth
- **Usually dev-only:** `artifacts/mockup-sandbox`, most files under `attached_assets`, most scripts unless triggered from production routes

## Threat Categories

### Spoofing

The application supports magic-link, password, Replit OIDC, and Google OAuth sign-in. The system must bind every privileged action to a valid server-validated session and must not trust client-maintained auth state, query parameters, or frontend role flags. OAuth callbacks and webhook-style integrations must reject forged requests unless origin or signature verification succeeds.

### Tampering

Users can mutate profile data, subscription-related flows, and progress state through the API. The server must ensure clients cannot alter security-sensitive fields such as admin status, paid tier, billing state, or other users' records through general-purpose update endpoints. Stripe-originated entitlement changes must only occur after authenticated event verification.

### Information Disclosure

The database contains personal profile data, behavior profiles, privacy settings, and progress history. API responses must avoid disclosing session tokens, verification tokens, or excess personal data, and paid/proprietary content must not be exposed solely because the frontend hides it. Logs and error handling must not leak secrets or raw authentication artifacts.

### Denial of Service

Public endpoints such as auth initiation, scenario retrieval, and AI-backed counsel can be abused for cost or resource exhaustion. The platform must rate-limit expensive or account-sensitive operations proportionally to their cost and must prevent unauthenticated or low-tier users from repeatedly triggering premium AI work.

### Elevation of Privilege

This project has meaningful privilege boundaries between guest, registered, paid, and admin users. Server routes must enforce those boundaries directly. No bootstrap or maintenance endpoint should allow a normal authenticated user to become admin or to obtain premium access without an explicit trusted path such as a verified payment or an existing admin action.
