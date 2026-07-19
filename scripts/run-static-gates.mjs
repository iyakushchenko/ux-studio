/**
 * Run all hard static gates in parallel (fail-fast report).
 * Used by `npm run test:gates` / `npm test` — same scripts CI runs.
 *
 * Gates (do not remove): links, hygiene, felonies, parity-ratchets,
 * parity-proven, page-final-pass, theme-brand, version.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** [npmScriptLabel, relativeScriptPath] — label matches package.json check:* names. */
const GATES = [
  ["check:links", "scripts/check-text-link-contract.mjs"],
  ["check:hygiene", "scripts/check-file-hygiene.mjs"],
  ["check:felonies", "scripts/check-agent-felonies.mjs"],
  ["check:parity-ratchets", "scripts/check-parity-ratchets.mjs"],
  ["check:parity-proven", "scripts/check-parity-proven.mjs"],
  ["check:page-final-pass", "scripts/check-page-final-pass.mjs"],
  ["check:theme-brand", "scripts/check-theme-brand.mjs"],
  ["check:version", "scripts/check-release-version-changelog-sync.mjs"],
];

function runGate(label, relPath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, relPath)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let out = "";
    child.stdout?.on("data", (chunk) => {
      out += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      out += chunk;
    });
    child.on("close", (code) => {
      resolve({ label, code: code ?? 1, out });
    });
  });
}

const results = await Promise.all(
  GATES.map(([label, rel]) => runGate(label, rel))
);
let failed = 0;
for (const r of results) {
  if (r.code === 0) {
    process.stdout.write(`[test:gates] OK  ${r.label}\n`);
  } else {
    failed += 1;
    process.stderr.write(`[test:gates] FAIL ${r.label} (exit ${r.code})\n`);
    process.stderr.write(r.out);
    if (!r.out.endsWith("\n")) process.stderr.write("\n");
  }
}

if (failed > 0) {
  process.stderr.write(
    `\n[test:gates] ${failed}/${GATES.length} gate(s) failed — hard gates unchanged, only parallelized.\n`
  );
  process.exit(1);
}

process.stdout.write(`[test:gates] OK — ${GATES.length} gates (parallel)\n`);
