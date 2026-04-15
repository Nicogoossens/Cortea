import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

// Bundled (local) translations imported statically for instant availability
import en from "./locales/en/translation.json";
import nl from "./locales/nl/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";
import es from "./locales/es/translation.json";
import pt from "./locales/pt/translation.json";
import it from "./locales/it/translation.json";
import ar from "./locales/ar/translation.json";
import ja from "./locales/ja/translation.json";

// API base for the translations endpoint (Vite-resolved at build time)
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // Bundled resources for all 9 locales (available immediately, no HTTP fetch)
    resources: {
      en: { translation: en },
      nl: { translation: nl },
      fr: { translation: fr },
      de: { translation: de },
      es: { translation: es },
      pt: { translation: pt },
      it: { translation: it },
      ar: { translation: ar },
      ja: { translation: ja },
    },
    // All languages are bundled; backend acts as a live override/update channel
    partialBundledLanguages: true,

    // Backend: loads from our PostgreSQL-backed translations API
    // This serves as the runtime source (DB can override bundled values)
    backend: {
      loadPath: `${API_BASE}/api/translations?language_code={{lng}}`,
      parse: (data: string) => {
        try {
          return JSON.parse(data);
        } catch {
          return {};
        }
      },
    },

    // Defaults
    lng: "en",
    fallbackLng: "en",
    defaultNS: "translation",
    ns: ["translation"],

    // Do not escape — React already handles XSS
    interpolation: { escapeValue: false },

    // Don't block on async backend load — bundled langs are available immediately
    initAsync: false,

    // react-i18next options
    react: {
      useSuspense: false,
    },
  });

export default i18next;
