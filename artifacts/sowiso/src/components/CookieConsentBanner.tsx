import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "cortea_cookie_consent";

export default function CookieConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // Auto-dismiss in automated / e2e browser contexts (Playwright, Selenium, etc.)
      if (navigator.webdriver) return;
      // Suppress via URL query param (?test_mode=1) for manual QA testers
      if (new URLSearchParams(window.location.search).get("test_mode") === "1") return;
      // Suppress via localStorage flag (cortea_test_mode=1) for bookmarked QA sessions
      if (localStorage.getItem("cortea_test_mode") === "1") return;
      if (!localStorage.getItem(CONSENT_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function acknowledge() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("cookie.banner_label", "Cookie notice")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-sm shadow-lg animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="flex-1 text-xs text-muted-foreground font-light leading-relaxed">
          {t(
            "cookie.banner_text",
            "Cortéa uses session cookies and local storage for authentication and preferences only — no tracking or advertising. By continuing you acknowledge this.",
          )}{" "}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("cookie.privacy_link", "Privacy Policy")}
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={acknowledge}
            className="font-mono text-xs rounded-sm"
          >
            {t("cookie.acknowledge", "Understood")}
          </Button>
          <button
            onClick={acknowledge}
            aria-label={t("cookie.close", "Close")}
            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
