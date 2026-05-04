#!/usr/bin/env node
/**
 * SOWISO LTQ All-Languages Orchestrator
 *
 * Spawns translate-learning-track-questions.mjs for each of the 9 target
 * languages (nl fr de es pt it ar ja zh), optionally in parallel groups.
 * The per-lang worker is idempotent — if nl is already fully translated it
 * completes immediately, making it safe to include in every admin-triggered run.
 *
 * Usage:
 *   node scripts/translate-learning-track-all-langs.mjs [options]
 *
 * Options:
 *   --parallel <N>       Run N languages simultaneously (default: 1 = sequential)
 *   --langs <a,b,c>      Comma-separated list of language codes to run
 *                        (default: nl,fr,de,es,pt,it,ar,ja,zh)
 *   --region <AE|BE>     Pass-through filter to per-lang worker
 *   --register <r>       Pass-through filter to per-lang worker
 *   --limit <N>          Pass-through limit per language
 *   --dry-run            Pass-through dry-run flag
 *   --no-quality         Pass-through flag to skip quality evaluation
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const flagStr  = (n) => { const i = args.indexOf(n); return i !== -1 && args[i+1] ? args[i+1] : null; };
const flagBool = (n) => args.includes(n);

const FLAG_PARALLEL  = parseInt(flagStr("--parallel") ?? "1", 10);
const FLAG_LANGS     = flagStr("--langs");
const FLAG_REGION    = flagStr("--region");
const FLAG_REGISTER  = flagStr("--register");
const FLAG_LIMIT     = flagStr("--limit");
const FLAG_DRY       = flagBool("--dry-run");
const FLAG_NO_QUAL   = flagBool("--no-quality");

const ALL_LANGS = ["nl", "fr", "de", "es", "pt", "it", "ar", "ja", "zh"];
const TARGET_LANGS = FLAG_LANGS ? FLAG_LANGS.split(",").map(l => l.trim()) : ALL_LANGS;

// Build passthrough args for each child process
function buildChildArgs(lang) {
  const childArgs = ["scripts/translate-learning-track-questions.mjs", "--lang", lang];
  if (FLAG_REGION)   childArgs.push("--region",   FLAG_REGION);
  if (FLAG_REGISTER) childArgs.push("--register", FLAG_REGISTER);
  if (FLAG_LIMIT)    childArgs.push("--limit",    FLAG_LIMIT);
  if (FLAG_DRY)      childArgs.push("--dry-run");
  if (FLAG_NO_QUAL)  childArgs.push("--no-quality");
  return childArgs;
}

// Run one language — returns { lang, code, duration }
function runLang(lang) {
  return new Promise((resolve) => {
    const started = Date.now();
    const childArgs = buildChildArgs(lang);

    console.log(`  [${lang.toUpperCase()}] Starting…`);

    const child = spawn("node", childArgs, {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      const duration = Math.round((Date.now() - started) / 1000);
      const status = code === 0 ? "✓ done" : `✗ exit ${code}`;
      console.log(`  [${lang.toUpperCase()}] ${status}  (${duration}s)`);
      resolve({ lang, code, duration });
    });

    child.on("error", (err) => {
      console.error(`  [${lang.toUpperCase()}] spawn error: ${err.message}`);
      resolve({ lang, code: 1, duration: 0 });
    });
  });
}

// Run langs in groups of size N (parallel within each group)
async function runInGroups(langs, groupSize) {
  const results = [];
  for (let i = 0; i < langs.length; i += groupSize) {
    const group = langs.slice(i, i + groupSize);
    console.log(`\nGroup [${group.join(", ")}] — running ${group.length} in parallel…`);
    const groupResults = await Promise.all(group.map(runLang));
    results.push(...groupResults);
  }
  return results;
}

async function main() {
  const globalStart = Date.now();

  console.log("═".repeat(70));
  console.log("LTQ All-Languages Orchestrator");
  console.log(`Target languages : ${TARGET_LANGS.join(", ")}`);
  console.log(`Parallel workers : ${FLAG_PARALLEL}`);
  if (FLAG_REGION)   console.log(`Region filter    : ${FLAG_REGION}`);
  if (FLAG_REGISTER) console.log(`Register filter  : ${FLAG_REGISTER}`);
  if (FLAG_LIMIT)    console.log(`Limit per lang   : ${FLAG_LIMIT}`);
  if (FLAG_DRY)      console.log("Mode             : DRY-RUN");
  if (FLAG_NO_QUAL)  console.log("Quality check    : DISABLED");
  console.log("═".repeat(70));

  const results = await runInGroups(TARGET_LANGS, Math.max(1, FLAG_PARALLEL));

  const totalSecs = Math.round((Date.now() - globalStart) / 1000);
  const ok  = results.filter(r => r.code === 0);
  const err = results.filter(r => r.code !== 0);

  console.log("\n" + "═".repeat(70));
  console.log("All languages complete");
  console.log(`Succeeded : ${ok.map(r => r.lang.toUpperCase()).join(", ") || "—"}`);
  if (err.length > 0) console.log(`Failed    : ${err.map(r => r.lang.toUpperCase()).join(", ")}`);
  console.log(`Total time: ${Math.floor(totalSecs / 60)}m ${totalSecs % 60}s`);
  console.log("═".repeat(70));

  process.exit(err.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Orchestrator fatal:", err.message);
  process.exit(1);
});
