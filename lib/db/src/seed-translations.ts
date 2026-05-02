/**
 * SEED: DB-backed legacy translations (all 9 locales)
 *
 * SCOPE: This seed manages a small set of legacy UI keys served via
 * GET /api/translations. It covers EN, NL, DE, FR, ES, IT, PT, AR, and JA.
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

type UILocales = { en: string; nl: string; de: string; fr: string; es: string; it: string; pt: string; ar: string; ja: string };

const UI_KEYS: Record<string, UILocales> = {
  "app.name": {
    en: "Cortéa",                          nl: "Cortéa",                          de: "Cortéa",
    fr: "Cortéa",                          es: "Cortéa",                          it: "Cortéa",
    pt: "Cortéa",                          ar: "Cortéa",                          ja: "Cortéa",
  },
  "app.tagline": {
    en: "The art of conduct",              nl: "De kunst van gedrag",             de: "Die Kunst des Benehmens",
    fr: "L'art de la conduite",            es: "El arte del comportamiento",      it: "L'arte del comportamento",
    pt: "A arte da conduta",               ar: "فن السلوك",                       ja: "振る舞いの芸術",
  },
  "app.established": {
    en: "Est. 2024",                       nl: "Opgericht 2024",                  de: "Gegr. 2024",
    fr: "Fondé en 2024",                   es: "Est. 2024",                       it: "Fond. 2024",
    pt: "Est. 2024",                       ar: "تأسست 2024",                      ja: "創業 2024",
  },

  "nav.dashboard": {
    en: "The Dashboard",                   nl: "Het Dashboard",                   de: "Das Dashboard",
    fr: "Le Tableau de Bord",              es: "El Panel",                        it: "Il Pannello",
    pt: "O Painel",                        ar: "لوحة التحكم",                     ja: "ダッシュボード",
  },
  "nav.atelier": {
    en: "The Atelier",                     nl: "Het Atelier",                     de: "Das Atelier",
    fr: "L'Atelier",                       es: "El Atelier",                      it: "L'Atelier",
    pt: "O Ateliê",                        ar: "الأتيليه",                        ja: "アトリエ",
  },
  "nav.counsel": {
    en: "The Counsel",                     nl: "De Raadgeving",                   de: "Der Rat",
    fr: "Le Conseil",                      es: "El Consejo",                      it: "Il Consiglio",
    pt: "O Conselho",                      ar: "المشورة",                         ja: "カウンセル",
  },
  "nav.compass": {
    en: "The Compass",                     nl: "Het Kompas",                      de: "Der Kompass",
    fr: "La Boussole",                     es: "La Brújula",                      it: "La Bussola",
    pt: "A Bússola",                       ar: "البوصلة",                         ja: "コンパス",
  },
  "nav.profile": {
    en: "Profile",                         nl: "Profiel",                         de: "Profil",
    fr: "Profil",                          es: "Perfil",                          it: "Profilo",
    pt: "Perfil",                          ar: "الملف الشخصي",                    ja: "プロフィール",
  },

  "home.greeting": {
    en: "Good day, distinguished guest.",  nl: "Goedendag, gewaardeerde gast.",   de: "Guten Tag, geschätzter Gast.",
    fr: "Bonjour, distingué invité.",      es: "Buenos días, distinguido invitado.", it: "Buongiorno, illustre ospite.",
    pt: "Bom dia, distinto convidado.",    ar: "يوم سعيد، ضيفنا الكريم.",         ja: "ごきげんよう、ご来賓の方。",
  },
  "home.standing": {
    en: "Your standing",                   nl: "Uw standing",                     de: "Ihr Standing",
    fr: "Votre niveau",                    es: "Su posición",                     it: "Il vostro livello",
    pt: "Sua posição",                     ar: "مستواك",                          ja: "あなたの地位",
  },
  "home.enter_atelier": {
    en: "Enter The Atelier",               nl: "Betreed Het Atelier",             de: "Das Atelier betreten",
    fr: "Entrer dans L'Atelier",           es: "Entrar al Atelier",               it: "Entra nell'Atelier",
    pt: "Entrar no Ateliê",                ar: "ادخل الأتيليه",                   ja: "アトリエへ入る",
  },
  "home.seek_counsel": {
    en: "Seek Counsel",                    nl: "Zoek Advies",                     de: "Rat suchen",
    fr: "Chercher Conseil",                es: "Buscar Consejo",                  it: "Cercare Consiglio",
    pt: "Buscar Conselho",                 ar: "اطلب المشورة",                    ja: "助言を求める",
  },
  "home.cultural_compass": {
    en: "Cultural Compass",                nl: "Cultureel Kompas",                de: "Kultureller Kompass",
    fr: "Boussole Culturelle",             es: "Brújula Cultural",                it: "Bussola Culturale",
    pt: "Bússola Cultural",                ar: "البوصلة الثقافية",                ja: "文化コンパス",
  },
  "home.continue_studies": {
    en: "Continue your studies",           nl: "Zet uw studies voort",            de: "Studien fortsetzen",
    fr: "Continuer vos études",            es: "Continuar sus estudios",          it: "Continua i tuoi studi",
    pt: "Continuar seus estudos",          ar: "تابع دراستك",                     ja: "学習を続ける",
  },

  "atelier.title": {
    en: "The Atelier",                     nl: "Het Atelier",                     de: "Das Atelier",
    fr: "L'Atelier",                       es: "El Atelier",                      it: "L'Atelier",
    pt: "O Ateliê",                        ar: "الأتيليه",                        ja: "アトリエ",
  },
  "atelier.subtitle": {
    en: "Refine your instincts through practice. Select a scenario below to test your judgement in complex social and cultural situations.",
    nl: "Verfijn uw instincten door oefening. Selecteer een scenario om uw oordeel te testen in complexe sociale en culturele situaties.",
    de: "Verfeinern Sie Ihre Instinkte durch Übung. Wählen Sie ein Szenario, um Ihr Urteil in komplexen sozialen und kulturellen Situationen zu testen.",
    fr: "Affinez vos instincts par la pratique. Sélectionnez un scénario pour tester votre jugement.",
    es: "Afine sus instintos a través de la práctica. Seleccione un escenario para poner a prueba su juicio en situaciones sociales y culturales complejas.",
    it: "Affinate i vostri istinti attraverso la pratica. Selezionate uno scenario per testare il vostro giudizio in situazioni sociali e culturali complesse.",
    pt: "Refine seus instintos pela prática. Selecione um cenário para testar seu julgamento em situações sociais e culturais complexas.",
    ar: "صقل غرائزك من خلال الممارسة. اختر سيناريو لاختبار حكمك في مواقف اجتماعية وثقافية معقدة.",
    ja: "実践を通じて直感を磨きましょう。複雑な社会的・文化的状況での判断力を試すシナリオを選んでください。",
  },
  "atelier.pillar": {
    en: "Pillar",                          nl: "Zuil",                            de: "Säule",
    fr: "Pilier",                          es: "Pilar",                           it: "Pilastro",
    pt: "Pilar",                           ar: "الركيزة",                         ja: "柱",
  },
  "atelier.difficulty": {
    en: "Difficulty",                      nl: "Moeilijkheid",                    de: "Schwierigkeit",
    fr: "Difficulté",                      es: "Dificultad",                      it: "Difficoltà",
    pt: "Dificuldade",                     ar: "الصعوبة",                         ja: "難易度",
  },
  "atelier.duration": {
    en: "min",                             nl: "min",                             de: "Min.",
    fr: "min",                             es: "min",                             it: "min",
    pt: "min",                             ar: "دقيقة",                           ja: "分",
  },
  "atelier.empty": {
    en: "No scenarios available.",         nl: "Geen scenario's beschikbaar.",    de: "Keine Szenarien verfügbar.",
    fr: "Aucun scénario disponible.",      es: "No hay escenarios disponibles.",  it: "Nessuno scenario disponibile.",
    pt: "Nenhum cenário disponível.",      ar: "لا توجد سيناريوهات متاحة.",       ja: "シナリオはありません。",
  },
  "atelier.region": {
    en: "Region",                          nl: "Regio",                           de: "Region",
    fr: "Région",                          es: "Región",                          it: "Regione",
    pt: "Região",                          ar: "المنطقة",                         ja: "地域",
  },

  "counsel.title": {
    en: "The Counsel",                     nl: "De Raadgeving",                   de: "Der Rat",
    fr: "Le Conseil",                      es: "El Consejo",                      it: "Il Consiglio",
    pt: "O Conselho",                      ar: "المشورة",                         ja: "カウンセル",
  },
  "counsel.subtitle": {
    en: "Thirty seconds of discreet guidance. Describe your situation and receive an immediate, precise response.",
    nl: "Dertig seconden discrete begeleiding. Beschrijf uw situatie en ontvang een onmiddellijk, precies antwoord.",
    de: "Dreißig Sekunden diskrete Beratung. Beschreiben Sie Ihre Situation und erhalten Sie eine sofortige, präzise Antwort.",
    fr: "Trente secondes de guidance discrète. Décrivez votre situation et recevez une réponse immédiate.",
    es: "Treinta segundos de orientación discreta. Describa su situación y reciba una respuesta inmediata y precisa.",
    it: "Trenta secondi di guida discreta. Descrivete la vostra situazione e ricevete una risposta immediata e precisa.",
    pt: "Trinta segundos de orientação discreta. Descreva sua situação e receba uma resposta imediata e precisa.",
    ar: "ثلاثون ثانية من التوجيه الهادئ. صف موقفك وتلقَّ إجابة فورية ودقيقة.",
    ja: "30秒の控えめなアドバイス。状況をお伝えいただければ、即座に的確なご回答を差し上げます。",
  },
  "counsel.placeholder": {
    en: "Describe the situation requiring counsel…",    nl: "Beschrijf de situatie die begeleiding vereist…",
    de: "Beschreiben Sie die Situation, die Beratung erfordert…",
    fr: "Décrivez la situation nécessitant un conseil…",
    es: "Describa la situación que requiere consejo…",
    it: "Descrivete la situazione che richiede un consiglio…",
    pt: "Descreva a situação que requer conselho…",
    ar: "صف الموقف الذي يحتاج إلى مشورة…",
    ja: "助言が必要な状況をお伝えください…",
  },
  "counsel.request": {
    en: "Request Counsel",                 nl: "Vraag Advies",                    de: "Rat anfordern",
    fr: "Demander Conseil",                es: "Solicitar Consejo",               it: "Richiedere Consiglio",
    pt: "Solicitar Conselho",              ar: "اطلب المشورة",                    ja: "助言を求める",
  },
  "counsel.guidance": {
    en: "The Mentor's Response",           nl: "Het Antwoord van de Mentor",      de: "Die Antwort des Mentors",
    fr: "La Réponse du Mentor",            es: "La Respuesta del Mentor",         it: "La Risposta del Mentore",
    pt: "A Resposta do Mentor",            ar: "رد المرشد",                       ja: "メンターの回答",
  },

  "compass.title": {
    en: "The Cultural Compass",            nl: "Het Culturele Kompas",            de: "Der Kulturelle Kompass",
    fr: "La Boussole Culturelle",          es: "La Brújula Cultural",             it: "La Bussola Culturale",
    pt: "A Bússola Cultural",              ar: "البوصلة الثقافية",                ja: "文化コンパス",
  },
  "compass.subtitle": {
    en: "Navigate the customs of the world with precision and confidence.",
    nl: "Navigeer de gebruiken van de wereld met precisie en vertrouwen.",
    de: "Navigieren Sie die Bräuche der Welt mit Präzision und Zuversicht.",
    fr: "Naviguez les coutumes du monde avec précision et confiance.",
    es: "Navegue las costumbres del mundo con precisión y confianza.",
    it: "Navigate le usanze del mondo con precisione e sicurezza.",
    pt: "Navegue pelos costumes do mundo com precisão e confiança.",
    ar: "تنقل بين عادات العالم بدقة وثقة.",
    ja: "世界の慣習を精確かつ自信を持って探求しましょう。",
  },
  "compass.explore": {
    en: "Explore",                         nl: "Verkennen",                       de: "Erkunden",
    fr: "Explorer",                        es: "Explorar",                        it: "Esplora",
    pt: "Explorar",                        ar: "استكشف",                          ja: "探索する",
  },
  "compass.core_value": {
    en: "Core Value",                      nl: "Kernwaarde",                      de: "Grundwert",
    fr: "Valeur Fondamentale",             es: "Valor Fundamental",               it: "Valore Fondamentale",
    pt: "Valor Central",                   ar: "القيمة الجوهرية",                 ja: "中核的価値観",
  },
  "compass.taboo": {
    en: "Biggest Taboo",                   nl: "Grootste Taboe",                  de: "Größtes Tabu",
    fr: "Grand Tabou",                     es: "Mayor Tabú",                      it: "Maggiore Tabù",
    pt: "Maior Tabu",                      ar: "أكبر المحظورات",                  ja: "最大のタブー",
  },
  "compass.back": {
    en: "Back to Compass",                 nl: "Terug naar Kompas",               de: "Zurück zum Kompass",
    fr: "Retour à la Boussole",            es: "Volver a la Brújula",             it: "Torna alla Bussola",
    pt: "Voltar à Bússola",                ar: "العودة إلى البوصلة",              ja: "コンパスに戻る",
  },
  "compass.dos": {
    en: "Do",                              nl: "Doen",                            de: "Empfohlen",
    fr: "À faire",                         es: "Recomendado",                     it: "Da fare",
    pt: "Recomendado",                     ar: "المستحسن",                        ja: "すべきこと",
  },
  "compass.donts": {
    en: "Avoid",                           nl: "Vermijden",                       de: "Vermeiden",
    fr: "À éviter",                        es: "Evitar",                          it: "Da evitare",
    pt: "Evitar",                          ar: "المحظور",                         ja: "避けること",
  },

  "profile.title": {
    en: "The Profile",                     nl: "Het Profiel",                     de: "Das Profil",
    fr: "Le Profil",                       es: "El Perfil",                       it: "Il Profilo",
    pt: "O Perfil",                        ar: "الملف الشخصي",                    ja: "プロフィール",
  },
  "profile.noble_standing": {
    en: "Noble Standing",                  nl: "Edele Standing",                  de: "Edles Standing",
    fr: "Noblesse de Rang",                es: "Posición Noble",                  it: "Rango Nobile",
    pt: "Posição Nobre",                   ar: "المكانة النبيلة",                 ja: "高貴な地位",
  },
  "profile.domain_mastery": {
    en: "Domain Mastery",                  nl: "Domeinbeheersing",                de: "Domänenbeherrschung",
    fr: "Maîtrise des Domaines",           es: "Dominio del Campo",               it: "Padronanza dei Domini",
    pt: "Domínio das Áreas",               ar: "إتقان المجال",                    ja: "分野の習熟",
  },
  "profile.domain_subtitle": {
    en: "Your titles across the five pillars of refinement.",
    nl: "Uw titels over de vijf zuilen van verfijning.",
    de: "Ihre Titel in den fünf Säulen der Verfeinerung.",
    fr: "Vos titres dans les cinq piliers du raffinement.",
    es: "Sus títulos en los cinco pilares del refinamiento.",
    it: "I vostri titoli nei cinque pilastri del raffinamento.",
    pt: "Seus títulos nos cinco pilares do refinamento.",
    ar: "ألقابك عبر الركائز الخمس للرقي.",
    ja: "洗練の五つの柱におけるあなたの称号。",
  },
  "profile.recent_log": {
    en: "Recent Log",                      nl: "Recente Log",                     de: "Neueste Einträge",
    fr: "Historique Récent",               es: "Registro Reciente",               it: "Registro Recente",
    pt: "Registro Recente",                ar: "السجل الأخير",                    ja: "最近の記録",
  },
  "profile.no_history": {
    en: "Your ledger is currently empty.",     nl: "Uw register is momenteel leeg.",
    de: "Ihr Hauptbuch ist derzeit leer.",
    fr: "Votre registre est actuellement vide.",
    es: "Su registro está actualmente vacío.",
    it: "Il vostro registro è attualmente vuoto.",
    pt: "Seu registro está atualmente vazio.",
    ar: "سجلك فارغ حاليًا.",
    ja: "台帳は現在空です。",
  },
  "profile.visit_atelier": {
    en: "Visit The Atelier to begin your studies.",
    nl: "Bezoek Het Atelier om uw studies te beginnen.",
    de: "Besuchen Sie Das Atelier, um Ihre Studien zu beginnen.",
    fr: "Visitez L'Atelier pour commencer vos études.",
    es: "Visita El Atelier para comenzar tus estudios.",
    it: "Visitate L'Atelier per iniziare i vostri studi.",
    pt: "Visite O Ateliê para começar seus estudos.",
    ar: "زر الأتيليه لبدء دراستك.",
    ja: "アトリエを訪れて学習を始めましょう。",
  },
  "profile.ambition": {
    en: "Ambition",                        nl: "Ambitie",                         de: "Ambition",
    fr: "Ambition",                        es: "Ambición",                        it: "Ambizione",
    pt: "Ambição",                         ar: "الطموح",                          ja: "野心",
  },
  "profile.active_region": {
    en: "Active Region",                   nl: "Actieve Regio",                   de: "Aktive Region",
    fr: "Région Active",                   es: "Región Activa",                   it: "Regione Attiva",
    pt: "Região Ativa",                    ar: "المنطقة النشطة",                  ja: "活動地域",
  },
  "profile.member_since": {
    en: "Member since",                    nl: "Lid sinds",                       de: "Mitglied seit",
    fr: "Membre depuis",                   es: "Miembro desde",                   it: "Membro dal",
    pt: "Membro desde",                    ar: "عضو منذ",                         ja: "会員開始日",
  },
  "profile.next_rank": {
    en: "to next rank",                    nl: "naar volgend rang",               de: "bis zum nächsten Rang",
    fr: "vers le prochain rang",           es: "al siguiente rango",              it: "al rango successivo",
    pt: "para o próximo nível",            ar: "للرتبة التالية",                  ja: "次のランクまで",
  },
  "profile.current_title": {
    en: "Current Title",                   nl: "Huidige Titel",                   de: "Aktueller Titel",
    fr: "Titre Actuel",                    es: "Título Actual",                   it: "Titolo Attuale",
    pt: "Título Atual",                    ar: "اللقب الحالي",                    ja: "現在の称号",
  },
  "profile.next": {
    en: "Next",                            nl: "Volgende",                        de: "Weiter",
    fr: "Suivant",                         es: "Siguiente",                       it: "Successivo",
    pt: "Próximo",                         ar: "التالي",                          ja: "次へ",
  },

  "scenario.return_atelier": {
    en: "Return to Atelier",               nl: "Terug naar Atelier",              de: "Zurück zum Atelier",
    fr: "Retour à l'Atelier",              es: "Volver al Atelier",               it: "Torna all'Atelier",
    pt: "Voltar ao Ateliê",                ar: "العودة إلى الأتيليه",             ja: "アトリエに戻る",
  },
  "scenario.pillar": {
    en: "Pillar",                          nl: "Zuil",                            de: "Säule",
    fr: "Pilier",                          es: "Pilar",                           it: "Pilastro",
    pt: "Pilar",                           ar: "الركيزة",                         ja: "柱",
  },
  "scenario.confirm": {
    en: "Confirm Decision",                nl: "Bevestig Beslissing",             de: "Entscheidung bestätigen",
    fr: "Confirmer la Décision",           es: "Confirmar Decisión",              it: "Conferma la Decisione",
    pt: "Confirmar Decisão",               ar: "تأكيد القرار",                    ja: "決断を確定する",
  },
  "scenario.submitting": {
    en: "Submitting…",                     nl: "Indienen…",                       de: "Einreichen…",
    fr: "Envoi en cours…",                 es: "Enviando…",                       it: "Invio in corso…",
    pt: "Enviando…",                       ar: "جارٍ الإرسال…",                   ja: "送信中…",
  },
  "scenario.mentor_counsel": {
    en: "The Mentor's Counsel",            nl: "De Raad van de Mentor",           de: "Der Rat des Mentors",
    fr: "Le Conseil du Mentor",            es: "El Consejo del Mentor",           it: "Il Consiglio del Mentore",
    pt: "O Conselho do Mentor",            ar: "مشورة المرشد",                    ja: "メンターの助言",
  },
  "scenario.impact": {
    en: "Impact",                          nl: "Impact",                          de: "Auswirkung",
    fr: "Impact",                          es: "Impacto",                         it: "Impatto",
    pt: "Impacto",                         ar: "التأثير",                         ja: "影響",
  },
  "scenario.promotion": {
    en: "Promotion",                       nl: "Promotie",                        de: "Beförderung",
    fr: "Promotion",                       es: "Promoción",                       it: "Promozione",
    pt: "Promoção",                        ar: "ترقية",                           ja: "昇進",
  },
  "scenario.elevated_to": {
    en: "Elevated to",                     nl: "Verheven tot",                    de: "Erhoben zu",
    fr: "Élevé au rang de",                es: "Ascendido a",                     it: "Elevato a",
    pt: "Elevado a",                       ar: "ارتقى إلى",                       ja: "に昇格",
  },
  "scenario.not_found": {
    en: "Scenario Not Found",              nl: "Scenario Niet Gevonden",          de: "Szenario Nicht Gefunden",
    fr: "Scénario Introuvable",            es: "Escenario No Encontrado",         it: "Scenario Non Trovato",
    pt: "Cenário Não Encontrado",          ar: "السيناريو غير موجود",             ja: "シナリオが見つかりません",
  },

  "common.loading": {
    en: "Loading…",                        nl: "Laden…",                          de: "Laden…",
    fr: "Chargement…",                     es: "Cargando…",                       it: "Caricamento…",
    pt: "Carregando…",                     ar: "جارٍ التحميل…",                   ja: "読み込み中…",
  },
  "common.error": {
    en: "Something went amiss.",           nl: "Er is iets misgegaan.",           de: "Etwas ist schiefgelaufen.",
    fr: "Une erreur s'est produite.",      es: "Algo salió mal.",                 it: "Qualcosa è andato storto.",
    pt: "Algo deu errado.",                ar: "حدث خطأ ما.",                     ja: "問題が発生しました。",
  },
  "common.not_found": {
    en: "Page Not Found",                  nl: "Pagina Niet Gevonden",            de: "Seite Nicht Gefunden",
    fr: "Page Introuvable",                es: "Página No Encontrada",            it: "Pagina Non Trovata",
    pt: "Página Não Encontrada",           ar: "الصفحة غير موجودة",               ja: "ページが見つかりません",
  },
  "common.return_home": {
    en: "Return Home",                     nl: "Terug naar Start",                de: "Zur Startseite",
    fr: "Retour à l'Accueil",              es: "Volver al Inicio",                it: "Torna alla Home",
    pt: "Voltar ao Início",                ar: "العودة إلى الرئيسية",             ja: "ホームに戻る",
  },

  "language.en": {
    en: "English",                         nl: "Engels",                          de: "Englisch",
    fr: "Anglais",                         es: "Inglés",                          it: "Inglese",
    pt: "Inglês",                          ar: "الإنجليزية",                      ja: "英語",
  },
  "language.nl": {
    en: "Dutch",                           nl: "Nederlands",                      de: "Niederländisch",
    fr: "Néerlandais",                     es: "Neerlandés",                      it: "Olandese",
    pt: "Neerlandês",                      ar: "الهولندية",                       ja: "オランダ語",
  },
  "language.fr": {
    en: "French",                          nl: "Frans",                           de: "Französisch",
    fr: "Français",                        es: "Francés",                         it: "Francese",
    pt: "Francês",                         ar: "الفرنسية",                        ja: "フランス語",
  },
  "language.select": {
    en: "Language",                        nl: "Taal",                            de: "Sprache",
    fr: "Langue",                          es: "Idioma",                          it: "Lingua",
    pt: "Idioma",                          ar: "اللغة",                           ja: "言語",
  },

  "level.the_aware": {
    en: "The Aware",                       nl: "De Bewuste",                      de: "Der Bewusste",
    fr: "L'Éveillé",                       es: "El Consciente",                   it: "Il Consapevole",
    pt: "O Consciente",                    ar: "الواعي",                          ja: "気づきの者",
  },
  "level.the_composed": {
    en: "The Composed",                    nl: "De Beheerste",                    de: "Der Gefasste",
    fr: "Le Serein",                       es: "El Sereno",                       it: "Il Composto",
    pt: "O Equilibrado",                   ar: "المتزن",                          ja: "落ち着きの者",
  },
  "level.the_refined": {
    en: "The Refined",                     nl: "De Verfijnde",                    de: "Der Verfeinerte",
    fr: "Le Raffiné",                      es: "El Refinado",                     it: "Il Raffinato",
    pt: "O Refinado",                      ar: "الراقي",                          ja: "洗練の者",
  },
  "level.the_distinguished": {
    en: "The Distinguished",               nl: "De Onderscheiden",                de: "Der Angesehene",
    fr: "Le Distingué",                    es: "El Distinguido",                  it: "Il Distinto",
    pt: "O Distinto",                      ar: "المتميز",                         ja: "卓越の者",
  },
  "level.the_sovereign": {
    en: "The Sovereign",                   nl: "De Soevereine",                   de: "Der Souveräne",
    fr: "Le Souverain",                    es: "El Soberano",                     it: "Il Sovrano",
    pt: "O Soberano",                      ar: "السيد المطلق",                    ja: "至高の者",
  },
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

  // ── Legacy UI keys: all 9 locales ─────────────────────────────────────────
  const legacyLanguages: Array<{ code: keyof UILocales; formality: string; rtl: boolean }> = [
    { code: "en", formality: "high",   rtl: false },
    { code: "nl", formality: "high",   rtl: false },
    { code: "de", formality: "high",   rtl: false },
    { code: "fr", formality: "high",   rtl: false },
    { code: "es", formality: "medium", rtl: false },
    { code: "it", formality: "medium", rtl: false },
    { code: "pt", formality: "medium", rtl: false },
    { code: "ar", formality: "high",   rtl: true  },
    { code: "ja", formality: "high",   rtl: false },
  ];

  for (const lang of legacyLanguages) {
    for (const [key, values] of Object.entries(UI_KEYS)) {
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
  console.log(`    Legacy UI keys: ${legacyCount} (9 locales × ${Object.keys(UI_KEYS).length} keys)`);
  console.log(`    Social class keys: ${socialClassCount} (11 locales × ${Object.keys(SOCIAL_CLASS_KEYS).length} keys)`);
  console.log("Translation seed complete.");
  process.exit(0);
}

seedTranslations().catch((err) => {
  console.error("Translation seed failed:", err);
  process.exit(1);
});
