/**
 * Integration tests for the <WelcomeBanner /> component.
 *
 * Uses happy-dom + React Testing Library + vitest fake timers to verify
 * the actual render lifecycle, fade-in/fade-out timing, and the
 * sessionStorage-based visit-tracking semantics.
 *
 * Required scenarios from task #87:
 *   1. Anonymous first visit shows the banner and writes the anon key
 *   2. Named first visit shows the banner and writes the named key
 *   3. Subsequent visits suppress the banner entirely
 *   4. Dismiss timer + fade work correctly
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Router } from "wouter";
import { WelcomeBanner, WELCOME_FADE_IN_MS, WELCOME_FADE_OUT_MS } from "../components/WelcomeBanner";
import { WELCOME_DURATION_MS } from "../lib/welcome-banner";

const labels = {
  namedLabel: "Welcome back, Alice",
  anonLabel: "Welcome back",
  promptLabel: "Complete your profile",
  dismissLabel: "Dismiss",
};

function renderBanner(overrides: Partial<React.ComponentProps<typeof WelcomeBanner>> = {}) {
  const props: React.ComponentProps<typeof WelcomeBanner> = {
    userId: "user-1",
    hasProfile: true,
    hasScore: true,
    firstName: null,
    ...labels,
    scoreLine: null,
    nextRankLine: null,
    ...overrides,
  };
  return render(
    <Router>
      <WelcomeBanner {...props} />
    </Router>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  sessionStorage.clear();
});

// ─── Scenario 1: Anonymous first visit ───────────────────────────────────────

describe("WelcomeBanner — anonymous first visit", () => {
  it("renders the banner and writes the anon key to sessionStorage", () => {
    const { getByTestId } = renderBanner({ firstName: null });

    const banner = getByTestId("welcome-banner");
    expect(banner).toBeTruthy();
    expect(banner.getAttribute("aria-label")).toBe(labels.anonLabel);
    expect(sessionStorage.getItem("welcome_shown_anon_user-1")).toBe("1");
    expect(sessionStorage.getItem("welcome_shown_named_user-1")).toBeNull();
  });

  it("shows a 'complete your profile' link for anonymous users", () => {
    const { getByText } = renderBanner({ firstName: null });
    expect(getByText(labels.promptLabel)).toBeTruthy();
  });
});

// ─── Scenario 2: Named first visit ───────────────────────────────────────────

describe("WelcomeBanner — named first visit", () => {
  it("renders the banner and writes the named key to sessionStorage", () => {
    const { getByTestId, queryByText } = renderBanner({ firstName: "Alice" });

    const banner = getByTestId("welcome-banner");
    expect(banner).toBeTruthy();
    expect(banner.getAttribute("aria-label")).toBe(labels.namedLabel);
    expect(sessionStorage.getItem("welcome_shown_named_user-1")).toBe("1");
    expect(sessionStorage.getItem("welcome_shown_anon_user-1")).toBeNull();
    // No "complete your profile" CTA for named users
    expect(queryByText(labels.promptLabel)).toBeNull();
  });
});

// ─── Scenario 3: Subsequent visits suppress the banner ───────────────────────

describe("WelcomeBanner — subsequent visit suppression", () => {
  it("does not render anything when the anon key already exists", () => {
    sessionStorage.setItem("welcome_shown_anon_user-1", "1");
    const { queryByTestId } = renderBanner({ firstName: null });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });

  it("does not render anything when the named key already exists", () => {
    sessionStorage.setItem("welcome_shown_named_user-1", "1");
    const { queryByTestId } = renderBanner({ firstName: "Alice" });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });

  it("renders only on the first of two consecutive mounts", () => {
    const first = renderBanner({ firstName: null });
    expect(first.queryByTestId("welcome-banner")).toBeTruthy();
    first.unmount();

    const second = renderBanner({ firstName: null });
    expect(second.queryByTestId("welcome-banner")).toBeNull();
  });

  it("upgrade scenario: anon visit then named visit shows banner again", () => {
    const anonRender = renderBanner({ firstName: null });
    expect(anonRender.queryByTestId("welcome-banner")).toBeTruthy();
    expect(sessionStorage.getItem("welcome_shown_anon_user-1")).toBe("1");
    anonRender.unmount();

    // User adds a name → next mount uses the named key, banner re-appears
    const namedRender = renderBanner({ firstName: "Alice" });
    expect(namedRender.queryByTestId("welcome-banner")).toBeTruthy();
    expect(sessionStorage.getItem("welcome_shown_named_user-1")).toBe("1");
  });

  it("does NOT render when userId is missing", () => {
    const { queryByTestId } = renderBanner({ userId: null });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });

  it("does NOT render when profile has not loaded", () => {
    const { queryByTestId } = renderBanner({ hasProfile: false });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });

  it("does NOT render when nobleScore has not loaded", () => {
    const { queryByTestId } = renderBanner({ hasScore: false });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });
});

// ─── Scenario 4: Fade-in, auto-dismiss, fade-out timer behaviour ─────────────

describe("WelcomeBanner — fade-in / auto-dismiss / fade-out timing", () => {
  it("starts hidden, then fades in after WELCOME_FADE_IN_MS", () => {
    const { getByTestId } = renderBanner({ firstName: "Alice" });

    // Immediately after mount the banner is rendered but data-visible is false.
    const banner = getByTestId("welcome-banner");
    expect(banner.getAttribute("data-visible")).toBe("false");
    expect(banner.className).toContain("opacity-0");

    // Advance past the fade-in tick.
    act(() => {
      vi.advanceTimersByTime(WELCOME_FADE_IN_MS);
    });

    const bannerAfterFade = getByTestId("welcome-banner");
    expect(bannerAfterFade.getAttribute("data-visible")).toBe("true");
    expect(bannerAfterFade.className).toContain("opacity-100");
  });

  it("auto-dismisses after WELCOME_DURATION_MS and removes the banner after fade-out", () => {
    const { getByTestId, queryByTestId } = renderBanner({ firstName: "Alice" });
    expect(getByTestId("welcome-banner")).toBeTruthy();

    // Trigger the auto-dismiss timer — fade starts.
    act(() => {
      vi.advanceTimersByTime(WELCOME_DURATION_MS);
    });
    // Banner is still in the DOM but invisible (fade-out in progress).
    const fading = getByTestId("welcome-banner");
    expect(fading.getAttribute("data-visible")).toBe("false");
    expect(fading.className).toContain("opacity-0");

    // Fully unmounts only after the fade-out animation completes.
    act(() => {
      vi.advanceTimersByTime(WELCOME_FADE_OUT_MS);
    });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });

  it("does NOT auto-dismiss before WELCOME_DURATION_MS elapses", () => {
    const { getByTestId } = renderBanner({ firstName: "Alice" });

    act(() => {
      vi.advanceTimersByTime(WELCOME_DURATION_MS - 100);
    });
    const banner = getByTestId("welcome-banner");
    // Banner is still mounted and (after fade-in) visible.
    expect(banner).toBeTruthy();
    expect(banner.getAttribute("data-visible")).toBe("true");
  });

  it("manual dismiss via the close button immediately starts fade-out and removes after WELCOME_FADE_OUT_MS", () => {
    const { getByLabelText, queryByTestId, getByTestId } = renderBanner({ firstName: "Alice" });

    // Let the fade-in happen first.
    act(() => {
      vi.advanceTimersByTime(WELCOME_FADE_IN_MS);
    });
    expect(getByTestId("welcome-banner").getAttribute("data-visible")).toBe("true");

    // Click the dismiss button → starts fade-out (data-visible flips to false).
    act(() => {
      fireEvent.click(getByLabelText(labels.dismissLabel));
    });
    expect(getByTestId("welcome-banner").getAttribute("data-visible")).toBe("false");

    // Banner is fully removed once the fade-out timer fires.
    act(() => {
      vi.advanceTimersByTime(WELCOME_FADE_OUT_MS);
    });
    expect(queryByTestId("welcome-banner")).toBeNull();
  });

  it("manual dismiss cancels the auto-dismiss timer (no double-dismiss)", () => {
    const { getByLabelText, queryByTestId } = renderBanner({ firstName: "Alice" });

    act(() => {
      vi.advanceTimersByTime(WELCOME_FADE_IN_MS);
      fireEvent.click(getByLabelText(labels.dismissLabel));
    });

    // Complete the fade-out.
    act(() => {
      vi.advanceTimersByTime(WELCOME_FADE_OUT_MS);
    });
    expect(queryByTestId("welcome-banner")).toBeNull();

    // Advance past the original auto-dismiss point — nothing should re-trigger.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(WELCOME_DURATION_MS);
      });
    }).not.toThrow();
    expect(queryByTestId("welcome-banner")).toBeNull();
  });
});
