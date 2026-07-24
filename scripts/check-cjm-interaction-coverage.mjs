#!/usr/bin/env node
/**
 * CJM interaction-coverage gate — FAIL when a screen wires a stateful
 * commit-pending control (`data-studio-wishlist-id={IDENT}` and friends)
 * whose identifier is never referenced anywhere under `playback/`.
 *
 * Born from PP-45/PP-47 (docs/product/PAINPOINTS.md): PDP's wishlist heart
 * shipped with the pending/pulse IxD but no built-in CJM script ever clicked
 * it — the `all-cjms` compatibility suite only checks that scripted clicks
 * succeed, so an *omitted* click produces zero diagnostics and stays green
 * forever. This gate closes that one specific blind spot at build time:
 * static source-level coverage, not runtime IxD verification (that would
 * need real engine instrumentation — see PP-47's "architecture-sized" note).
 *
 * Deliberately narrow (v1): only checks `data-studio-wishlist-id` — the
 * exact control shape that bit us (optimistic-flip + held-open-commit).
 * Extend MARKER_ATTRS below if another stateful-commit control class shows
 * the same risk (e.g. a future checkbox/toggle with its own delayed commit).
 *
 * Run: node scripts/check-cjm-interaction-coverage.mjs
 * Wire: npm run check:cjm-coverage (via npm test)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** data-* attributes that mark a stateful commit-pending control. */
const MARKER_ATTRS = ["data-studio-wishlist-id"];

const SCREENS_DIR = path.join(ROOT, "src", "projects", "boots-pharmacy", "screens");
const PLAYBACK_DIR = path.join(ROOT, "src", "projects", "boots-pharmacy", "playback");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "__tests__") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(ent.name)) out.push(full);
  }
  return out;
}

/** Extract the base identifier from `{IDENT}` or `{IDENT(args)}`. */
function baseIdentifier(expr) {
  const match = expr.trim().match(/^([A-Za-z_$][\w$]*)/);
  return match ? match[1] : null;
}

const screenFiles = walk(SCREENS_DIR);
const playbackFiles = walk(PLAYBACK_DIR);
const playbackSource = playbackFiles
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

const offenders = [];

for (const file of screenFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");

  for (const attr of MARKER_ATTRS) {
    const re = new RegExp(`${attr}=\\{([^}]+)\\}`, "g");
    let m;
    while ((m = re.exec(text))) {
      const ident = baseIdentifier(m[1]);
      if (!ident) continue;
      const covered = new RegExp(`\\b${ident}\\b`).test(playbackSource);
      if (!covered) {
        offenders.push({ rel, attr, ident });
      }
    }
  }
}

if (offenders.length) {
  console.error("[check-cjm-interaction-coverage] FAIL — uncovered stateful control(s):");
  for (const o of offenders) {
    console.error(
      `  ${o.rel}: ${o.attr}={${o.ident}} — "${o.ident}" never referenced under src/projects/boots-pharmacy/playback/`
    );
  }
  console.error(
    "Either wire a scripted click for this control into a playback script (traditional.ts / agentic scripts), " +
      "or if it's intentionally never scripted, note why inline and extend this gate's allowlist."
  );
  process.exit(1);
}

console.log(
  `[check-cjm-interaction-coverage] OK — ${screenFiles.length} screen files scanned, all stateful commit controls have script coverage`
);
process.exit(0);
