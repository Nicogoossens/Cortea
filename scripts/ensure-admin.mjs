#!/usr/bin/env node
/**
 * Ensures the designated admin account (nico.goossens.01@gmail.com) exists
 * in the database with is_admin = true, subscription_tier = 'ambassador',
 * email_verified = true, and password "Start123" (bcrypt).
 *
 * Safe to run multiple times (idempotent).
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Resolve pg through the @workspace/db package so the path is stable across
// pg version bumps and pnpm store layout changes.
const dbPkgDir = path.resolve(__dirname, "../lib/db");
const pg = require(path.resolve(dbPkgDir, "node_modules/pg"));
const { Pool } = pg;

// Resolve bcryptjs through the api-server package
const apiServerDir = path.resolve(__dirname, "../artifacts/api-server");
const bcrypt = require(path.resolve(apiServerDir, "node_modules/bcryptjs"));

const ADMIN_EMAIL = "nico.goossens.01@gmail.com";
const ADMIN_PASSWORD = "Start123";
const ADMIN_FULL_NAME = "Nico Goossens";
const BCRYPT_ROUNDS = 12;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log(`  Hashing admin password (rounds=${BCRYPT_ROUNDS})…`);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    const existing = await client.query(
      "SELECT id, is_admin, subscription_tier, email_verified, password_hash FROM users WHERE email = $1 LIMIT 1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      await client.query(
        `UPDATE users
         SET is_admin = true,
             subscription_tier = 'ambassador',
             email_verified = true,
             password_hash = $1
         WHERE email = $2`,
        [passwordHash, ADMIN_EMAIL]
      );
      console.log(`  Admin account ${ADMIN_EMAIL} updated (id=${user.id}): is_admin=true, email_verified=true, password=[set].`);
    } else {
      // Create full account — admin can log in immediately with password
      const placeholderId = "user_" + Array.from(
        { length: 16 },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join("");

      await client.query(
        `INSERT INTO users (id, email, full_name, is_admin, subscription_tier, email_verified, password_hash, language_code, onboarding_completed)
         VALUES ($1, $2, $3, true, 'ambassador', true, $4, 'nl', false)`,
        [placeholderId, ADMIN_EMAIL, ADMIN_FULL_NAME, passwordHash]
      );
      console.log(`  Admin account created for ${ADMIN_EMAIL} (id=${placeholderId}) with password=[set].`);
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
