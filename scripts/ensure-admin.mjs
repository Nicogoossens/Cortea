#!/usr/bin/env node
/**
 * Ensures the designated admin account (nico.goossens.01@gmail.com) exists
 * in the database with is_admin = true and subscription_tier = 'ambassador'.
 *
 * If the account already exists, it is updated in place.
 * If it does not yet exist, a placeholder row is created so that the first
 * login (via magic-link or SSO) immediately grants the correct permissions.
 *
 * Safe to run multiple times (idempotent).
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pgPath = path.resolve(__dirname, "../node_modules/.pnpm/pg@8.20.0/node_modules/pg");
const pg = require(pgPath);
const { Pool } = pg;

const ADMIN_EMAIL = "nico.goossens.01@gmail.com";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const existing = await client.query(
      "SELECT id, is_admin, subscription_tier FROM users WHERE email = $1 LIMIT 1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.is_admin && user.subscription_tier === "ambassador") {
        console.log(`  Admin account ${ADMIN_EMAIL} already correctly configured (id=${user.id}).`);
      } else {
        await client.query(
          "UPDATE users SET is_admin = true, subscription_tier = 'ambassador' WHERE email = $1",
          [ADMIN_EMAIL]
        );
        console.log(`  Admin account ${ADMIN_EMAIL} updated: is_admin=true, subscription_tier=ambassador.`);
      }
    } else {
      // Create placeholder: the real password/session is set on first login
      const placeholderId = "user_" + Array.from(
        { length: 16 },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join("");

      await client.query(
        `INSERT INTO users (id, email, full_name, is_admin, subscription_tier, email_verified, language_code, onboarding_completed)
         VALUES ($1, $2, $3, true, 'ambassador', false, 'nl', false)`,
        [placeholderId, ADMIN_EMAIL, "Nico Goossens"]
      );
      console.log(`  Admin placeholder created for ${ADMIN_EMAIL}. First login will activate the account.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ensure-admin failed:", err.message);
  process.exit(1);
});
