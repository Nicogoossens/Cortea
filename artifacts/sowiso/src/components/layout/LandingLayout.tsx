import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, LOCALE_GROUPS, getLocaleDefinition, type SupportedLocale } from "@/lib/i18n";

function FlagEmoji({ countryCode }: { countryCode: string }) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e0 + c.charCodeAt(0) - 65);
  return <span aria-hidden="true">{String.fromCodePoint(...codePoints)}</span>;
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
        <FlagEmoji countryCode={current.flag} />
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
                  <FlagEmoji countryCode={representative.flag} />
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

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-border/30">
        <Link href="/">
          <span className="font-serif text-2xl md:text-3xl tracking-widest text-foreground uppercase cursor-pointer">
            {t("app.name")}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {(["nav.atelier", "nav.compass", "nav.counsel", "nav.mirror"] as const).map((key, i) => {
            const paths = ["/atelier", "/compass", "/counsel", "/mirror"];
            return (
              <Link key={key} href={paths[i]}>
                <span className="text-xs font-mono tracking-wide text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
                  {t(key)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <LandingLanguageSwitcher />
          <div className="w-px h-4 bg-border/60" aria-hidden="true" />
          <Link href="/signin">
            <span className="text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              {t("landing.signin_link")}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="px-6 md:px-12 py-4 border-t border-border/20">
        <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
          {t("app.established")}
        </p>
      </footer>
    </div>
  );
}
