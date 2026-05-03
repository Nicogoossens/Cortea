#!/usr/bin/env node
import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "src/locales");
const dest = resolve(root, "public/locales");

if (!existsSync(src)) {
  console.error(`[sync-locales] Source directory not found: ${src}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });

console.log(`[sync-locales] Synced ${src} -> ${dest}`);
