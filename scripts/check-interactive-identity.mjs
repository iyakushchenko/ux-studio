#!/usr/bin/env node
/**
 * Interactive-identity gate — FAIL when a JSX element with an `onClick`
 * handler carries no stable identity attribute of its own.
 *
 * Born from PP-49 (docs/product/PAINPOINTS.md): REC's capture logic
 * (`recordingCapture.ts`) silently drops any click whose target can't build
 * a usable selector chain — no event, no gap marker, nothing. LoginPopup's
 * "Forgot Password?" / "Send reset link" / "Back to Sign in" controls shipped
 * with zero identity and a whole recorded detour vanished with no trace.
 * This gate stops that class of bug at PR time instead of REC time.
 *
 * Heuristic, not a JSX parser (matches this repo's existing check-*.mjs
 * style — text-scanned, not AST-based; no `typescript` package dependency
 * here). For each `onClick=` occurrence, take the surrounding tag block
 * (nearest preceding `<Tag` line through the next line that closes the tag)
 * and require at least one of: `data-studio-action`, `data-studio-avail-store`,
 * `data-studio-beat`, `data-studio-plp-tile-id`, `data-name`, `aria-label`,
 * `role`, or (for anchors) `href`. False positives just add noise to the
 * ratcheted allowlist below; false negatives are an accepted trade-off for
 * staying regex-simple, same as every other static gate in this repo.
 *
 * Ratchet, not retrofit: this is new-code enforcement. Pre-existing gaps are
 * baselined per-file in ALLOWLIST_CEILINGS (documented, dated) — same
 * pattern as check-file-hygiene.mjs's line-count ceilings. A file may not
 * regress *above* its ceiling; new files get a ceiling of 0.
 *
 * Run: node scripts/check-interactive-identity.mjs
 * Wire: npm run check:interactive-identity (via npm test)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SCAN_DIRS = [
  "src/projects/boots-pharmacy/screens",
  "src/projects/boots-pharmacy/popups",
  "src/projects/boots-pharmacy/overlays",
  "src/projects/boots-pharmacy/chrome",
  "src/uxds/components",
];

/** Baselined 2026-07-24 (PP-49) at 25 gaps across 15 files; burned to 0 the
 * same day — all real gaps fixed, all false positives (custom-component
 * onClick pass-through) resolved by the isCustomComponentBlock() exemption.
 * Empty ceiling means: any new onClick with no identity is a hard fail,
 * immediately — no grace period. Keep it empty; add an entry only with a
 * dated reason if a genuine new exception is needed. */
const ALLOWLIST_CEILINGS = {};

const IDENTITY_RE =
  /\b(data-studio-action|data-studio-avail-store|data-studio-beat|data-studio-plp-tile-id|data-name|aria-label|role|href)\s*=/;

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

function findOwningTagBlock(lines, idx) {
  let start = idx;
  for (let i = idx; i >= 0 && idx - i <= 15; i--) {
    start = i;
    if (/^\s*<[A-Za-z][\w.]*(\s|$|>)/.test(lines[i])) break;
  }
  let end = idx;
  for (let i = idx; i < lines.length && i - idx <= 15; i++) {
    end = i;
    if (/(\/>\s*$)|(^\s*>\s*$)/.test(lines[i])) break;
  }
  return lines.slice(start, end + 1).join("\n");
}

/** JSX component references (`<NearMeCta onClick={...} />`) delegate their
 * real DOM identity to their own implementation — flagging the call site is
 * a false positive; the component's own file gets scanned on its own turn
 * if it's under a SCAN_DIRS path. Only bare intrinsic elements (lowercase
 * tag: button/div/span/a/…) are this gate's real target. */
function isCustomComponentBlock(block) {
  const m = /^\s*<([A-Za-z][\w.]*)/.exec(block);
  return Boolean(m && /^[A-Z]/.test(m[1]));
}

const offendersByFile = new Map();

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n");

    lines.forEach((line, idx) => {
      if (!/\bonClick\s*=\s*\{/.test(line)) return;
      const block = findOwningTagBlock(lines, idx);
      if (isCustomComponentBlock(block)) return;
      if (IDENTITY_RE.test(block)) return;
      const list = offendersByFile.get(rel) ?? [];
      list.push(idx + 1);
      offendersByFile.set(rel, list);
    });
  }
}

let regressed = false;
const report = [];
for (const [rel, lineNums] of offendersByFile) {
  const ceiling = ALLOWLIST_CEILINGS[rel] ?? 0;
  if (lineNums.length > ceiling) {
    regressed = true;
    report.push(
      `  ${rel}: ${lineNums.length} unidentified onClick(s) > ceiling ${ceiling} — lines ${lineNums.join(", ")}`
    );
  }
}

if (regressed) {
  console.error(
    "[check-interactive-identity] FAIL — onClick element(s) with no identity attribute (data-studio-action / data-name / aria-label / role / href):"
  );
  for (const line of report) console.error(line);
  console.error(
    "Add data-studio-action (or data-name/aria-label/role) to the element itself, or raise its dated ceiling in scripts/check-interactive-identity.mjs with a reason."
  );
  process.exit(1);
}

const totalOffenders = [...offendersByFile.values()].reduce(
  (sum, l) => sum + l.length,
  0
);
console.log(
  `[check-interactive-identity] OK — ${totalOffenders} pre-existing gap(s) within ratcheted ceilings, no regressions`
);
process.exit(0);
