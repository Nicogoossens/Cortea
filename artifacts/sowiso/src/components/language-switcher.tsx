import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("language.select")}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          aria-label={`${t("language.select")}: ${t(`language.${lang.code}`)}`}
          aria-pressed={language === lang.code}
          className={`px-2 py-1 text-xs font-mono uppercase tracking-widest rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
            language === lang.code
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
          }`}
        >
          {lang.code}
        </button>
      ))}
    </div>
  );
}
