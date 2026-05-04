/**
 * DB target resolution helper.
 *
 * Worker scripts call getDbUrl(target) to get the correct Postgres connection
 * string for the requested environment.
 *
 *   target = "dev"  → DATABASE_URL       (development database)
 *   target = "prod" → PROD_DATABASE_URL  (production database)
 *
 * Throws a clear error if the required env var is missing.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(new URL("../../lib/db/package.json", import.meta.url));
const { Pool } = _require("pg");

export function getDbUrl(target = "dev") {
  if (target === "prod") {
    if (!process.env.PROD_DATABASE_URL) {
      throw new Error(
        "PROD_DATABASE_URL is not set. " +
          "Add it as a secret in the Replit environment before running with --target prod.",
      );
    }
    return process.env.PROD_DATABASE_URL;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  return process.env.DATABASE_URL;
}

/**
 * Create a connected pg Pool for the given target environment.
 * Callers are responsible for calling pool.end() when done.
 */
export function getPgClient(target = "dev") {
  return new Pool({ connectionString: getDbUrl(target) });
}
