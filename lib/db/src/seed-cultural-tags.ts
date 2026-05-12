/**
 * Seed cultural_tags + cultural_tag_matrix from Google Drive world-v2 CSV.
 *
 * Bron: cortea-tags-master-world-v2.csv (Drive file ID 1gkUC_xHyBTkNp74gEdaBPSiX8RneyY4F)
 * 199 landen · ~293.000 rijen · 1.415 canonieke tags
 *
 * Gebruik:
 *   pnpm --filter @workspace/db seed-cultural-tags
 *
 * Vereisten:
 *   - Tabellen cultural_tags + cultural_tag_matrix bestaan (migrate-cultural-tags)
 *   - GOOGLE_DRIVE_API_KEY of Replit google-drive integratie geconfigureerd
 *   - DATABASE_URL of PROD_DATABASE_URL gezet
 *
 * Gedrag:
 *   - Idempotent: heruitvoerbaar zonder dataverlies
 *   - Upsert naar cultural_tags (tag_id, tag_scope)
 *   - Upsert naar cultural_tag_matrix (alle kolommen behalve reviewed_at + needs_review)
 *   - reviewed_at en needs_review worden NOOIT overschreven (handmatige reviews bewaard)
 *   - Voortgang gelogd elke 50 batches; eindtelling na afloop
 *
 * TODO (Task #392 stap 5 — nog te implementeren):
 *   Implementeer de daadwerkelijke download + CSV-parse + DB-upsert hieronder.
 *   Zie .local/tasks/cultural-tag-matrix.md §stap-5 voor de volledige specificatie.
 */

// Placeholder — implementatie volgt in task #392 stap 5
console.error(
  "seed-cultural-tags is nog niet geïmplementeerd.\n" +
  "Zie .local/tasks/cultural-tag-matrix.md §stap-5 voor de specificatie.\n" +
  "Vereiste: migrate-cultural-tags is al uitgevoerd (tabellen bestaan).",
);
process.exit(1);
