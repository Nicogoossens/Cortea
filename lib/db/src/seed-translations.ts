/**
 * SEED: DB-backed legacy translations (EN / NL / FR only)
 *
 * SCOPE: This seed manages a small set of legacy UI keys served via
 * GET /api/translations. It covers only EN, NL, and FR.
 *
 * IMPORTANT — LOCALE MANAGEMENT WORKFLOW AGREEMENT:
 * The main translation system for the Sowiso front-end is i18next, using
 * flat JSON files at artifacts/sowiso/src/locales/{lang}/translation.json.
 * Those files are NOT managed by this seed — they must be maintained manually.
 *
 * Rule: Every time new keys are added to the i18next locale files (EN or NL),
 * ALL 9 locales (en, nl, de, fr, es, it, pt, ar, ja) must be updated at the
 * same time. English fallback text is never acceptable in non-EN locale files.
 *
 * Checklist for new content additions:
 *   1. Add the key + English value to src/locales/en/translation.json
 *   2. Add the Dutch translation to src/locales/nl/translation.json
 *   3. Add translations for all 7 remaining locales (de, fr, es, it, pt, ar, ja)
 *   4. Sync src/locales/ → public/locales/ (copy files or rebuild)
 *
 * If this seed ever begins managing locale keys, it must include translations
 * for all 9 locales (not just EN/NL/FR) before being merged.
 */
import { db } from "./index.js";
import { translationsTable } from "./schema/index.js";
import { sql } from "drizzle-orm";

type TranslationRow = Omit<typeof translationsTable.$inferInsert, "id">;

const UI_KEYS: Record<string, { en: string; nl: string; fr: string }> = {
  "app.name":                    { en: "Cortéa",                              nl: "Cortéa",                               fr: "Cortéa" },
  "app.tagline":                 { en: "The art of conduct",                  nl: "De kunst van gedrag",                  fr: "L'art de la conduite" },
  "app.established":             { en: "Est. 2024",                           nl: "Opgericht 2024",                       fr: "Fondé en 2024" },

  "nav.dashboard":               { en: "The Dashboard",                       nl: "Het Dashboard",                        fr: "Le Tableau de Bord" },
  "nav.atelier":                 { en: "The Atelier",                         nl: "Het Atelier",                          fr: "L'Atelier" },
  "nav.counsel":                 { en: "The Counsel",                         nl: "De Raadgeving",                        fr: "Le Conseil" },
  "nav.compass":                 { en: "The Compass",                         nl: "Het Kompas",                           fr: "La Boussole" },
  "nav.profile":                 { en: "Profile",                             nl: "Profiel",                              fr: "Profil" },

  "home.greeting":               { en: "Good day, distinguished guest.",      nl: "Goedendag, gewaardeerde gast.",        fr: "Bonjour, distingué invité." },
  "home.standing":               { en: "Your standing",                       nl: "Uw standing",                          fr: "Votre niveau" },
  "home.enter_atelier":          { en: "Enter The Atelier",                   nl: "Betreed Het Atelier",                  fr: "Entrer dans L'Atelier" },
  "home.seek_counsel":           { en: "Seek Counsel",                        nl: "Zoek Advies",                          fr: "Chercher Conseil" },
  "home.cultural_compass":       { en: "Cultural Compass",                    nl: "Cultureel Kompas",                     fr: "Boussole Culturelle" },
  "home.continue_studies":       { en: "Continue your studies",               nl: "Zet uw studies voort",                 fr: "Continuer vos études" },

  "atelier.title":               { en: "The Atelier",                         nl: "Het Atelier",                          fr: "L'Atelier" },
  "atelier.subtitle":            { en: "Refine your instincts through practice. Select a scenario below to test your judgement in complex social and cultural situations.", nl: "Verfijn uw instincten door oefening. Selecteer een scenario om uw oordeel te testen in complexe sociale en culturele situaties.", fr: "Affinez vos instincts par la pratique. Sélectionnez un scénario pour tester votre jugement." },
  "atelier.pillar":              { en: "Pillar",                              nl: "Zuil",                                 fr: "Pilier" },
  "atelier.difficulty":          { en: "Difficulty",                         nl: "Moeilijkheid",                         fr: "Difficulté" },
  "atelier.duration":            { en: "min",                                nl: "min",                                  fr: "min" },
  "atelier.empty":               { en: "No scenarios available.",            nl: "Geen scenario's beschikbaar.",          fr: "Aucun scénario disponible." },
  "atelier.region":              { en: "Region",                              nl: "Regio",                                fr: "Région" },

  "counsel.title":               { en: "The Counsel",                         nl: "De Raadgeving",                        fr: "Le Conseil" },
  "counsel.subtitle":            { en: "Thirty seconds of discreet guidance. Describe your situation and receive an immediate, precise response.", nl: "Dertig seconden discrete begeleiding. Beschrijf uw situatie en ontvang een onmiddellijk, precies antwoord.", fr: "Trente secondes de guidance discrète. Décrivez votre situation et recevez une réponse immédiate." },
  "counsel.placeholder":         { en: "Describe the situation requiring counsel…", nl: "Beschrijf de situatie die begeleiding vereist…", fr: "Décrivez la situation nécessitant un conseil…" },
  "counsel.request":             { en: "Request Counsel",                     nl: "Vraag Advies",                         fr: "Demander Conseil" },
  "counsel.guidance":            { en: "The Mentor's Response",               nl: "Het Antwoord van de Mentor",            fr: "La Réponse du Mentor" },

  "compass.title":               { en: "The Cultural Compass",                nl: "Het Culturele Kompas",                  fr: "La Boussole Culturelle" },
  "compass.subtitle":            { en: "Navigate the customs of the world with precision and confidence.", nl: "Navigeer de gebruiken van de wereld met precisie en vertrouwen.", fr: "Naviguez les coutumes du monde avec précision et confiance." },
  "compass.explore":             { en: "Explore",                             nl: "Verkennen",                             fr: "Explorer" },
  "compass.core_value":          { en: "Core Value",                          nl: "Kernwaarde",                           fr: "Valeur Fondamentale" },
  "compass.taboo":               { en: "Biggest Taboo",                       nl: "Grootste Taboe",                        fr: "Grand Tabou" },
  "compass.back":                { en: "Back to Compass",                     nl: "Terug naar Kompas",                    fr: "Retour à la Boussole" },
  "compass.dos":                 { en: "Do",                                  nl: "Doen",                                 fr: "À faire" },
  "compass.donts":               { en: "Avoid",                               nl: "Vermijden",                             fr: "À éviter" },

  "profile.title":               { en: "The Profile",                         nl: "Het Profiel",                          fr: "Le Profil" },
  "profile.noble_standing":      { en: "Noble Standing",                      nl: "Edele Standing",                       fr: "Noblesse de Rang" },
  "profile.domain_mastery":      { en: "Domain Mastery",                      nl: "Domeinbeheersing",                     fr: "Maîtrise des Domaines" },
  "profile.domain_subtitle":     { en: "Your titles across the five pillars of refinement.", nl: "Uw titels over de vijf zuilen van verfijning.", fr: "Vos titres dans les cinq piliers du raffinement." },
  "profile.recent_log":          { en: "Recent Log",                          nl: "Recente Log",                          fr: "Historique Récent" },
  "profile.no_history":          { en: "Your ledger is currently empty.",     nl: "Uw register is momenteel leeg.",       fr: "Votre registre est actuellement vide." },
  "profile.visit_atelier":       { en: "Visit The Atelier to begin your studies.", nl: "Bezoek Het Atelier om uw studies te beginnen.", fr: "Visitez L'Atelier pour commencer vos études." },
  "profile.ambition":            { en: "Ambition",                            nl: "Ambitie",                              fr: "Ambition" },
  "profile.active_region":       { en: "Active Region",                       nl: "Actieve Regio",                        fr: "Région Active" },
  "profile.member_since":        { en: "Member since",                        nl: "Lid sinds",                            fr: "Membre depuis" },
  "profile.next_rank":           { en: "to next rank",                        nl: "naar volgend rang",                    fr: "vers le prochain rang" },
  "profile.current_title":       { en: "Current Title",                       nl: "Huidige Titel",                        fr: "Titre Actuel" },
  "profile.next":                { en: "Next",                                nl: "Volgende",                             fr: "Suivant" },

  "scenario.return_atelier":     { en: "Return to Atelier",                   nl: "Terug naar Atelier",                   fr: "Retour à l'Atelier" },
  "scenario.pillar":             { en: "Pillar",                              nl: "Zuil",                                 fr: "Pilier" },
  "scenario.confirm":            { en: "Confirm Decision",                    nl: "Bevestig Beslissing",                  fr: "Confirmer la Décision" },
  "scenario.submitting":         { en: "Submitting…",                         nl: "Indienen…",                            fr: "Envoi en cours…" },
  "scenario.mentor_counsel":     { en: "The Mentor's Counsel",                nl: "De Raad van de Mentor",                fr: "Le Conseil du Mentor" },
  "scenario.impact":             { en: "Impact",                              nl: "Impact",                               fr: "Impact" },
  "scenario.promotion":          { en: "Promotion",                           nl: "Promotie",                             fr: "Promotion" },
  "scenario.elevated_to":        { en: "Elevated to",                         nl: "Verheven tot",                         fr: "Élevé au rang de" },
  "scenario.not_found":          { en: "Scenario Not Found",                  nl: "Scenario Niet Gevonden",               fr: "Scénario Introuvable" },

  "common.loading":              { en: "Loading…",                            nl: "Laden…",                               fr: "Chargement…" },
  "common.error":                { en: "Something went amiss.",               nl: "Er is iets misgegaan.",                fr: "Une erreur s'est produite." },
  "common.not_found":            { en: "Page Not Found",                      nl: "Pagina Niet Gevonden",                 fr: "Page Introuvable" },
  "common.return_home":          { en: "Return Home",                         nl: "Terug naar Start",                     fr: "Retour à l'Accueil" },

  "language.en":                 { en: "English",                             nl: "Engels",                               fr: "Anglais" },
  "language.nl":                 { en: "Dutch",                               nl: "Nederlands",                           fr: "Néerlandais" },
  "language.fr":                 { en: "French",                              nl: "Frans",                                fr: "Français" },
  "language.select":             { en: "Language",                            nl: "Taal",                                 fr: "Langue" },

  "level.the_aware":             { en: "The Aware",                           nl: "De Bewuste",                           fr: "L'Éveillé" },
  "level.the_composed":          { en: "The Composed",                        nl: "De Beheerste",                         fr: "Le Serein" },
  "level.the_refined":           { en: "The Refined",                         nl: "De Verfijnde",                         fr: "Le Raffiné" },
  "level.the_distinguished":     { en: "The Distinguished",                   nl: "De Onderscheiden",                     fr: "Le Distingué" },
  "level.the_sovereign":         { en: "The Sovereign",                       nl: "De Soevereine",                        fr: "Le Souverain" },
};

/** Social-class framework keys — all 11 active locales */
type AllLocales = { en: string; nl: string; fr: string; de: string; es: string; it: string; pt: string; zh: string; ja: string; ar: string; ru: string };

const SOCIAL_CLASS_KEYS: Record<string, AllLocales> = {
  // ── Register display names ─────────────────────────────────────────────────
  "register.elite.name": {
    en: "Elite",         nl: "Elite",           fr: "Élite",
    de: "Elite",         es: "Élite",           it: "Élite",
    pt: "Elite",         zh: "精英",             ja: "エリート",
    ar: "النخبة",        ru: "Элита",
  },
  "register.middle_class.name": {
    en: "Middle Class",  nl: "Middenklasse",    fr: "Classe Moyenne",
    de: "Mittelklasse",  es: "Clase Media",     it: "Ceto Medio",
    pt: "Classe Média",  zh: "中产阶级",          ja: "中産階級",
    ar: "الطبقة المتوسطة", ru: "Средний класс",
  },

  // ── Elite pillar domain names ──────────────────────────────────────────────
  "elite.pillar.1.name": {
    en: "The World Within",   nl: "De Wereld Binnenin",     fr: "Le Monde Intérieur",
    de: "Die Welt im Innern", es: "El Mundo Interior",      it: "Il Mondo Interiore",
    pt: "O Mundo Interior",   zh: "内在世界",                ja: "内なる世界",
    ar: "العالم الداخلي",     ru: "Внутренний мир",
  },
  "elite.pillar.2.name": {
    en: "The Presence",  nl: "De Presentie",    fr: "La Présence",
    de: "Die Präsenz",   es: "La Presencia",    it: "La Presenza",
    pt: "A Presença",    zh: "气场",             ja: "プレゼンス",
    ar: "الحضور",        ru: "Присутствие",
  },
  "elite.pillar.3.name": {
    en: "The Voice",     nl: "De Stem",         fr: "La Voix",
    de: "Die Stimme",    es: "La Voz",          it: "La Voce",
    pt: "A Voz",         zh: "声音",             ja: "ボイス",
    ar: "الصوت",         ru: "Голос",
  },
  "elite.pillar.4.name": {
    en: "The Table",     nl: "De Tafel",        fr: "La Table",
    de: "Der Tisch",     es: "La Mesa",         it: "La Tavola",
    pt: "A Mesa",        zh: "餐桌",             ja: "テーブル",
    ar: "المائدة",       ru: "Стол",
  },
  "elite.pillar.5.name": {
    en: "The Cellar",    nl: "De Kelder",       fr: "La Cave",
    de: "Der Keller",    es: "La Bodega",       it: "La Cantina",
    pt: "A Adega",       zh: "酒窖",             ja: "セラー",
    ar: "القبو",         ru: "Погреб",
  },

  // ── Elite level titles ─────────────────────────────────────────────────────
  "elite.level.1.title": {
    en: "The Initiate",       nl: "De Ingewijde",      fr: "L'Initié",
    de: "Der Eingeweihte",    es: "El Iniciado",        it: "L'Iniziato",
    pt: "O Iniciado",         zh: "入门者",              ja: "入門者",
    ar: "المبتدئ",            ru: "Посвящённый",
  },
  "elite.level.2.title": {
    en: "The Apprentice",     nl: "De Leerling",       fr: "L'Apprenti",
    de: "Der Lehrling",       es: "El Aprendiz",        it: "L'Apprendista",
    pt: "O Aprendiz",         zh: "学徒",                ja: "見習い",
    ar: "المتدرب",            ru: "Ученик",
  },
  "elite.level.3.title": {
    en: "The Practitioner",   nl: "De Beoefenaar",     fr: "Le Praticien",
    de: "Der Praktiker",      es: "El Practicante",     it: "Il Praticante",
    pt: "O Praticante",       zh: "实践者",              ja: "実践者",
    ar: "الممارس",            ru: "Практик",
  },
  "elite.level.4.title": {
    en: "The Specialist",     nl: "De Specialist",     fr: "Le Spécialiste",
    de: "Der Spezialist",     es: "El Especialista",    it: "Lo Specialista",
    pt: "O Especialista",     zh: "专家",                ja: "スペシャリスト",
    ar: "المتخصص",            ru: "Специалист",
  },
  "elite.level.5.title": {
    en: "The Master",         nl: "De Meester",        fr: "Le Maître",
    de: "Der Meister",        es: "El Maestro",         it: "Il Maestro",
    pt: "O Mestre",           zh: "大师",                ja: "マスター",
    ar: "السيد",              ru: "Мастер",
  },

  // ── Middle class phase domain names ───────────────────────────────────────
  "middle.phase.1.name": {
    en: "The Individual",     nl: "Het Individu",      fr: "L'Individu",
    de: "Das Individuum",     es: "El Individuo",       it: "L'Individuo",
    pt: "O Indivíduo",        zh: "个体",                ja: "個人",
    ar: "الفرد",              ru: "Личность",
  },
  "middle.phase.2.name": {
    en: "The Dynamic",        nl: "De Dynamiek",       fr: "La Dynamique",
    de: "Die Dynamik",        es: "La Dinámica",        it: "La Dinamica",
    pt: "A Dinâmica",         zh: "动态",                ja: "ダイナミクス",
    ar: "الديناميكية",        ru: "Динамика",
  },
  "middle.phase.3.name": {
    en: "The Arena",          nl: "De Arena",          fr: "L'Arène",
    de: "Die Arena",          es: "La Arena",           it: "L'Arena",
    pt: "A Arena",            zh: "竞技场",              ja: "アリーナ",
    ar: "الساحة",             ru: "Арена",
  },
  "middle.phase.4.name": {
    en: "The Territory",      nl: "Het Territorium",   fr: "Le Territoire",
    de: "Das Territorium",    es: "El Territorio",      it: "Il Territorio",
    pt: "O Território",       zh: "领域",                ja: "テリトリー",
    ar: "الإقليم",            ru: "Территория",
  },
  "middle.phase.5.name": {
    en: "The Current",        nl: "De Stroom",         fr: "Le Courant",
    de: "Der Strom",          es: "La Corriente",       it: "La Corrente",
    pt: "A Corrente",         zh: "当代",                ja: "カレント",
    ar: "التيار",             ru: "Поток",
  },

  // ── Middle class level titles ──────────────────────────────────────────────
  "middle.level.1.title": {
    en: "The Foundation",     nl: "Het Fundament",     fr: "Le Fondement",
    de: "Das Fundament",      es: "La Fundación",       it: "Le Fondamenta",
    pt: "A Fundação",         zh: "基础",                ja: "基礎",
    ar: "الأساس",             ru: "Основа",
  },
  "middle.level.2.title": {
    en: "The Practice",       nl: "De Praktijk",       fr: "La Pratique",
    de: "Die Praxis",         es: "La Práctica",        it: "La Pratica",
    pt: "A Prática",          zh: "实践",                ja: "実践",
    ar: "الممارسة",           ru: "Практика",
  },
  "middle.level.3.title": {
    en: "The Confidence",     nl: "Het Vertrouwen",    fr: "La Confiance",
    de: "Das Selbstvertrauen",es: "La Confianza",       it: "La Fiducia",
    pt: "A Confiança",        zh: "自信",                ja: "自信",
    ar: "الثقة",              ru: "Уверенность",
  },
  "middle.level.4.title": {
    en: "The Fluency",        nl: "De Vloeiendheid",   fr: "La Fluidité",
    de: "Die Flüssigkeit",    es: "La Fluidez",         it: "La Fluidità",
    pt: "A Fluência",         zh: "流畅",                ja: "流暢さ",
    ar: "الطلاقة",            ru: "Беглость",
  },
  "middle.level.5.title": {
    en: "The Mastery",        nl: "De Meesterschap",   fr: "La Maîtrise",
    de: "Die Meisterschaft",  es: "La Maestría",        it: "La Maestria",
    pt: "A Maestria",         zh: "精通",                ja: "マスタリー",
    ar: "الإتقان",            ru: "Мастерство",
  },

  // ── Middle class research pillar labels ────────────────────────────────────
  "middle.research.P1.label": {
    en: "Adaptive Linguistics",       nl: "Adaptieve Taalkunde",        fr: "Linguistique Adaptative",
    de: "Adaptive Linguistik",        es: "Lingüística Adaptativa",     it: "Linguistica Adattiva",
    pt: "Linguística Adaptativa",     zh: "适应性语言学",                 ja: "適応的言語学",
    ar: "اللغويات التكيفية",          ru: "Адаптивная лингвистика",
  },
  "middle.research.P2.label": {
    en: "Professional Branding",      nl: "Professioneel Imago",        fr: "Image Professionnelle",
    de: "Professionelles Branding",   es: "Marca Profesional",          it: "Branding Professionale",
    pt: "Marca Profissional",         zh: "职业品牌",                     ja: "プロフェッショナルブランディング",
    ar: "العلامة المهنية",            ru: "Профессиональный брендинг",
  },
  "middle.research.P3.label": {
    en: "Social Navigation",          nl: "Sociale Navigatie",          fr: "Navigation Sociale",
    de: "Soziale Navigation",         es: "Navegación Social",          it: "Navigazione Sociale",
    pt: "Navegação Social",           zh: "社交导航",                     ja: "ソーシャルナビゲーション",
    ar: "التنقل الاجتماعي",           ru: "Социальная навигация",
  },
  "middle.research.P4.label": {
    en: "Merit-based Etiquette",      nl: "Verdienste-gebaseerde Etiquette", fr: "Étiquette au Mérite",
    de: "Leistungsbasierte Etikette", es: "Etiqueta por Mérito",        it: "Etichetta al Merito",
    pt: "Etiqueta por Mérito",        zh: "实力礼仪",                     ja: "実力主義のエチケット",
    ar: "آداب قائمة على الجدارة",    ru: "Этикет по заслугам",
  },

  // ── Phase 4–5 module labels ────────────────────────────────────────────────
  "middle.module.MOD_A.label": {
    en: "Linguistic Map",        nl: "Taalkaart",              fr: "Carte Linguistique",
    de: "Sprachkarte",           es: "Mapa Lingüístico",       it: "Mappa Linguistica",
    pt: "Mapa Linguístico",      zh: "语言地图",                ja: "言語マップ",
    ar: "الخريطة اللغوية",       ru: "Языковая карта",
  },
  "middle.module.MOD_B.label": {
    en: "Regional Registers",    nl: "Regionale Registers",    fr: "Registres Régionaux",
    de: "Regionale Register",    es: "Registros Regionales",   it: "Registri Regionali",
    pt: "Registos Regionais",    zh: "地区语域",                ja: "地域別レジスター",
    ar: "السجلات الإقليمية",     ru: "Региональные регистры",
  },
  "middle.module.MOD_C.label": {
    en: "Institutional Protocol",  nl: "Institutioneel Protocol",  fr: "Protocole Institutionnel",
    de: "Institutionelles Protokoll", es: "Protocolo Institucional", it: "Protocollo Istituzionale",
    pt: "Protocolo Institucional",   zh: "机构礼仪",                  ja: "機関プロトコル",
    ar: "البروتوكول المؤسسي",        ru: "Институциональный протокол",
  },
  "middle.module.MOD_D.label": {
    en: "Life Milestones",       nl: "Levensmijlpalen",        fr: "Étapes de Vie",
    de: "Lebensmeilensteine",    es: "Hitos Vitales",          it: "Tappe di Vita",
    pt: "Marcos de Vida",        zh: "人生里程碑",               ja: "人生の節目",
    ar: "محطات الحياة",          ru: "Жизненные вехи",
  },
  "middle.module.MOD_E.label": {
    en: "Digital Etiquette",     nl: "Digitale Etiquette",     fr: "Étiquette Numérique",
    de: "Digitale Etikette",     es: "Etiqueta Digital",       it: "Galateo Digitale",
    pt: "Etiqueta Digital",      zh: "数字礼仪",                ja: "デジタルエチケット",
    ar: "آداب رقمية",            ru: "Цифровой этикет",
  },
  "middle.module.MOD_F.label": {
    en: "Multicultural Mosaic",  nl: "Multiculturele Mozaïek", fr: "Mosaïque Multiculturelle",
    de: "Multikulturelles Mosaik", es: "Mosaico Multicultural", it: "Mosaico Multiculturale",
    pt: "Mosaico Multicultural", zh: "多元文化镶嵌",             ja: "多文化モザイク",
    ar: "الفسيفساء متعددة الثقافات", ru: "Многокультурная мозаика",
  },
  "middle.module.MOD_G.label": {
    en: "Class Transitions",     nl: "Klassetransities",       fr: "Transitions de Classe",
    de: "Klassenübergänge",      es: "Transiciones de Clase",  it: "Transizioni di Classe",
    pt: "Transições de Classe",  zh: "阶层流动",                ja: "階級移行",
    ar: "تحولات الطبقة",         ru: "Классовые переходы",
  },

  // ── Answer tier labels ─────────────────────────────────────────────────────
  "answer.tier.1.label": {
    en: "Correct",       nl: "Correct",         fr: "Correct",
    de: "Richtig",       es: "Correcto",        it: "Corretto",
    pt: "Correto",       zh: "正确",             ja: "正解",
    ar: "صحيح",          ru: "Верно",
  },
  "answer.tier.2.label": {
    en: "Acceptable",    nl: "Acceptabel",      fr: "Acceptable",
    de: "Akzeptabel",    es: "Aceptable",       it: "Accettabile",
    pt: "Aceitável",     zh: "可以接受",          ja: "許容",
    ar: "مقبول",         ru: "Приемлемо",
  },
  "answer.tier.3.label": {
    en: "Incorrect",     nl: "Onjuist",         fr: "Incorrect",
    de: "Falsch",        es: "Incorrecto",      it: "Scorretto",
    pt: "Incorreto",     zh: "不正确",            ja: "不正解",
    ar: "غير صحيح",      ru: "Неверно",
  },

  // ── Demographic bracket labels ─────────────────────────────────────────────
  "demographic.common.label": {
    en: "General",       nl: "Algemeen",        fr: "Général",
    de: "Allgemein",     es: "General",         it: "Generale",
    pt: "Geral",         zh: "通用",             ja: "一般",
    ar: "عام",           ru: "Общее",
  },
  "demographic.men_19_30.label": {
    en: "Men 19–30",     nl: "Mannen 19–30",    fr: "Hommes 19–30",
    de: "Männer 19–30",  es: "Hombres 19–30",   it: "Uomini 19–30",
    pt: "Homens 19–30",  zh: "男性 19–30岁",     ja: "男性 19〜30歳",
    ar: "رجال 19–30",    ru: "Мужчины 19–30",
  },
  "demographic.women_19_30.label": {
    en: "Women 19–30",   nl: "Vrouwen 19–30",   fr: "Femmes 19–30",
    de: "Frauen 19–30",  es: "Mujeres 19–30",   it: "Donne 19–30",
    pt: "Mulheres 19–30",zh: "女性 19–30岁",     ja: "女性 19〜30歳",
    ar: "نساء 19–30",    ru: "Женщины 19–30",
  },
  "demographic.men_30_50.label": {
    en: "Men 30–50",     nl: "Mannen 30–50",    fr: "Hommes 30–50",
    de: "Männer 30–50",  es: "Hombres 30–50",   it: "Uomini 30–50",
    pt: "Homens 30–50",  zh: "男性 30–50岁",     ja: "男性 30〜50歳",
    ar: "رجال 30–50",    ru: "Мужчины 30–50",
  },
  "demographic.women_30_50.label": {
    en: "Women 30–50",   nl: "Vrouwen 30–50",   fr: "Femmes 30–50",
    de: "Frauen 30–50",  es: "Mujeres 30–50",   it: "Donne 30–50",
    pt: "Mulheres 30–50",zh: "女性 30–50岁",     ja: "女性 30〜50歳",
    ar: "نساء 30–50",    ru: "Женщины 30–50",
  },
  "demographic.men_50plus.label": {
    en: "Men 50+",       nl: "Mannen 50+",      fr: "Hommes 50+",
    de: "Männer 50+",    es: "Hombres 50+",     it: "Uomini 50+",
    pt: "Homens 50+",    zh: "男性 50岁以上",    ja: "男性 50歳以上",
    ar: "رجال 50+",      ru: "Мужчины 50+",
  },
  "demographic.women_50plus.label": {
    en: "Women 50+",     nl: "Vrouwen 50+",     fr: "Femmes 50+",
    de: "Frauen 50+",    es: "Mujeres 50+",     it: "Donne 50+",
    pt: "Mulheres 50+",  zh: "女性 50岁以上",    ja: "女性 50歳以上",
    ar: "نساء 50+",      ru: "Женщины 50+",
  },

  // ── Content coverage status labels ─────────────────────────────────────────
  "coverage.draft.label": {
    en: "Draft",         nl: "Concept",         fr: "Brouillon",
    de: "Entwurf",       es: "Borrador",        it: "Bozza",
    pt: "Rascunho",      zh: "草稿",             ja: "下書き",
    ar: "مسودة",         ru: "Черновик",
  },
  "coverage.active.label": {
    en: "Active",        nl: "Actief",          fr: "Actif",
    de: "Aktiv",         es: "Activo",          it: "Attivo",
    pt: "Ativo",         zh: "活跃",             ja: "アクティブ",
    ar: "نشط",           ru: "Активно",
  },
  "coverage.complete.label": {
    en: "Complete",      nl: "Volledig",        fr: "Complet",
    de: "Abgeschlossen", es: "Completo",        it: "Completo",
    pt: "Completo",      zh: "完成",             ja: "完了",
    ar: "مكتمل",         ru: "Завершено",
  },
};

const FLAG_FORCE = process.argv.includes("--force");

async function seedTranslations() {
  console.log("Seeding translations…");

  if (FLAG_FORCE) {
    await db.execute(sql`TRUNCATE TABLE translations RESTART IDENTITY CASCADE`);
    console.log("  --force: translations table cleared for reseed");
  } else {
    console.log("  Upserting — new keys inserted, existing rows preserved (use --force to reseed all).");
  }

  const rows: TranslationRow[] = [];

  // ── Legacy UI keys: EN / NL / FR only ─────────────────────────────────────
  const legacyLanguages: Array<{ code: string; formality: string; rtl: boolean }> = [
    { code: "en", formality: "high", rtl: false },
    { code: "nl", formality: "high", rtl: false },
    { code: "fr", formality: "high", rtl: false },
  ];

  for (const lang of legacyLanguages) {
    for (const [key, values] of Object.entries(UI_KEYS)) {
      const value = values[lang.code as keyof typeof values];
      if (!value) continue;
      rows.push({
        language_code:      lang.code,
        formality_register: lang.formality,
        rtl_flag:           lang.rtl,
        key,
        value,
      });
    }
  }

  // ── Social class keys: all 11 locales ─────────────────────────────────────
  const allLocales: Array<{ code: keyof AllLocales; formality: string; rtl: boolean }> = [
    { code: "en", formality: "high",   rtl: false },
    { code: "nl", formality: "high",   rtl: false },
    { code: "fr", formality: "high",   rtl: false },
    { code: "de", formality: "high",   rtl: false },
    { code: "es", formality: "medium", rtl: false },
    { code: "it", formality: "medium", rtl: false },
    { code: "pt", formality: "medium", rtl: false },
    { code: "zh", formality: "medium", rtl: false },
    { code: "ja", formality: "high",   rtl: false },
    { code: "ar", formality: "high",   rtl: true  },
    { code: "ru", formality: "medium", rtl: false },
  ];

  for (const lang of allLocales) {
    for (const [key, values] of Object.entries(SOCIAL_CLASS_KEYS)) {
      const value = values[lang.code];
      if (!value) continue;
      rows.push({
        language_code:      lang.code,
        formality_register: lang.formality,
        rtl_flag:           lang.rtl,
        key,
        value,
      });
    }
  }

  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db
      .insert(translationsTable)
      .values(rows.slice(i, i + BATCH))
      .onConflictDoNothing();
    inserted += Math.min(BATCH, rows.length - i);
  }
  const legacyCount = legacyLanguages.length * Object.keys(UI_KEYS).length;
  const socialClassCount = allLocales.length * Object.keys(SOCIAL_CLASS_KEYS).length;
  console.log(`  ${inserted} rows processed (${rows.length} total built, conflicts skipped)`);
  console.log(`    Legacy UI keys: ${legacyCount} (3 locales × ${Object.keys(UI_KEYS).length} keys)`);
  console.log(`    Social class keys: ${socialClassCount} (11 locales × ${Object.keys(SOCIAL_CLASS_KEYS).length} keys)`);
  console.log("Translation seed complete.");
  process.exit(0);
}

seedTranslations().catch((err) => {
  console.error("Translation seed failed:", err);
  process.exit(1);
});
