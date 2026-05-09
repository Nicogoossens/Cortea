import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, type SupportedLocale } from "@/lib/i18n";
import { LOCALE_GROUPS, getLocaleDefinition } from "@/lib/i18n-locales";
import { FlagEmoji } from "@/lib/active-region";
import { useGetProfile } from "@workspace/api-client-react";
import { useRegistrationStatus } from "@/hooks/useRegistrationStatus";

// Optimised for the light landing-page header background — saturated text on
// soft tinted backgrounds with a visible border.
const TIER_BADGE_CLASSES: Record<string, string> = {
  guest:      "bg-stone-500/15 text-stone-700 border-stone-500/40",
  basic:      "bg-sky-500/15 text-sky-800 border-sky-500/50",
  student:    "bg-emerald-500/15 text-emerald-800 border-emerald-500/50",
  traveller:  "bg-amber-500/20 text-amber-900 border-amber-600/60",
  ambassador: "bg-yellow-400/30 text-yellow-900 border-yellow-600/70",
  elite:      "bg-fuchsia-500/20 text-fuchsia-900 border-fuchsia-600/60",
};

function LandingTierBadge() {
  const { data: profile } = useGetProfile();
  const tier = (profile?.subscription_tier ?? "guest") as string;
  const cls = TIER_BADGE_CLASSES[tier] ?? TIER_BADGE_CLASSES.guest;
  const label = tier.toUpperCase();
  return (
    <span
      data-testid="badge-current-tier-landing"
      aria-label={`Tier: ${label}`}
      title={`Tier: ${label}`}
      className={`inline-flex items-center text-[9px] font-mono uppercase tracking-widest rounded-[2px] border px-1.5 py-0.5 leading-none ${cls}`}
    >
      {label}
    </span>
  );
}

function LandingLanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = getLocaleDefinition(locale);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("locale.select")}: ${current.languageLabel}`}
        className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-foreground/70 hover:text-foreground hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Globe className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
        <FlagEmoji code={current.flag} size="sm" ariaLabel={current.regionLabel} />
        <span className="font-mono tracking-wide text-xs">{current.languageLabel}</span>
        <ChevronDown
          className={`w-3 h-3 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("locale.choose_region")}
          className="absolute top-full right-0 mt-1 z-50 bg-background border border-border rounded-sm shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ minWidth: "200px", maxHeight: "320px", overflowY: "auto" }}
        >
          <div className="px-3 py-2 border-b border-border/40 sticky top-0 bg-background">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {t("locale.choose_region")}
            </span>
          </div>
          <div className="py-1">
            {LOCALE_GROUPS.map((group) => {
              const representative = group.locales[0];
              const isSelected = group.locales.some((l) => l.locale === locale);
              return (
                <button
                  key={group.groupLabel}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setLocale(representative.locale as SupportedLocale);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <FlagEmoji code={representative.flag} size="sm" ariaLabel={representative.regionLabel} />
                  <span className="flex-1">{group.groupLabel}</span>
                  {isSelected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type AuthLink = "signin" | "register" | null;

const AUTH_PATHS = new Set(["/signin", "/register", "/reset-password"]);

export function LandingLayout({
  children,
  authLink = "signin",
}: {
  children: React.ReactNode;
  authLink?: AuthLink;
}) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const isAuthPage = AUTH_PATHS.has(location);
  const { registration_open: registrationOpen } = useRegistrationStatus();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm focus:font-medium"
      >
        {t("nav.skip_to_content")}
      </a>

      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/30">
        <Link href="/">
          <div className="flex flex-col items-start gap-1.5 cursor-pointer">
            <span className="font-serif text-2xl md:text-3xl tracking-widest text-foreground uppercase">
              {t("app.name")}
            </span>
            <LandingTierBadge />
          </div>
        </Link>

        {!isAuthPage && (
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {(["nav.atelier", "nav.counsel", "nav.compass"] as const).map((key, i) => {
              const paths = ["/atelier", "/counsel", "/compass"];
              return (
                <Link key={key} href={paths[i]}>
                  <span className="text-xs font-mono tracking-wide text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
                    {t(key)}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <LandingLanguageSwitcher />
          {authLink !== null && (
            <>
              <div className="w-px h-4 bg-border/60 hidden sm:block" aria-hidden="true" />
              {/* In closed-beta mode we never expose /register here; force the
                  link to /signin so visitors see the open sign-in path and the
                  Founding-100 waitlist as the only public route to an account. */}
              <Link href={authLink === "register" && registrationOpen ? "/register" : "/signin"}>
                <span className="text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
                  {authLink === "register" && registrationOpen
                    ? t("register.title")
                    : t("landing.signin_link")}
                </span>
              </Link>
            </>
          )}
        </div>
      </header>

      <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
        {children}
      </main>

      <footer className="px-6 md:px-12 py-4 border-t border-border/20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
            {t("app.established")}
          </p>
          <span className="hidden sm:inline text-muted-foreground/20 text-[10px]">·</span>
          <Link href="/privacy-policy">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-pointer">
              {t("legal.privacy_policy")}
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
