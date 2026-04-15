import { db } from "./index.js";
import { translationsTable } from "./schema/index.js";
import { sql } from "drizzle-orm";

type TranslationRow = Omit<typeof translationsTable.$inferInsert, "id">;

const UI_KEYS: Record<string, { en: string; nl: string; fr: string }> = {
  "app.name":                    { en: "SOWISO",                              nl: "SOWISO",                               fr: "SOWISO" },
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

const FLAG_FORCE = process.argv.includes("--force");

async function seedTranslations() {
  console.log("Seeding translations…");

  if (!FLAG_FORCE) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(translationsTable);
    if (count > 0) {
      console.log(`  Translations already have ${count} rows — skipping (use --force to reseed).`);
      process.exit(0);
    }
  } else {
    await db.execute(sql`TRUNCATE TABLE translations RESTART IDENTITY CASCADE`);
    console.log("  --force: translations table cleared for reseed");
  }

  const rows: TranslationRow[] = [];
  const languages: Array<{ code: string; formality: string; rtl: boolean }> = [
    { code: "en", formality: "high",   rtl: false },
    { code: "nl", formality: "high",   rtl: false },
    { code: "fr", formality: "high",   rtl: false },
  ];

  for (const lang of languages) {
    for (const [key, values] of Object.entries(UI_KEYS)) {
      const value = values[lang.code as keyof typeof values];
      if (!value) continue;
      rows.push({
        language_code:     lang.code,
        formality_register: lang.formality,
        rtl_flag:          lang.rtl,
        key,
        value,
      });
    }
  }

  await db.insert(translationsTable).values(rows);
  console.log(`  ${rows.length} translation rows inserted (${languages.length} languages × ${Object.keys(UI_KEYS).length} keys)`);
  console.log("Translation seed complete.");
  process.exit(0);
}

seedTranslations().catch((err) => {
  console.error("Translation seed failed:", err);
  process.exit(1);
});
