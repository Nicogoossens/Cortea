import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type SupportedLanguage = "en" | "nl" | "fr";

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "GB" },
  { code: "nl", label: "Nederlands", flag: "NL" },
  { code: "fr", label: "Français",   flag: "FR" },
];

const STATIC_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    "app.name": "SOWISO",
    "app.tagline": "The art of conduct",
    "app.established": "Est. 2024",

    "nav.dashboard": "The Dashboard",
    "nav.atelier": "The Atelier",
    "nav.counsel": "The Counsel",
    "nav.compass": "The Compass",
    "nav.profile": "Profile",
    "nav.aria_label": "Main navigation",
    "nav.menu_open": "Open navigation menu",
    "nav.menu_close": "Close navigation menu",
    "nav.skip_to_content": "Skip to main content",

    "home.greeting": "Good day, distinguished guest.",
    "home.standing": "Your standing",
    "home.enter_atelier": "Enter The Atelier",
    "home.seek_counsel": "Seek Counsel",
    "home.cultural_compass": "Cultural Compass",
    "home.continue_studies": "Continue your studies",

    "atelier.title": "The Atelier",
    "atelier.subtitle": "Refine your instincts through practice. Select a scenario below to test your judgement in complex social and cultural situations.",
    "atelier.pillar": "Pillar",
    "atelier.difficulty": "Difficulty",
    "atelier.duration": "min",
    "atelier.empty": "No scenarios available.",
    "atelier.region": "Region",

    "counsel.title": "The Counsel",
    "counsel.subtitle": "Thirty seconds of discreet guidance. Describe your situation and receive an immediate, precise response.",
    "counsel.placeholder": "Describe the situation requiring counsel…",
    "counsel.request": "Request Counsel",
    "counsel.guidance": "The Mentor's Response",

    "compass.title": "The Cultural Compass",
    "compass.subtitle": "Navigate the customs of the world with precision and confidence.",
    "compass.explore": "Explore",
    "compass.core_value": "Core Value",
    "compass.taboo": "Biggest Taboo",
    "compass.back": "Back to Compass",
    "compass.dos": "Do",
    "compass.donts": "Avoid",
    "compass.dining_etiquette": "Dining Etiquette",
    "compass.language_notes": "Language Notes",
    "compass.gift_protocol": "Gift Protocol",
    "compass.dress_code": "Dress Code",

    "profile.title": "The Profile",
    "profile.noble_standing": "Noble Standing",
    "profile.domain_mastery": "Domain Mastery",
    "profile.domain_subtitle": "Your titles across the five pillars of refinement.",
    "profile.recent_log": "Recent Log",
    "profile.no_history": "Your ledger is currently empty.",
    "profile.visit_atelier": "Visit The Atelier to begin your studies.",
    "profile.ambition": "Ambition",
    "profile.active_region": "Active Region",
    "profile.member_since": "Member since",
    "profile.next_rank": "to next rank",
    "profile.current_title": "Current Title",
    "profile.next": "Next",

    "scenario.return_atelier": "Return to Atelier",
    "scenario.pillar": "Pillar",
    "scenario.confirm": "Confirm Decision",
    "scenario.submitting": "Submitting…",
    "scenario.mentor_counsel": "The Mentor's Counsel",
    "scenario.impact": "Impact",
    "scenario.promotion": "Promotion",
    "scenario.elevated_to": "Elevated to",
    "scenario.not_found": "Scenario Not Found",

    "common.loading": "Loading…",
    "common.error": "Something went amiss.",
    "common.not_found": "Page Not Found",
    "common.return_home": "Return Home",

    "language.en": "English",
    "language.nl": "Dutch",
    "language.fr": "French",
    "language.select": "Language",

    "level.the_aware": "The Aware",
    "level.the_composed": "The Composed",
    "level.the_refined": "The Refined",
    "level.the_distinguished": "The Distinguished",
    "level.the_sovereign": "The Sovereign",
  },
  nl: {
    "app.name": "SOWISO",
    "app.tagline": "De kunst van gedrag",
    "app.established": "Opgericht 2024",

    "nav.dashboard": "Het Dashboard",
    "nav.atelier": "Het Atelier",
    "nav.counsel": "De Raadgeving",
    "nav.compass": "Het Kompas",
    "nav.profile": "Profiel",
    "nav.aria_label": "Hoofdnavigatie",
    "nav.menu_open": "Navigatiemenu openen",
    "nav.menu_close": "Navigatiemenu sluiten",
    "nav.skip_to_content": "Naar hoofdinhoud",

    "home.greeting": "Goedendag, gewaardeerde gast.",
    "home.standing": "Uw standing",
    "home.enter_atelier": "Betreed Het Atelier",
    "home.seek_counsel": "Zoek Advies",
    "home.cultural_compass": "Cultureel Kompas",
    "home.continue_studies": "Zet uw studies voort",

    "atelier.title": "Het Atelier",
    "atelier.subtitle": "Verfijn uw instincten door oefening. Selecteer een scenario om uw oordeel te testen in complexe sociale en culturele situaties.",
    "atelier.pillar": "Zuil",
    "atelier.difficulty": "Moeilijkheid",
    "atelier.duration": "min",
    "atelier.empty": "Geen scenario's beschikbaar.",
    "atelier.region": "Regio",

    "counsel.title": "De Raadgeving",
    "counsel.subtitle": "Dertig seconden discrete begeleiding. Beschrijf uw situatie en ontvang een onmiddellijk, precies antwoord.",
    "counsel.placeholder": "Beschrijf de situatie die begeleiding vereist…",
    "counsel.request": "Vraag Advies",
    "counsel.guidance": "Het Antwoord van de Mentor",

    "compass.title": "Het Culturele Kompas",
    "compass.subtitle": "Navigeer de gebruiken van de wereld met precisie en vertrouwen.",
    "compass.explore": "Verkennen",
    "compass.core_value": "Kernwaarde",
    "compass.taboo": "Grootste Taboe",
    "compass.back": "Terug naar Kompas",
    "compass.dos": "Doen",
    "compass.donts": "Vermijden",
    "compass.dining_etiquette": "Tafelmanieren",
    "compass.language_notes": "Taalnotities",
    "compass.gift_protocol": "Cadeauprotocol",
    "compass.dress_code": "Kledingcode",

    "profile.title": "Het Profiel",
    "profile.noble_standing": "Edele Standing",
    "profile.domain_mastery": "Domeinbeheersing",
    "profile.domain_subtitle": "Uw titels over de vijf zuilen van verfijning.",
    "profile.recent_log": "Recente Log",
    "profile.no_history": "Uw register is momenteel leeg.",
    "profile.visit_atelier": "Bezoek Het Atelier om uw studies te beginnen.",
    "profile.ambition": "Ambitie",
    "profile.active_region": "Actieve Regio",
    "profile.member_since": "Lid sinds",
    "profile.next_rank": "naar volgend rang",
    "profile.current_title": "Huidige Titel",
    "profile.next": "Volgende",

    "scenario.return_atelier": "Terug naar Atelier",
    "scenario.pillar": "Zuil",
    "scenario.confirm": "Bevestig Beslissing",
    "scenario.submitting": "Indienen…",
    "scenario.mentor_counsel": "De Raad van de Mentor",
    "scenario.impact": "Impact",
    "scenario.promotion": "Promotie",
    "scenario.elevated_to": "Verheven tot",
    "scenario.not_found": "Scenario Niet Gevonden",

    "common.loading": "Laden…",
    "common.error": "Er is iets misgegaan.",
    "common.not_found": "Pagina Niet Gevonden",
    "common.return_home": "Terug naar Start",

    "language.en": "Engels",
    "language.nl": "Nederlands",
    "language.fr": "Frans",
    "language.select": "Taal",

    "level.the_aware": "De Bewuste",
    "level.the_composed": "De Beheerste",
    "level.the_refined": "De Verfijnde",
    "level.the_distinguished": "De Onderscheiden",
    "level.the_sovereign": "De Soevereine",
  },
  fr: {
    "app.name": "SOWISO",
    "app.tagline": "L'art de la conduite",
    "app.established": "Fondé en 2024",

    "nav.dashboard": "Le Tableau de Bord",
    "nav.atelier": "L'Atelier",
    "nav.counsel": "Le Conseil",
    "nav.compass": "La Boussole",
    "nav.profile": "Profil",
    "nav.aria_label": "Navigation principale",
    "nav.menu_open": "Ouvrir le menu de navigation",
    "nav.menu_close": "Fermer le menu de navigation",
    "nav.skip_to_content": "Aller au contenu principal",

    "home.greeting": "Bonjour, distingué invité.",
    "home.standing": "Votre niveau",
    "home.enter_atelier": "Entrer dans L'Atelier",
    "home.seek_counsel": "Chercher Conseil",
    "home.cultural_compass": "Boussole Culturelle",
    "home.continue_studies": "Continuer vos études",

    "atelier.title": "L'Atelier",
    "atelier.subtitle": "Affinez vos instincts par la pratique. Sélectionnez un scénario pour tester votre jugement dans des situations sociales et culturelles complexes.",
    "atelier.pillar": "Pilier",
    "atelier.difficulty": "Difficulté",
    "atelier.duration": "min",
    "atelier.empty": "Aucun scénario disponible.",
    "atelier.region": "Région",

    "counsel.title": "Le Conseil",
    "counsel.subtitle": "Trente secondes de guidance discrète. Décrivez votre situation et recevez une réponse immédiate et précise.",
    "counsel.placeholder": "Décrivez la situation nécessitant un conseil…",
    "counsel.request": "Demander Conseil",
    "counsel.guidance": "La Réponse du Mentor",

    "compass.title": "La Boussole Culturelle",
    "compass.subtitle": "Naviguez les coutumes du monde avec précision et confiance.",
    "compass.explore": "Explorer",
    "compass.core_value": "Valeur Fondamentale",
    "compass.taboo": "Grand Tabou",
    "compass.back": "Retour à la Boussole",
    "compass.dos": "À faire",
    "compass.donts": "À éviter",
    "compass.dining_etiquette": "Étiquette à table",
    "compass.language_notes": "Notes de langue",
    "compass.gift_protocol": "Protocole de cadeau",
    "compass.dress_code": "Code vestimentaire",

    "profile.title": "Le Profil",
    "profile.noble_standing": "Noblesse de Rang",
    "profile.domain_mastery": "Maîtrise des Domaines",
    "profile.domain_subtitle": "Vos titres dans les cinq piliers du raffinement.",
    "profile.recent_log": "Historique Récent",
    "profile.no_history": "Votre registre est actuellement vide.",
    "profile.visit_atelier": "Visitez L'Atelier pour commencer vos études.",
    "profile.ambition": "Ambition",
    "profile.active_region": "Région Active",
    "profile.member_since": "Membre depuis",
    "profile.next_rank": "vers le prochain rang",
    "profile.current_title": "Titre Actuel",
    "profile.next": "Suivant",

    "scenario.return_atelier": "Retour à l'Atelier",
    "scenario.pillar": "Pilier",
    "scenario.confirm": "Confirmer la Décision",
    "scenario.submitting": "Envoi en cours…",
    "scenario.mentor_counsel": "Le Conseil du Mentor",
    "scenario.impact": "Impact",
    "scenario.promotion": "Promotion",
    "scenario.elevated_to": "Élevé au rang de",
    "scenario.not_found": "Scénario Introuvable",

    "common.loading": "Chargement…",
    "common.error": "Une erreur s'est produite.",
    "common.not_found": "Page Introuvable",
    "common.return_home": "Retour à l'Accueil",

    "language.en": "Anglais",
    "language.nl": "Néerlandais",
    "language.fr": "Français",
    "language.select": "Langue",

    "level.the_aware": "L'Éveillé",
    "level.the_composed": "Le Serein",
    "level.the_refined": "Le Raffiné",
    "level.the_distinguished": "Le Distingué",
    "level.the_sovereign": "Le Souverain",
  },
};

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "sowiso_language";

function detectLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
  if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) return stored;

  const browser = navigator.language.split("-")[0] as SupportedLanguage;
  if (SUPPORTED_LANGUAGES.some(l => l.code === browser)) return browser;

  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(detectLanguage);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, fallback?: string): string => {
    return (
      STATIC_TRANSLATIONS[language]?.[key] ??
      STATIC_TRANSLATIONS.en?.[key] ??
      fallback ??
      key
    );
  }, [language]);

  const dir: "ltr" | "rtl" = "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
