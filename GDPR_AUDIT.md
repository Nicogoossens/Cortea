# GDPR Compliance Audit Checklist — Cortéa

**Version:** 1.0  
**Date:** 2026-05-02  
**Maintainer:** Engineering Team  
**Review cadence:** Quarterly, or when data flows change.

This document is the internal compliance record required under Art. 30 GDPR (Records of Processing Activities).  
Cross-referenced with `attached_assets/Cortea_Privacybeleid_Juridisch_1776424814028.md`.

---

## 1. Personal Data Flows

| # | Data Type | Collection Point | Legal Basis (Art. 6) | Retention | Processor / Location | Privacy Policy §  |
|---|-----------|-----------------|----------------------|-----------|----------------------|-------------------|
| 1 | E-mail address | Registration / magic-link | Contract (b) | Until account deletion + 30-day backup | Replit (US, SCC) | §3.1 |
| 2 | Full name | Optional on profile | Contract (b) | Until account deletion | Replit (US, SCC) | §3.1 |
| 3 | Birth year | Optional on profile | Contract (b) | Until account deletion | Replit (US, SCC) | §3.1 |
| 4 | Gender identity / expression | Optional on profile | Contract (b) | Until account deletion | Replit (US, SCC) | §3.1 |
| 5 | Session token | Auth cookie (HttpOnly) | Contract (b) | Session / configurable timeout | Replit (US, SCC) | §3.1 |
| 6 | Verification token | Magic-link e-mail flow | Contract (b) | Auto-expires after use | Replit (US, SCC) | §3.1 |
| 7 | Noble Score & score log | Scenario completion | Contract (b) | Until account deletion | Replit (US, SCC) | §3.2 |
| 8 | Scenario answer log (noble_score_log) | Scenario completion | Contract (b) | Until account deletion | Replit (US, SCC) | §3.2 |
| 9 | Active region & region history | User selection / IP detection | Legitimate interest (f) | Until account deletion | Replit (US, SCC) | §3.2, §3.5 |
| 10 | Language preference | User selection | Contract (b) | Until account deletion | Replit (US, SCC) | §3.2 |
| 11 | Bolton clusters (behavior_profile.listening_score, assertiveness_style, conflict_mode) | Scenario answer pattern recognition | Legitimate interest (f) — profiling for personalisation; Art. 21 opt-out supported | Until account deletion | Replit (US, SCC) | §3.3, §6 |
| 12 | EQ dimensions (self_awareness, self_regulation, empathy, social_skill) | Scenario answer pattern recognition | Legitimate interest (f) — same as above | Until account deletion | Replit (US, SCC) | §3.3, §6 |
| 13 | Nonverbal awareness score (Mehrabian) | Scenario answer pattern recognition | Legitimate interest (f) — same as above | Until account deletion | Replit (US, SCC) | §3.3, §6 |
| 14 | Counsel AI chat messages | User-initiated AI session | Contract (b) | Not stored — stateless per session | Anthropic (US, SCC) | §3.4 |
| 15 | IP address (region detection) | HTTP request | Legitimate interest (f) — personalisation | Not persisted unless user confirms region | Replit (US, SCC) | §3.5 |
| 16 | Browser type / timezone | HTTP headers | Legitimate interest (f) — session management | Session only | Replit (US, SCC) | §3.5 |
| 17 | Subscription tier & status | Subscription sign-up | Contract (b) + Legal obligation (c) | 7 years (accounting law) | Stripe/Mollie + Replit | §7 |
| 18 | Stripe customer ID | Payment flow | Contract (b) | Lifetime of subscription + legal retention | Stripe (US, SCC) | §7 |
| 19 | Wardrobe unlocks & avatar state | Gamification (Atelier progress) | Contract (b) | Until account deletion | Replit (US, SCC) | §3.2 |
| 20 | Country of origin | Optional onboarding (immutable once set) | Contract (b) | Until account deletion | Replit (US, SCC) | §3.1 |
| 21 | Objectives & interests (sports, cuisine, dress code, situational) | Optional profile enrichment | Contract (b) | Until account deletion | Replit (US, SCC) | §3.2 |
| 22 | Privacy settings (incognito, camera, mic, location) | User settings | Contract (b) | Until account deletion | Replit (US, SCC) | §3.2 |
| 23 | Profiling consent flag | GDPR Art. 21 opt-out toggle | Legal obligation (c) / legitimate interest | Until account deletion | Replit (US, SCC) | §3.3, §6 |
| 24 | Daily streak & last_activity_date | Activity tracking | Contract (b) — gamification feature | Until account deletion | Replit (US, SCC) | §3.2 |
| 25 | Invitation tokens | Companion invite flow | Contract (b) | 7 days TTL | Replit (US, SCC) | §3.2 |

---

## 2. Subject Rights Implementation Status

| Right | Article | Implementation | Status |
|-------|---------|---------------|--------|
| Right of access | Art. 15 | Data export via Profile → My Data → "Download data" (`GET /api/users/me/export`) | ✅ Implemented |
| Right to rectification | Art. 16 | Profile fields editable in-app; email correction via support | ✅ Implemented |
| Right to erasure | Art. 17 | Profile → Danger Zone → "Delete Account" (`DELETE /users/profile`, cascading delete) | ✅ Implemented |
| Right to restriction | Art. 18 | Contact privacy@cortea.app — manual process, 30-day SLA | ⚠️ Manual only |
| Right to portability | Art. 20 | Structured JSON export (`GET /api/users/me/export`) with account, score log, behaviour profile, pillar progress | ✅ Implemented |
| Right to object (profiling) | Art. 21 | Profile → My Data → "Pause profiling" toggle (`PATCH /users/profile/profiling-consent`); suppresses Bolton/EQ/Mehrabian writes | ✅ Implemented |
| Right to withdraw consent | Art. 7.3 | Marketing e-mail unsubscribe (when applicable) | N/A — no marketing yet |
| Right not to be subject to automated decisions | Art. 22 | Behavioural profiling has no legal/significant effects — Art. 22 does not apply | ✅ Confirmed |

---

## 3. Cookie & Local Storage Audit

| Storage key | Type | Purpose | Third-party? | Requires consent? |
|-------------|------|---------|-------------|-------------------|
| `cortea_session` (HttpOnly cookie) | Session cookie | Authentication | No | No — strictly necessary |
| `sowiso_locale` | localStorage | Language preference | No | No — functional |
| `sowiso_privacy_settings_*` | localStorage | Privacy/device settings | No | No — functional |
| `cortea_cookie_consent` | localStorage | Stores cookie banner acknowledgement | No | No — functional |
| Google Analytics / FB Pixel / etc. | — | — | — | ✅ None set — no third-party tracking |

**Cookie consent banner:** displayed on first visit, dismissed on acknowledgement, preference stored in `cortea_cookie_consent`. Banner is translated into all 10 supported locales.

---

## 4. Third-Party Processors

| Processor | Country | Data shared | Transfer mechanism | DPA link |
|-----------|---------|-------------|-------------------|----------|
| Replit Inc. | US | All user data (hosting) | Standard Contractual Clauses (SCC, Art. 46) | replit.com/dpa |
| Anthropic PBC | US | Counsel chat messages (stateless) | Standard Contractual Clauses (SCC, Art. 46) | anthropic.com/legal |
| Stripe Inc. | US | Payment & subscription data | Standard Contractual Clauses (SCC, Art. 46) | stripe.com/legal/dpa |
| Mollie B.V. | NL (EU) | Payment & subscription data (if used) | Within EEA — no transfer mechanism needed | mollie.com/en/dpa |
| E-mail provider (TBD) | TBD | Magic-link auth e-mails | SCC or EEA-based | To be confirmed |

---

## 5. Data Deletion — Cascade Coverage

Deletion triggered by `DELETE /api/users/profile`:

| Table | Cascade | Status |
|-------|---------|--------|
| `users` | Deleted | ✅ |
| `noble_score_log` | Deleted (explicit query) | ✅ |
| `zuil_voortgang` | Deleted (explicit query) | ✅ |
| `user_badges` | Deleted (FK ON DELETE CASCADE) | ✅ |
| `companion_links` | Deleted (explicit query, both user_a_id and user_b_id) | ✅ |
| `invitations` | Deleted (explicit query, both inviter_id and invitee_id) | ✅ |
| `roleplay_completions` | Deleted (explicit query) | ✅ |
| `roleplay_reflections` | Deleted (explicit query, both author_id and target_user_id) | ✅ |
| `learning_track_progress` | Deleted (FK ON DELETE CASCADE) | ✅ |
| `learning_track_attempts` | Deleted (FK ON DELETE CASCADE) | ✅ |
| `user_country_interests` | Deleted (FK ON DELETE CASCADE) | ✅ |

> All user-scoped tables are now fully erased on `DELETE /api/users/profile`, satisfying GDPR Art. 17 (Right to Erasure).

---

## 6. Breach Response Plan

| Step | Action | Deadline |
|------|--------|---------|
| Discovery | Identify scope and affected users | Immediate |
| Assessment | Determine risk to rights/freedoms | Within 24 h |
| Supervisory authority notification (Art. 33) | Notify GBA (gegevensbeschermingsautoriteit.be) | Within 72 h |
| Data subject notification (Art. 34) | Notify affected users if high risk | Without undue delay |
| Remediation | Patch, rotate tokens, revoke sessions | ASAP |

**Contact:** Gegevensbeschermingsautoriteit (GBA), Drukpersstraat 35, 1000 Brussels — contact@apd-gba.be

---

## 7. Outstanding Actions

| Priority | Action | Owner | Target date |
|----------|--------|-------|------------|
| HIGH | Fill in DPA link for e-mail provider once selected | Legal/Ops | Before launch |
| MEDIUM | Formal DPO appointment or documented exemption | Legal | Before EU launch |
| MEDIUM | Fill in KBO/BTW number and legal entity details in Privacy Policy | Legal | Before launch |
| MEDIUM | Set effective date in Privacy Policy | Legal | Before launch |
| LOW | CCPA compliance layer for California users | Engineering | Follow-up task |
| LOW | Formal Art. 30 Records of Processing Activities filing | Legal/Ops | After launch |

---

*This document is maintained by the Engineering team and reviewed quarterly. Last updated: 2026-05-02.*
