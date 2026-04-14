import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type SupportedLocale =
  | "en-GB" | "en-US" | "en-AU" | "en-CA"
  | "nl-NL"
  | "fr-FR"
  | "de-DE"
  | "es-ES" | "es-MX"
  | "pt-PT" | "pt-BR"
  | "it-IT"
  | "hi-IN";

export type SupportedLanguage = "en" | "nl" | "fr" | "de" | "es" | "pt" | "it" | "hi";

export interface LocaleDefinition {
  locale: SupportedLocale;
  languageLabel: string;
  regionLabel: string;
  flag: string;
  baseLang: SupportedLanguage;
}

export const LOCALE_GROUPS: { groupLabel: string; locales: LocaleDefinition[] }[] = [
  {
    groupLabel: "English",
    locales: [
      { locale: "en-GB", languageLabel: "English", regionLabel: "United Kingdom", flag: "GB", baseLang: "en" },
      { locale: "en-US", languageLabel: "English", regionLabel: "United States", flag: "US", baseLang: "en" },
      { locale: "en-AU", languageLabel: "English", regionLabel: "Australia", flag: "AU", baseLang: "en" },
      { locale: "en-CA", languageLabel: "English", regionLabel: "Canada", flag: "CA", baseLang: "en" },
    ],
  },
  {
    groupLabel: "Nederlands",
    locales: [
      { locale: "nl-NL", languageLabel: "Nederlands", regionLabel: "Nederland", flag: "NL", baseLang: "nl" },
    ],
  },
  {
    groupLabel: "Français",
    locales: [
      { locale: "fr-FR", languageLabel: "Français", regionLabel: "France", flag: "FR", baseLang: "fr" },
    ],
  },
  {
    groupLabel: "Deutsch",
    locales: [
      { locale: "de-DE", languageLabel: "Deutsch", regionLabel: "Deutschland", flag: "DE", baseLang: "de" },
    ],
  },
  {
    groupLabel: "Español",
    locales: [
      { locale: "es-ES", languageLabel: "Español", regionLabel: "España", flag: "ES", baseLang: "es" },
      { locale: "es-MX", languageLabel: "Español", regionLabel: "México", flag: "MX", baseLang: "es" },
    ],
  },
  {
    groupLabel: "Português",
    locales: [
      { locale: "pt-PT", languageLabel: "Português", regionLabel: "Portugal", flag: "PT", baseLang: "pt" },
      { locale: "pt-BR", languageLabel: "Português", regionLabel: "Brasil", flag: "BR", baseLang: "pt" },
    ],
  },
  {
    groupLabel: "Italiano",
    locales: [
      { locale: "it-IT", languageLabel: "Italiano", regionLabel: "Italia", flag: "IT", baseLang: "it" },
    ],
  },
  {
    groupLabel: "हिन्दी",
    locales: [
      { locale: "hi-IN", languageLabel: "हिन्दी", regionLabel: "भारत", flag: "IN", baseLang: "hi" },
    ],
  },
];

export function getLocaleDefinition(locale: SupportedLocale): LocaleDefinition {
  for (const group of LOCALE_GROUPS) {
    const found = group.locales.find((l) => l.locale === locale);
    if (found) return found;
  }
  return LOCALE_GROUPS[0].locales[0];
}

function localeToBaseLang(locale: SupportedLocale): SupportedLanguage {
  return locale.split("-")[0] as SupportedLanguage;
}

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
    "atelier.refines": "Refines standing",
    "atelier.empty": "No scenarios available.",
    "atelier.region": "Region",

    "counsel.title": "The Counsel",
    "counsel.subtitle": "Thirty seconds of discreet guidance. Describe your situation and receive an immediate, precise response.",
    "counsel.placeholder": "Describe the situation requiring counsel…",
    "counsel.request": "Request Counsel",
    "counsel.guidance": "The Mentor's Response",
    "counsel.select_domain": "Select Domain",
    "counsel.consulting": "Consulting…",
    "counsel.domains.dining": "Dining",
    "counsel.domains.introductions": "Introductions",
    "counsel.domains.dress_code": "Dress Code",
    "counsel.domains.gifting": "Gifting",
    "counsel.domains.digital_protocol": "Digital Protocol",
    "counsel.domains.hosting": "Hosting",
    "counsel.domains.apologies": "Apologies",
    "counsel.region_context": "Etiquette region",
    "counsel.region_prompt": "You are seeking counsel for etiquette in",
    "counsel.change_region": "change",
    "counsel.region_hint": "Change via the region selector top right",

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
    "compass.protocols": "Essential Protocols",

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
    "profile.log.refined": "Refined",
    "profile.log.reconsidered": "Reconsidered",
    "profile.log.observed": "Observed",
    "profile.member_since.recently": "Recently",

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

    "locale.select": "Language",
    "locale.choose_region": "Choose your language",
    "locale.current": "Current language",

    "region.select": "Operating in",
    "region.choose": "Select your etiquette region",
    "region.in_preparation": "In Preparation",
    "counsel.region_unavailable": "This region is presently being curated. Counsel is available for the United Kingdom, the United States, and the UAE.",
    "region.current": "Current region",

    "level.the_aware": "The Aware",
    "level.the_composed": "The Composed",
    "level.the_refined": "The Refined",
    "level.the_distinguished": "The Distinguished",
    "level.the_sovereign": "The Sovereign",
    "pillar.1.name": "The World Within",
    "pillar.2.name": "The Presence",
    "pillar.3.name": "The Voice",
    "pillar.4.name": "The Table",
    "pillar.5.name": "The Cellar",
    "trigger.correct_choice": "Correct choice",
    "trigger.incorrect_choice": "Incorrect choice",
    "trigger.time_bonus": "Time bonus",
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
    "atelier.pillar": "Pijler",
    "atelier.difficulty": "Moeilijkheid",
    "atelier.duration": "min",
    "atelier.refines": "Verfijnt de rang",
    "atelier.empty": "Geen scenario's beschikbaar.",
    "atelier.region": "Regio",

    "counsel.title": "De Raadgeving",
    "counsel.subtitle": "Dertig seconden discrete begeleiding. Beschrijf uw situatie en ontvang een onmiddellijk, precies antwoord.",
    "counsel.placeholder": "Beschrijf de situatie die begeleiding vereist…",
    "counsel.request": "Vraag Advies",
    "counsel.guidance": "Het Antwoord van de Mentor",
    "counsel.select_domain": "Kies een domein",
    "counsel.consulting": "Consulteren…",
    "counsel.domains.dining": "Tafelmanieren",
    "counsel.domains.introductions": "Introducties",
    "counsel.domains.dress_code": "Kledingcode",
    "counsel.domains.gifting": "Cadeaugeven",
    "counsel.domains.digital_protocol": "Digitaal Protocol",
    "counsel.domains.hosting": "Gastheerschap",
    "counsel.domains.apologies": "Excuses",
    "counsel.region_context": "Etiquetteregio",
    "counsel.region_prompt": "U vraagt advies over etiquette in",
    "counsel.change_region": "wijzigen",
    "counsel.region_hint": "Wijzigen via de regioselector rechtsboven",

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
    "compass.protocols": "Essentiële Protocollen",

    "profile.title": "Het Profiel",
    "profile.noble_standing": "Edele Standing",
    "profile.domain_mastery": "Domeinbeheersing",
    "profile.domain_subtitle": "Uw titels over de vijf pijlers van verfijning.",
    "profile.recent_log": "Recente Log",
    "profile.no_history": "Uw register is momenteel leeg.",
    "profile.visit_atelier": "Bezoek Het Atelier om uw studies te beginnen.",
    "profile.ambition": "Ambitie",
    "profile.active_region": "Actieve Regio",
    "profile.member_since": "Lid sinds",
    "profile.next_rank": "naar volgend rang",
    "profile.current_title": "Huidige Titel",
    "profile.next": "Volgende",
    "profile.log.refined": "Verfijnd",
    "profile.log.reconsidered": "Herzien",
    "profile.log.observed": "Geobserveerd",
    "profile.member_since.recently": "Onlangs",

    "scenario.return_atelier": "Terug naar Atelier",
    "scenario.pillar": "Pijler",
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

    "locale.select": "Taal",
    "locale.choose_region": "Kies uw taal",
    "locale.current": "Huidige taal",

    "region.select": "Actieve regio",
    "region.choose": "Kies uw etiquetteregio",
    "region.in_preparation": "In Opmaak",
    "counsel.region_unavailable": "Deze regio wordt momenteel samengesteld. Raadpleging is beschikbaar voor het Verenigd Koninkrijk, de Verenigde Staten en de VAE.",
    "region.current": "Huidige regio",

    "level.the_aware": "De Bewuste",
    "level.the_composed": "De Beheerste",
    "level.the_refined": "De Verfijnde",
    "level.the_distinguished": "De Onderscheiden",
    "level.the_sovereign": "De Soevereine",
    "pillar.1.name": "De Innerlijke Wereld",
    "pillar.2.name": "De Aanwezigheid",
    "pillar.3.name": "De Stem",
    "pillar.4.name": "De Tafel",
    "pillar.5.name": "De Kelder",
    "trigger.correct_choice": "Correcte keuze",
    "trigger.incorrect_choice": "Onjuiste keuze",
    "trigger.time_bonus": "Tijdbonus",
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
    "atelier.refines": "Affine le rang",
    "atelier.empty": "Aucun scénario disponible.",
    "atelier.region": "Région",

    "counsel.title": "Le Conseil",
    "counsel.subtitle": "Trente secondes de guidance discrète. Décrivez votre situation et recevez une réponse immédiate et précise.",
    "counsel.placeholder": "Décrivez la situation nécessitant un conseil…",
    "counsel.request": "Demander Conseil",
    "counsel.guidance": "La Réponse du Mentor",
    "counsel.select_domain": "Choisir un domaine",
    "counsel.consulting": "Consultation…",
    "counsel.domains.dining": "Repas",
    "counsel.domains.introductions": "Présentations",
    "counsel.domains.dress_code": "Code vestimentaire",
    "counsel.domains.gifting": "Cadeaux",
    "counsel.domains.digital_protocol": "Protocole numérique",
    "counsel.domains.hosting": "Hospitalité",
    "counsel.domains.apologies": "Excuses",
    "counsel.region_context": "Région d'étiquette",
    "counsel.region_prompt": "Vous demandez conseil sur l'étiquette en",
    "counsel.change_region": "modifier",
    "counsel.region_hint": "Modifier via le sélecteur de région en haut à droite",

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
    "compass.protocols": "Protocoles Essentiels",

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
    "profile.log.refined": "Raffiné",
    "profile.log.reconsidered": "Reconsidéré",
    "profile.log.observed": "Observé",
    "profile.member_since.recently": "Récemment",

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

    "locale.select": "Langue",
    "locale.choose_region": "Choisissez votre langue",
    "locale.current": "Langue actuelle",

    "region.select": "Région active",
    "region.choose": "Choisissez votre région d'étiquette",
    "region.in_preparation": "En Préparation",
    "counsel.region_unavailable": "Cette région est actuellement en cours de préparation. Le conseil est disponible pour le Royaume-Uni, les États-Unis et les Émirats Arabes Unis.",
    "region.current": "Région actuelle",

    "level.the_aware": "L'Éveillé",
    "level.the_composed": "Le Serein",
    "level.the_refined": "Le Raffiné",
    "level.the_distinguished": "Le Distingué",
    "level.the_sovereign": "Le Souverain",
    "pillar.1.name": "Le Monde Intérieur",
    "pillar.2.name": "La Présence",
    "pillar.3.name": "La Voix",
    "pillar.4.name": "La Table",
    "pillar.5.name": "La Cave",
    "trigger.correct_choice": "Choix correct",
    "trigger.incorrect_choice": "Choix incorrect",
    "trigger.time_bonus": "Bonus de temps",
  },

  de: {
    "app.name": "SOWISO",
    "app.tagline": "Die Kunst des Benehmens",
    "app.established": "Gegründet 2024",

    "nav.dashboard": "Das Dashboard",
    "nav.atelier": "Das Atelier",
    "nav.counsel": "Der Rat",
    "nav.compass": "Der Kompass",
    "nav.profile": "Profil",
    "nav.aria_label": "Hauptnavigation",
    "nav.menu_open": "Navigationsmenü öffnen",
    "nav.menu_close": "Navigationsmenü schließen",
    "nav.skip_to_content": "Zum Hauptinhalt springen",

    "home.greeting": "Guten Tag, verehrter Gast.",
    "home.standing": "Ihr Ansehen",
    "home.enter_atelier": "Das Atelier betreten",
    "home.seek_counsel": "Rat suchen",
    "home.cultural_compass": "Kulturkompass",
    "home.continue_studies": "Ihre Studien fortsetzen",

    "atelier.title": "Das Atelier",
    "atelier.subtitle": "Verfeinern Sie Ihre Instinkte durch Übung. Wählen Sie ein Szenario, um Ihr Urteil in komplexen sozialen und kulturellen Situationen zu testen.",
    "atelier.pillar": "Säule",
    "atelier.difficulty": "Schwierigkeit",
    "atelier.duration": "Min.",
    "atelier.refines": "Verfeinert den Rang",
    "atelier.empty": "Keine Szenarien verfügbar.",
    "atelier.region": "Region",

    "counsel.title": "Der Rat",
    "counsel.subtitle": "Dreißig Sekunden diskrete Anleitung. Beschreiben Sie Ihre Situation und erhalten Sie eine sofortige, präzise Antwort.",
    "counsel.placeholder": "Beschreiben Sie die Situation, für die Sie Rat benötigen…",
    "counsel.request": "Rat einholen",
    "counsel.guidance": "Die Antwort des Mentors",
    "counsel.select_domain": "Bereich wählen",
    "counsel.consulting": "Wird konsultiert…",
    "counsel.domains.dining": "Speisen",
    "counsel.domains.introductions": "Vorstellungen",
    "counsel.domains.dress_code": "Dresscode",
    "counsel.domains.gifting": "Schenken",
    "counsel.domains.digital_protocol": "Digitales Protokoll",
    "counsel.domains.hosting": "Gastfreundschaft",
    "counsel.domains.apologies": "Entschuldigungen",
    "counsel.region_context": "Etikette-Region",
    "counsel.region_prompt": "Sie suchen Rat zur Etikette in",
    "counsel.change_region": "ändern",
    "counsel.region_hint": "Ändern über den Regionsauswähler oben rechts",

    "compass.title": "Der Kulturkompass",
    "compass.subtitle": "Navigieren Sie die Sitten der Welt mit Präzision und Zuversicht.",
    "compass.explore": "Erkunden",
    "compass.core_value": "Kernwert",
    "compass.taboo": "Größtes Tabu",
    "compass.back": "Zurück zum Kompass",
    "compass.dos": "Empfehlenswert",
    "compass.donts": "Zu vermeiden",
    "compass.dining_etiquette": "Tischsitten",
    "compass.language_notes": "Sprachhinweise",
    "compass.gift_protocol": "Schenkprotokoll",
    "compass.dress_code": "Dresscode",
    "compass.protocols": "Wesentliche Protokolle",

    "profile.title": "Das Profil",
    "profile.noble_standing": "Nobles Ansehen",
    "profile.domain_mastery": "Domänenbeherrschung",
    "profile.domain_subtitle": "Ihre Titel über die fünf Säulen der Verfeinerung.",
    "profile.recent_log": "Aktuelles Protokoll",
    "profile.no_history": "Ihr Register ist derzeit leer.",
    "profile.visit_atelier": "Besuchen Sie das Atelier, um Ihre Studien zu beginnen.",
    "profile.ambition": "Ehrgeiz",
    "profile.active_region": "Aktive Region",
    "profile.member_since": "Mitglied seit",
    "profile.next_rank": "bis zum nächsten Rang",
    "profile.current_title": "Aktueller Titel",
    "profile.next": "Weiter",
    "profile.log.refined": "Verfeinert",
    "profile.log.reconsidered": "Überdacht",
    "profile.log.observed": "Beobachtet",
    "profile.member_since.recently": "Kürzlich",

    "scenario.return_atelier": "Zurück zum Atelier",
    "scenario.pillar": "Säule",
    "scenario.confirm": "Entscheidung bestätigen",
    "scenario.submitting": "Wird übermittelt…",
    "scenario.mentor_counsel": "Der Rat des Mentors",
    "scenario.impact": "Einfluss",
    "scenario.promotion": "Aufstieg",
    "scenario.elevated_to": "Erhoben zu",
    "scenario.not_found": "Szenario nicht gefunden",

    "common.loading": "Wird geladen…",
    "common.error": "Etwas ist schiefgelaufen.",
    "common.not_found": "Seite nicht gefunden",
    "common.return_home": "Zur Startseite",

    "locale.select": "Sprache",
    "locale.choose_region": "Wählen Sie Ihre Sprache",
    "locale.current": "Aktuelle Sprache",

    "region.select": "Aktive Region",
    "region.choose": "Wählen Sie Ihre Etikette-Region",
    "region.in_preparation": "In Vorbereitung",
    "counsel.region_unavailable": "Diese Region wird derzeit zusammengestellt. Beratung ist für das Vereinigte Königreich, die Vereinigten Staaten und die VAE verfügbar.",
    "region.current": "Aktuelle Region",

    "level.the_aware": "Der Bewusste",
    "level.the_composed": "Der Gefasste",
    "level.the_refined": "Der Verfeinerte",
    "level.the_distinguished": "Der Ausgezeichnete",
    "level.the_sovereign": "Der Souveräne",
    "pillar.1.name": "Die Innere Welt",
    "pillar.2.name": "Die Erscheinung",
    "pillar.3.name": "Die Stimme",
    "pillar.4.name": "Der Tisch",
    "pillar.5.name": "Der Keller",
    "trigger.correct_choice": "Richtige Wahl",
    "trigger.incorrect_choice": "Falsche Wahl",
    "trigger.time_bonus": "Zeitbonus",
  },

  es: {
    "app.name": "SOWISO",
    "app.tagline": "El arte del comportamiento",
    "app.established": "Fundado en 2024",

    "nav.dashboard": "El Panel",
    "nav.atelier": "El Atelier",
    "nav.counsel": "El Consejo",
    "nav.compass": "La Brújula",
    "nav.profile": "Perfil",
    "nav.aria_label": "Navegación principal",
    "nav.menu_open": "Abrir menú de navegación",
    "nav.menu_close": "Cerrar menú de navegación",
    "nav.skip_to_content": "Ir al contenido principal",

    "home.greeting": "Buenos días, distinguido invitado.",
    "home.standing": "Su posición",
    "home.enter_atelier": "Entrar al Atelier",
    "home.seek_counsel": "Buscar Consejo",
    "home.cultural_compass": "Brújula Cultural",
    "home.continue_studies": "Continuar sus estudios",

    "atelier.title": "El Atelier",
    "atelier.subtitle": "Refine sus instintos a través de la práctica. Seleccione un escenario para poner a prueba su criterio en situaciones sociales y culturales complejas.",
    "atelier.pillar": "Pilar",
    "atelier.difficulty": "Dificultad",
    "atelier.duration": "min",
    "atelier.refines": "Refina el rango",
    "atelier.empty": "No hay escenarios disponibles.",
    "atelier.region": "Región",

    "counsel.title": "El Consejo",
    "counsel.subtitle": "Treinta segundos de orientación discreta. Describa su situación y reciba una respuesta inmediata y precisa.",
    "counsel.placeholder": "Describa la situación que requiere orientación…",
    "counsel.request": "Solicitar Consejo",
    "counsel.guidance": "La Respuesta del Mentor",
    "counsel.select_domain": "Seleccionar dominio",
    "counsel.consulting": "Consultando…",
    "counsel.domains.dining": "Comidas",
    "counsel.domains.introductions": "Presentaciones",
    "counsel.domains.dress_code": "Código de vestimenta",
    "counsel.domains.gifting": "Regalos",
    "counsel.domains.digital_protocol": "Protocolo digital",
    "counsel.domains.hosting": "Hospitalidad",
    "counsel.domains.apologies": "Disculpas",
    "counsel.region_context": "Región de etiqueta",
    "counsel.region_prompt": "Busca consejo sobre etiqueta en",
    "counsel.change_region": "cambiar",
    "counsel.region_hint": "Cambiar con el selector de región arriba a la derecha",

    "compass.title": "La Brújula Cultural",
    "compass.subtitle": "Navegue las costumbres del mundo con precisión y confianza.",
    "compass.explore": "Explorar",
    "compass.core_value": "Valor Central",
    "compass.taboo": "Mayor Tabú",
    "compass.back": "Volver a la Brújula",
    "compass.dos": "Hacer",
    "compass.donts": "Evitar",
    "compass.dining_etiquette": "Etiqueta en la mesa",
    "compass.language_notes": "Notas de idioma",
    "compass.gift_protocol": "Protocolo de regalos",
    "compass.dress_code": "Código de vestimenta",
    "compass.protocols": "Protocolos Esenciales",

    "profile.title": "El Perfil",
    "profile.noble_standing": "Posición Noble",
    "profile.domain_mastery": "Dominio de Áreas",
    "profile.domain_subtitle": "Sus títulos en los cinco pilares del refinamiento.",
    "profile.recent_log": "Registro Reciente",
    "profile.no_history": "Su registro está actualmente vacío.",
    "profile.visit_atelier": "Visite El Atelier para comenzar sus estudios.",
    "profile.ambition": "Ambición",
    "profile.active_region": "Región Activa",
    "profile.member_since": "Miembro desde",
    "profile.next_rank": "para el próximo rango",
    "profile.current_title": "Título Actual",
    "profile.next": "Siguiente",
    "profile.log.refined": "Refinado",
    "profile.log.reconsidered": "Reconsiderado",
    "profile.log.observed": "Observado",
    "profile.member_since.recently": "Recientemente",

    "scenario.return_atelier": "Volver al Atelier",
    "scenario.pillar": "Pilar",
    "scenario.confirm": "Confirmar Decisión",
    "scenario.submitting": "Enviando…",
    "scenario.mentor_counsel": "El Consejo del Mentor",
    "scenario.impact": "Impacto",
    "scenario.promotion": "Promoción",
    "scenario.elevated_to": "Elevado a",
    "scenario.not_found": "Escenario No Encontrado",

    "common.loading": "Cargando…",
    "common.error": "Algo salió mal.",
    "common.not_found": "Página No Encontrada",
    "common.return_home": "Volver al Inicio",

    "locale.select": "Idioma",
    "locale.choose_region": "Elija su idioma",
    "locale.current": "Idioma actual",

    "region.select": "Región activa",
    "region.choose": "Elija su región de etiqueta",
    "region.in_preparation": "En Elaboración",
    "counsel.region_unavailable": "Esta región está siendo elaborada con esmero. El consejo está disponible para el Reino Unido, los Estados Unidos y los EAU.",
    "region.current": "Región actual",

    "level.the_aware": "El Consciente",
    "level.the_composed": "El Sereno",
    "level.the_refined": "El Refinado",
    "level.the_distinguished": "El Distinguido",
    "level.the_sovereign": "El Soberano",
    "pillar.1.name": "El Mundo Interior",
    "pillar.2.name": "La Presencia",
    "pillar.3.name": "La Voz",
    "pillar.4.name": "La Mesa",
    "pillar.5.name": "La Bodega",
    "trigger.correct_choice": "Elección correcta",
    "trigger.incorrect_choice": "Elección incorrecta",
    "trigger.time_bonus": "Bonificación de tiempo",
  },

  pt: {
    "app.name": "SOWISO",
    "app.tagline": "A arte do comportamento",
    "app.established": "Fundado em 2024",

    "nav.dashboard": "O Painel",
    "nav.atelier": "O Atelier",
    "nav.counsel": "O Conselho",
    "nav.compass": "A Bússola",
    "nav.profile": "Perfil",
    "nav.aria_label": "Navegação principal",
    "nav.menu_open": "Abrir menu de navegação",
    "nav.menu_close": "Fechar menu de navegação",
    "nav.skip_to_content": "Ir para o conteúdo principal",

    "home.greeting": "Bom dia, distinto convidado.",
    "home.standing": "A sua posição",
    "home.enter_atelier": "Entrar no Atelier",
    "home.seek_counsel": "Pedir Conselho",
    "home.cultural_compass": "Bússola Cultural",
    "home.continue_studies": "Continuar os seus estudos",

    "atelier.title": "O Atelier",
    "atelier.subtitle": "Aperfeiçoe os seus instintos através da prática. Selecione um cenário para testar o seu discernimento em situações sociais e culturais complexas.",
    "atelier.pillar": "Pilar",
    "atelier.difficulty": "Dificuldade",
    "atelier.duration": "min",
    "atelier.refines": "Refina o nível",
    "atelier.empty": "Nenhum cenário disponível.",
    "atelier.region": "Região",

    "counsel.title": "O Conselho",
    "counsel.subtitle": "Trinta segundos de orientação discreta. Descreva a sua situação e receba uma resposta imediata e precisa.",
    "counsel.placeholder": "Descreva a situação que requer orientação…",
    "counsel.request": "Pedir Conselho",
    "counsel.guidance": "A Resposta do Mentor",
    "counsel.select_domain": "Selecionar domínio",
    "counsel.consulting": "A consultar…",
    "counsel.domains.dining": "Refeições",
    "counsel.domains.introductions": "Apresentações",
    "counsel.domains.dress_code": "Código de vestuário",
    "counsel.domains.gifting": "Presentes",
    "counsel.domains.digital_protocol": "Protocolo digital",
    "counsel.domains.hosting": "Hospitalidade",
    "counsel.domains.apologies": "Desculpas",
    "counsel.region_context": "Região de etiqueta",
    "counsel.region_prompt": "Pede conselho sobre etiqueta em",
    "counsel.change_region": "alterar",
    "counsel.region_hint": "Alterar através do seletor de região no canto superior direito",

    "compass.title": "A Bússola Cultural",
    "compass.subtitle": "Navegue os costumes do mundo com precisão e confiança.",
    "compass.explore": "Explorar",
    "compass.core_value": "Valor Central",
    "compass.taboo": "Maior Tabu",
    "compass.back": "Voltar à Bússola",
    "compass.dos": "A fazer",
    "compass.donts": "A evitar",
    "compass.dining_etiquette": "Etiqueta à mesa",
    "compass.language_notes": "Notas de idioma",
    "compass.gift_protocol": "Protocolo de presentes",
    "compass.dress_code": "Código de vestuário",
    "compass.protocols": "Protocolos Essenciais",

    "profile.title": "O Perfil",
    "profile.noble_standing": "Posição Nobre",
    "profile.domain_mastery": "Domínio das Áreas",
    "profile.domain_subtitle": "Os seus títulos nos cinco pilares do refinamento.",
    "profile.recent_log": "Registo Recente",
    "profile.no_history": "O seu registo está actualmente vazio.",
    "profile.visit_atelier": "Visite O Atelier para começar os seus estudos.",
    "profile.ambition": "Ambição",
    "profile.active_region": "Região Activa",
    "profile.member_since": "Membro desde",
    "profile.next_rank": "para o próximo nível",
    "profile.current_title": "Título Actual",
    "profile.next": "Seguinte",
    "profile.log.refined": "Refinado",
    "profile.log.reconsidered": "Reconsiderado",
    "profile.log.observed": "Observado",
    "profile.member_since.recently": "Recentemente",

    "scenario.return_atelier": "Voltar ao Atelier",
    "scenario.pillar": "Pilar",
    "scenario.confirm": "Confirmar Decisão",
    "scenario.submitting": "A enviar…",
    "scenario.mentor_counsel": "O Conselho do Mentor",
    "scenario.impact": "Impacto",
    "scenario.promotion": "Promoção",
    "scenario.elevated_to": "Elevado a",
    "scenario.not_found": "Cenário Não Encontrado",

    "common.loading": "A carregar…",
    "common.error": "Algo correu mal.",
    "common.not_found": "Página Não Encontrada",
    "common.return_home": "Voltar ao Início",

    "locale.select": "Idioma",
    "locale.choose_region": "Escolha o seu idioma",
    "locale.current": "Idioma actual",

    "region.select": "Região ativa",
    "region.choose": "Escolha a sua região de etiqueta",
    "region.in_preparation": "Em Preparação",
    "counsel.region_unavailable": "Esta região está presentemente a ser preparada. O aconselhamento está disponível para o Reino Unido, os Estados Unidos e os EAU.",
    "region.current": "Região atual",

    "level.the_aware": "O Consciente",
    "level.the_composed": "O Sereno",
    "level.the_refined": "O Refinado",
    "level.the_distinguished": "O Distinto",
    "level.the_sovereign": "O Soberano",
    "pillar.1.name": "O Mundo Interior",
    "pillar.2.name": "A Presença",
    "pillar.3.name": "A Voz",
    "pillar.4.name": "A Mesa",
    "pillar.5.name": "A Adega",
    "trigger.correct_choice": "Escolha correta",
    "trigger.incorrect_choice": "Escolha incorreta",
    "trigger.time_bonus": "Bónus de tempo",
  },

  it: {
    "app.name": "SOWISO",
    "app.tagline": "L'arte del comportamento",
    "app.established": "Fondato nel 2024",

    "nav.dashboard": "Il Cruscotto",
    "nav.atelier": "L'Atelier",
    "nav.counsel": "Il Consiglio",
    "nav.compass": "La Bussola",
    "nav.profile": "Profilo",
    "nav.aria_label": "Navigazione principale",
    "nav.menu_open": "Apri menu di navigazione",
    "nav.menu_close": "Chiudi menu di navigazione",
    "nav.skip_to_content": "Vai al contenuto principale",

    "home.greeting": "Buongiorno, distinto ospite.",
    "home.standing": "Il Suo livello",
    "home.enter_atelier": "Entrare nell'Atelier",
    "home.seek_counsel": "Cercare Consiglio",
    "home.cultural_compass": "Bussola Culturale",
    "home.continue_studies": "Continuare i Suoi studi",

    "atelier.title": "L'Atelier",
    "atelier.subtitle": "Affini i Suoi istinti attraverso la pratica. Selezioni uno scenario per mettere alla prova il Suo giudizio in situazioni sociali e culturali complesse.",
    "atelier.pillar": "Pilastro",
    "atelier.difficulty": "Difficoltà",
    "atelier.duration": "min",
    "atelier.refines": "Affina il rango",
    "atelier.empty": "Nessuno scenario disponibile.",
    "atelier.region": "Regione",

    "counsel.title": "Il Consiglio",
    "counsel.subtitle": "Trenta secondi di guida discreta. Descriva la Sua situazione e riceva una risposta immediata e precisa.",
    "counsel.placeholder": "Descriva la situazione che richiede un consiglio…",
    "counsel.request": "Richiedere Consiglio",
    "counsel.guidance": "La Risposta del Mentore",
    "counsel.select_domain": "Selezionare il dominio",
    "counsel.consulting": "In consultazione…",
    "counsel.domains.dining": "Pasti",
    "counsel.domains.introductions": "Presentazioni",
    "counsel.domains.dress_code": "Codice abbigliamento",
    "counsel.domains.gifting": "Regali",
    "counsel.domains.digital_protocol": "Protocollo digitale",
    "counsel.domains.hosting": "Ospitalità",
    "counsel.domains.apologies": "Scuse",
    "counsel.region_context": "Regione d'etichetta",
    "counsel.region_prompt": "Chiede consiglio sull'etichetta in",
    "counsel.change_region": "modificare",
    "counsel.region_hint": "Modificare tramite il selettore di regione in alto a destra",

    "compass.title": "La Bussola Culturale",
    "compass.subtitle": "Navighi le usanze del mondo con precisione e fiducia.",
    "compass.explore": "Esplorare",
    "compass.core_value": "Valore Fondamentale",
    "compass.taboo": "Più Grande Tabù",
    "compass.back": "Torna alla Bussola",
    "compass.dos": "Da fare",
    "compass.donts": "Da evitare",
    "compass.dining_etiquette": "Galateo a tavola",
    "compass.language_notes": "Note linguistiche",
    "compass.gift_protocol": "Protocollo dei doni",
    "compass.dress_code": "Codice abbigliamento",
    "compass.protocols": "Protocolli Essenziali",

    "profile.title": "Il Profilo",
    "profile.noble_standing": "Posizione Nobile",
    "profile.domain_mastery": "Padronanza dei Domini",
    "profile.domain_subtitle": "I Suoi titoli nei cinque pilastri del raffinamento.",
    "profile.recent_log": "Registro Recente",
    "profile.no_history": "Il Suo registro è attualmente vuoto.",
    "profile.visit_atelier": "Visiti L'Atelier per iniziare i Suoi studi.",
    "profile.ambition": "Ambizione",
    "profile.active_region": "Regione Attiva",
    "profile.member_since": "Membro dal",
    "profile.next_rank": "al prossimo grado",
    "profile.current_title": "Titolo Attuale",
    "profile.next": "Avanti",
    "profile.log.refined": "Raffinato",
    "profile.log.reconsidered": "Riconsiderato",
    "profile.log.observed": "Osservato",
    "profile.member_since.recently": "Recentemente",

    "scenario.return_atelier": "Torna all'Atelier",
    "scenario.pillar": "Pilastro",
    "scenario.confirm": "Conferma Decisione",
    "scenario.submitting": "Invio in corso…",
    "scenario.mentor_counsel": "Il Consiglio del Mentore",
    "scenario.impact": "Impatto",
    "scenario.promotion": "Promozione",
    "scenario.elevated_to": "Elevato a",
    "scenario.not_found": "Scenario Non Trovato",

    "common.loading": "Caricamento…",
    "common.error": "Qualcosa è andato storto.",
    "common.not_found": "Pagina Non Trovata",
    "common.return_home": "Torna alla Home",

    "locale.select": "Lingua",
    "locale.choose_region": "Scelga la sua lingua",
    "locale.current": "Lingua attuale",

    "region.select": "Regione attiva",
    "region.choose": "Scelga la sua regione d'etichetta",
    "region.in_preparation": "In Preparazione",
    "counsel.region_unavailable": "Questa regione è attualmente in fase di attenta preparazione. Il consiglio è disponibile per il Regno Unito, gli Stati Uniti e gli EAU.",
    "region.current": "Regione attuale",

    "level.the_aware": "Il Consapevole",
    "level.the_composed": "Il Composto",
    "level.the_refined": "Il Raffinato",
    "level.the_distinguished": "Il Distinto",
    "level.the_sovereign": "Il Sovrano",
    "pillar.1.name": "Il Mondo Interiore",
    "pillar.2.name": "La Presenza",
    "pillar.3.name": "La Voce",
    "pillar.4.name": "La Tavola",
    "pillar.5.name": "La Cantina",
    "trigger.correct_choice": "Scelta corretta",
    "trigger.incorrect_choice": "Scelta errata",
    "trigger.time_bonus": "Bonus di tempo",
  },

  hi: {
    "app.name": "SOWISO",
    "app.tagline": "आचरण की कला",
    "app.established": "स्थापित 2024",

    "nav.dashboard": "डैशबोर्ड",
    "nav.atelier": "एटेलियर",
    "nav.counsel": "परामर्श",
    "nav.compass": "कम्पास",
    "nav.profile": "प्रोफ़ाइल",
    "nav.aria_label": "मुख्य नेविगेशन",
    "nav.menu_open": "नेविगेशन मेनू खोलें",
    "nav.menu_close": "नेविगेशन मेनू बंद करें",
    "nav.skip_to_content": "मुख्य सामग्री पर जाएं",

    "home.greeting": "नमस्ते, सम्मानित अतिथि।",
    "home.standing": "आपकी स्थिति",
    "home.enter_atelier": "एटेलियर में प्रवेश करें",
    "home.seek_counsel": "परामर्श लें",
    "home.cultural_compass": "सांस्कृतिक कम्पास",
    "home.continue_studies": "अपनी पढ़ाई जारी रखें",

    "atelier.title": "एटेलियर",
    "atelier.subtitle": "अभ्यास के माध्यम से अपनी प्रवृत्तियों को परिष्कृत करें। जटिल सामाजिक और सांस्कृतिक परिस्थितियों में अपने निर्णय का परीक्षण करने के लिए एक परिदृश्य चुनें।",
    "atelier.pillar": "स्तंभ",
    "atelier.difficulty": "कठिनाई",
    "atelier.duration": "मिनट",
    "atelier.refines": "स्तर परिष्कृत करता है",
    "atelier.empty": "कोई परिदृश्य उपलब्ध नहीं है।",
    "atelier.region": "क्षेत्र",

    "counsel.title": "परामर्श",
    "counsel.subtitle": "तीस सेकंड का विवेकशील मार्गदर्शन। अपनी स्थिति का वर्णन करें और तत्काल, सटीक प्रतिक्रिया प्राप्त करें।",
    "counsel.placeholder": "उस स्थिति का वर्णन करें जिसके लिए परामर्श आवश्यक है…",
    "counsel.request": "परामर्श अनुरोध",
    "counsel.guidance": "मेंटर की प्रतिक्रिया",
    "counsel.select_domain": "डोमेन चुनें",
    "counsel.consulting": "परामर्श हो रहा है…",
    "counsel.domains.dining": "भोजन",
    "counsel.domains.introductions": "परिचय",
    "counsel.domains.dress_code": "ड्रेस कोड",
    "counsel.domains.gifting": "उपहार",
    "counsel.domains.digital_protocol": "डिजिटल प्रोटोकॉल",
    "counsel.domains.hosting": "आतिथ्य",
    "counsel.domains.apologies": "क्षमायाचना",
    "counsel.region_context": "शिष्टाचार क्षेत्र",
    "counsel.region_prompt": "आप इस क्षेत्र में शिष्टाचार का परामर्श ले रहे हैं",
    "counsel.change_region": "बदलें",
    "counsel.region_hint": "ऊपर दाईं ओर क्षेत्र चयनकर्ता से बदलें",

    "compass.title": "सांस्कृतिक कम्पास",
    "compass.subtitle": "सटीकता और आत्मविश्वास के साथ विश्व की परंपराओं को समझें।",
    "compass.explore": "अन्वेषण",
    "compass.core_value": "मूल मूल्य",
    "compass.taboo": "सबसे बड़ा वर्जित",
    "compass.back": "कम्पास पर वापस",
    "compass.dos": "करें",
    "compass.donts": "न करें",
    "compass.dining_etiquette": "भोजन शिष्टाचार",
    "compass.language_notes": "भाषा संबंधी टिप्पणियां",
    "compass.gift_protocol": "उपहार प्रोटोकॉल",
    "compass.dress_code": "वेशभूषा संहिता",
    "compass.protocols": "आवश्यक प्रोटोकॉल",

    "profile.title": "प्रोफ़ाइल",
    "profile.noble_standing": "नोबल स्थिति",
    "profile.domain_mastery": "डोमेन महारत",
    "profile.domain_subtitle": "परिष्करण के पांच स्तंभों में आपके खिताब।",
    "profile.recent_log": "हालिया लॉग",
    "profile.no_history": "आपका रजिस्टर अभी खाली है।",
    "profile.visit_atelier": "अपनी पढ़ाई शुरू करने के लिए एटेलियर पर जाएं।",
    "profile.ambition": "महत्वाकांक्षा",
    "profile.active_region": "सक्रिय क्षेत्र",
    "profile.member_since": "सदस्य बने",
    "profile.next_rank": "अगले स्तर तक",
    "profile.current_title": "वर्तमान खिताब",
    "profile.next": "अगला",
    "profile.log.refined": "परिष्कृत",
    "profile.log.reconsidered": "पुनर्विचारित",
    "profile.log.observed": "देखा गया",
    "profile.member_since.recently": "हाल ही में",

    "scenario.return_atelier": "एटेलियर पर वापस",
    "scenario.pillar": "स्तंभ",
    "scenario.confirm": "निर्णय की पुष्टि करें",
    "scenario.submitting": "सबमिट हो रहा है…",
    "scenario.mentor_counsel": "मेंटर की सलाह",
    "scenario.impact": "प्रभाव",
    "scenario.promotion": "पदोन्नति",
    "scenario.elevated_to": "पदोन्नत",
    "scenario.not_found": "परिदृश्य नहीं मिला",

    "common.loading": "लोड हो रहा है…",
    "common.error": "कुछ गलत हुआ।",
    "common.not_found": "पृष्ठ नहीं मिला",
    "common.return_home": "होम पर वापस",

    "locale.select": "भाषा",
    "locale.choose_region": "अपनी भाषा चुनें",
    "locale.current": "वर्तमान भाषा",

    "region.select": "सक्रिय क्षेत्र",
    "region.choose": "अपना शिष्टाचार क्षेत्र चुनें",
    "region.in_preparation": "तैयारी में",
    "counsel.region_unavailable": "यह क्षेत्र अभी सावधानीपूर्वक तैयार किया जा रहा है। परामर्श यूनाइटेड किंगडम, संयुक्त राज्य और यूएई के लिए उपलब्ध है।",
    "region.current": "वर्तमान क्षेत्र",

    "level.the_aware": "जागरूक",
    "level.the_composed": "शांत",
    "level.the_refined": "परिष्कृत",
    "level.the_distinguished": "विशिष्ट",
    "level.the_sovereign": "संप्रभु",
    "pillar.1.name": "आंतरिक संसार",
    "pillar.2.name": "उपस्थिति",
    "pillar.3.name": "वाणी",
    "pillar.4.name": "मेज",
    "pillar.5.name": "तहखाना",
    "trigger.correct_choice": "सही विकल्प",
    "trigger.incorrect_choice": "गलत विकल्प",
    "trigger.time_bonus": "समय बोनस",
  },
};

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
  dir: "ltr" | "rtl";
  language: SupportedLanguage;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "sowiso_locale";
const ALL_LOCALES: SupportedLocale[] = LOCALE_GROUPS.flatMap((g) => g.locales.map((l) => l.locale));

function detectLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
  if (stored && ALL_LOCALES.includes(stored)) return stored;

  const browserLocale = navigator.language as SupportedLocale;
  if (ALL_LOCALES.includes(browserLocale)) return browserLocale;

  const browserBase = navigator.language.split("-")[0];
  const match = ALL_LOCALES.find((l) => l.startsWith(browserBase + "-"));
  if (match) return match;

  return "en-GB";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(detectLocale);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const language: SupportedLanguage = localeToBaseLang(locale);

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
    <LocaleContext.Provider value={{ locale, setLocale, t, dir, language }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLanguage(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useLocale(): LocaleContextValue {
  return useLanguage();
}
