/**
 * Counsel — Basic-tier integration test (task #74).
 *
 * Renders the real `<Counsel />` page for an authenticated Basic-tier
 * user and exercises the full gating flow against the mounted DOM:
 *
 *   1. Six non-Dining domain cards must be rendered as disabled
 *      `<button disabled>` elements, each containing a Lock icon.
 *   2. Five real consultations must succeed (mocked /api/counsel),
 *      with the page-visible counter decrementing 5 → 4 → 3 → 2 → 1 → 0.
 *   3. Once the limit is reached, the "Expand your world" upgrade gate
 *      must appear, and the previously-free Dining domain must also
 *      become a disabled button.
 *
 * The page consumes profile + auth + i18n + region + react-query +
 * wouter; this spec mocks the boundaries (`useGetProfile`, `useAuth`,
 * `useLanguage`, `useActiveRegion`, `useRegisterQuality`, `fetch`) and
 * lets the rest of the component tree render real DOM in happy-dom.
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

// ── Mock @/lib/i18n: identity translator with {{var}} interpolation ──────────
//
// The real i18n stack ships an English translation table; for the handful
// of templated strings the gating UX renders we need the production
// template strings (otherwise interpolation is performed against the
// raw key and our text assertions miss). Anything not listed here falls
// back to the key itself, which is plenty for assertion-by-key matching.
const EN_TRANSLATIONS: Record<string, string> = {
  "counsel.domains.remaining": "{{count}} remaining",
  "counsel.consultations_remaining":
    "{{remaining}} of {{limit}} complimentary consultations remaining",
  "counsel.gate.limit_desc":
    "You have employed your {{count}} complimentary consultations. Shall we expand your access?",
};

vi.mock("@/lib/i18n", () => {
  function t(key: string, vars?: Record<string, string | number> | string): string {
    if (typeof vars === "string") return vars;
    const template = EN_TRANSLATIONS[key] ?? key;
    if (vars && typeof vars === "object") {
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v)),
        template,
      );
    }
    return template;
  }
  return {
    useLanguage: () => ({
      t,
      locale: "en-GB" as const,
      setLocale: () => {},
      dir: "ltr" as const,
      language: "en" as const,
    }),
    LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ── Mock @/lib/active-region: keep real exports, override the hook ───────────
vi.mock("@/lib/active-region", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/active-region")>();
  return {
    ...mod,
    useActiveRegion: () => ({
      activeRegion: "GB" as const,
      setActiveRegion: () => {},
      getRegionName: (code: string) => code,
      isLocationDetected: false,
    }),
  };
});

// ── Mock @/lib/auth: authenticated Basic-tier user ───────────────────────────
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    userId: "basic-user-1",
    userName: "Test Basic",
    isAuthenticated: true,
    isAdmin: false,
    login: () => {},
    logout: () => {},
    getAuthHeaders: () => ({}),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ── Mock @workspace/api-client-react: profile returns subscription_tier=basic ─
vi.mock("@workspace/api-client-react", () => ({
  useGetProfile: () => ({
    data: {
      subscription_tier: "basic",
      objectives: [],
      situational_interests: [],
    },
    isLoading: false,
    error: null,
  }),
  setBaseUrl: () => {},
}));

// ── Mock heavy / network-dependent collaborators ─────────────────────────────
vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: () => {},
}));

vi.mock("@/hooks/useRegisterQuality", () => ({
  useRegisterQuality: () => ({
    result: null,
    checking: false,
    check: () => {},
    reset: () => {},
  }),
}));

vi.mock("@/components/LockOverlay", () => ({
  LockOverlay: () => <div data-testid="lock-overlay" />,
}));

vi.mock("@/components/BehaviorSkillsCarousel", () => ({
  BehaviorSkillsCarousel: () => <div data-testid="behavior-skills-carousel" />,
}));

vi.mock("@/components/ActiveContextChips", () => ({
  ActiveContextChips: () => <div data-testid="active-context-chips" />,
}));

// Counsel imports {Card, CardContent, CardHeader, CardDescription, Button,
// Textarea} from local UI primitives — these are pure presentational and
// require no mocking. lucide icons render inline SVGs we can query.

// ── Helpers ──────────────────────────────────────────────────────────────────
import Counsel from "@/pages/Counsel";

const DOMAIN_LABELS = {
  dining: "counsel.domains.dining",
  introductions: "counsel.domains.introductions",
  dress_code: "counsel.domains.dress_code",
  gifting: "counsel.domains.gifting",
  digital_protocol: "counsel.domains.digital_protocol",
  hosting: "counsel.domains.hosting",
  apologies: "counsel.domains.apologies",
} as const;

const NON_DINING_LABELS = [
  DOMAIN_LABELS.introductions,
  DOMAIN_LABELS.dress_code,
  DOMAIN_LABELS.gifting,
  DOMAIN_LABELS.digital_protocol,
  DOMAIN_LABELS.hosting,
  DOMAIN_LABELS.apologies,
];

function renderCounsel() {
  const { hook } = memoryLocation({ path: "/counsel", record: true });
  return render(
    <Router hook={hook}>
      <Counsel />
    </Router>,
  );
}

/** Returns the domain card button for a given i18n label. */
function getDomainButton(label: string): HTMLButtonElement {
  // The same translation key is reused inside the situation-context picker,
  // so we narrow to buttons whose primary text is *only* the label.
  const all = screen.getAllByRole("button", { name: (n) => n.includes(label) });
  // Domain cards are rendered with `aria-pressed`; situation chips are not.
  const domainCard = all.find((el) => el.hasAttribute("aria-pressed"));
  if (!domainCard) throw new Error(`Domain card not found for label: ${label}`);
  return domainCard as HTMLButtonElement;
}

/** Submits one consultation against the Dining domain. */
async function submitOneConsultation(query: string): Promise<void> {
  // 1. Select the Dining card (idempotent if already selected).
  const dining = getDomainButton(DOMAIN_LABELS.dining);
  if (dining.getAttribute("aria-pressed") !== "true") {
    fireEvent.click(dining);
  }

  // 2. The textarea is rendered inside the active consultation form.
  const textarea = await screen.findByLabelText("counsel.placeholder", { selector: "textarea" });
  fireEvent.change(textarea, { target: { value: query } });

  // 3. Submit button is the lone Send-icon button labelled "counsel.request".
  const submit = screen
    .getAllByRole("button", { name: /counsel\.request/ })
    .find((b) => !b.hasAttribute("aria-pressed")) as HTMLButtonElement;
  expect(submit).toBeDefined();
  expect(submit.disabled).toBe(false);
  fireEvent.click(submit);

  // 4. Wait for the mocked guidance to appear.
  await screen.findByText(`Mocked guidance for "${query}"`);
}

/** Resets the form to choose a new domain (post-response state). */
function resetForm(): void {
  // Two reset paths exist: the "RotateCcw" button shown after a response
  // re-uses the "counsel.request" label; we click the *outline* variant
  // which is the second occurrence in DOM order.
  const requestButtons = screen.getAllByRole("button", { name: /counsel\.request/ });
  const resetBtn = requestButtons[requestButtons.length - 1];
  fireEvent.click(resetBtn);
}

// ── Suite ────────────────────────────────────────────────────────────────────
describe("Counsel — Basic tier (rendered page)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.endsWith("/api/counsel")) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        return new Response(
          JSON.stringify({ guidance: `Mocked guidance for "${body.query}"` }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      // Fire-and-forget log endpoints + anything else
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("locks every non-Dining domain and shows a Lock icon on each", () => {
    renderCounsel();

    // Sanity: the Dining card is enabled and selectable.
    const dining = getDomainButton(DOMAIN_LABELS.dining);
    expect(dining.disabled).toBe(false);

    // Each of the six non-Dining cards must be disabled and contain a
    // lucide Lock icon (rendered as <svg class="lucide-lock …">).
    expect(NON_DINING_LABELS).toHaveLength(6);
    for (const label of NON_DINING_LABELS) {
      const card = getDomainButton(label);
      expect(card.disabled).toBe(true);
      const lockSvg = card.querySelector("svg.lucide-lock");
      expect(lockSvg, `Lock icon missing on disabled domain card "${label}"`).not.toBeNull();
    }

    // The upgrade gate ("Expand your world") must NOT yet be visible.
    expect(screen.queryByText("counsel.gate.limit_cta")).toBeNull();
  });

  it("decrements the consultations counter from 5 → 0 across five submissions", async () => {
    renderCounsel();

    // Initial state — Dining card shows "5 remaining" badge.
    expect(
      within(getDomainButton(DOMAIN_LABELS.dining)).getByText("5 remaining"),
    ).toBeDefined();

    const expectedRemainingAfter = [4, 3, 2, 1, 0];
    for (let i = 0; i < 5; i += 1) {
      await submitOneConsultation(`q${i + 1}`);

      // After a successful submission the active form (which hosts the
      // "X of 5 complimentary consultations remaining" footnote) is
      // removed from the DOM in favour of the response panel. Reset
      // back to the grid so we can re-assert against the Dining card's
      // own "X remaining" badge — that badge is the canonical
      // user-visible counter.
      resetForm();

      const remainingAfter = expectedRemainingAfter[i];
      if (remainingAfter > 0) {
        await waitFor(() => {
          expect(
            within(getDomainButton(DOMAIN_LABELS.dining)).getByText(
              `${remainingAfter} remaining`,
            ),
          ).toBeDefined();
        });
      } else {
        // After the 5th submission `basicLimitReached === true`, so the
        // remaining-badge ceases to render (it is gated on `accessible`)
        // and the Dining card itself becomes disabled. Assert both.
        await waitFor(() => {
          const dining = getDomainButton(DOMAIN_LABELS.dining);
          expect(dining.disabled).toBe(true);
          expect(dining.querySelector("svg.lucide-lock")).not.toBeNull();
        });
      }
    }

    // localStorage counter persisted by the page itself.
    expect(localStorage.getItem("counsel_q_basic-user-1")).toBe("5");

    // /api/counsel must have been called exactly five times.
    const counselCalls = fetchMock.mock.calls.filter(([u]) =>
      String(u).endsWith("/api/counsel"),
    );
    expect(counselCalls).toHaveLength(5);
  });

  it("shows the upgrade gate after the 5th submission and locks Dining too", async () => {
    // Pre-seed the counter so we only need to drive the 5th submission.
    localStorage.setItem("counsel_q_basic-user-1", "4");

    renderCounsel();

    // Counter should already read "1 remaining" on the Dining card.
    await waitFor(() => {
      expect(
        within(getDomainButton(DOMAIN_LABELS.dining)).getByText("1 remaining"),
      ).toBeDefined();
    });

    // Drive the final consultation.
    await submitOneConsultation("final-question");

    // After the 5th submission, basicLimitReached === true → gate appears.
    await waitFor(() => {
      expect(
        screen.getByText(
          "You have employed your 5 complimentary consultations. Shall we expand your access?",
        ),
      ).toBeDefined();
      expect(screen.getByText("counsel.gate.limit_cta")).toBeDefined();
    });

    // The gate's CTA must link to /membership.
    const cta = screen.getByText("counsel.gate.limit_cta").closest("a");
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute("href")).toBe("/membership");

    // Every domain — including Dining — is now a disabled button with a Lock.
    const allLabels = [DOMAIN_LABELS.dining, ...NON_DINING_LABELS];
    for (const label of allLabels) {
      const card = getDomainButton(label);
      expect(card.disabled, `Domain "${label}" should be locked after limit`).toBe(true);
      expect(
        card.querySelector("svg.lucide-lock"),
        `Lock icon missing on locked domain "${label}"`,
      ).not.toBeNull();
    }

    // localStorage was incremented to the cap.
    expect(localStorage.getItem("counsel_q_basic-user-1")).toBe("5");
  });
});
