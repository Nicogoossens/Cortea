import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log("[migrate-0022] Adding explicit_language_choice column to users…");
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS explicit_language_choice boolean NOT NULL DEFAULT false
    `);
    await client.query(`
      COMMENT ON COLUMN users.explicit_language_choice IS
        'True when the user deliberately selected a language via the in-app switcher. When true, language_code is applied on new-device sign-in regardless of browser locale. False = registration default, browser locale wins on new devices.'
    `);
    console.log("[migrate-0022] Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("[migrate-0022] Failed:", err);
  process.exit(1);
});
