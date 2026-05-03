import { useEffect } from "react";

const TEST_MODE_KEY = "cortea_test_mode";

/**
 * Hidden QA helper — listens for Ctrl+Shift+, (⌘+Shift+, on Mac) and
 * toggles the cortea_test_mode localStorage flag, then reloads the page.
 *
 * Ctrl+Shift+T was deliberately avoided because browsers reserve it for
 * "reopen closed tab" and intercept it before JavaScript can act.
 *
 * When active, the cookie-consent banner is suppressed for the duration
 * of the session (see CookieConsentBanner.tsx).
 *
 * This component renders nothing and is always mounted regardless of
 * authentication state.
 */
export default function TestModeToggle() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ",") {
        e.preventDefault();
        try {
          const current = localStorage.getItem(TEST_MODE_KEY);
          if (current === "1") {
            localStorage.removeItem(TEST_MODE_KEY);
          } else {
            localStorage.setItem(TEST_MODE_KEY, "1");
          }
          window.location.reload();
        } catch {
          // localStorage unavailable — no-op
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
