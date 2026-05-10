# lib/db

Shared Drizzle ORM schema, database connection, and seed scripts for Cortéa.

## Database connection

`src/index.ts` connects to `PROD_DATABASE_URL` when set, falling back to `DATABASE_URL` for local development. The API server always uses `PROD_DATABASE_URL` in production.

## Schema migrations

Drizzle migrations live in `drizzle/`. The `scripts/post-merge.sh` at the repo root applies all migration files to both the dev and production databases automatically after every task merge. To add a new column or table, create a new `.sql` file in `drizzle/` and update `drizzle/meta/_journal.json`.

## Seeding

`src/seed.ts` is the canonical seed entry point. It is called by `post-merge.sh` after every merge and seeds all supported locales. Individual seed scripts in `src/seed-*.ts` handle specific datasets (learning tracks, compass, cultural origins, etc.).

## Compass country import

The canonical method for importing Compass country data (culture protocols, compass scores, pillar scores) is the **Google Drive importer** in the admin panel → Compass tab → "Import from Drive". This replaces all previous manual `.mjs` import scripts. Do not create new standalone import scripts at the `lib/db/` root.
