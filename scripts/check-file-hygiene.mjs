/**
 * Lean file-hygiene gate (Summarizer-inspired, Studio-sized).
 *
 * - FAIL when a watched source file exceeds MAX_LINES (monster).
 * - Allowlist = known LEGACY / Make dumps / current engine ceilings (ratchet only).
 * - No fragmentation nanny (avoids micro-file zoo pressure).
 *
 * Run: node scripts/check-file-hygiene.mjs
 * Wire: npm run check:hygiene (via npm test)
 *
 * Thresholds documented: docs/product/HYGIENE.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** Default hard ceiling for engine/project/UXDS source. */
const MAX_LINES = 1600;

/**
 * Relative paths → max lines (inclusive). Bumping requires a one-line rationale.
 * Prefer splitting the file over raising the ceiling.
 */
const ALLOWLIST = {
  // LEGACY Make dumps — do not grow; retirement is screen-by-screen.
  "src/styles/globals-screens.css": 3200,
  "src/styles/globals-chrome.css": 2600,
  "src/styles/globals-hub.css": 1400,
  // Engine / hybrid monsters — prefer domain split over bumping.
  "src/app/orchestra/useJourneyPlayback.ts": 2150, // + first-class camera beat play/auto/step/retreat wiring
  "src/app/App.tsx": 2130, // + playback camera session latch (CJM/play/AIR screen-enter policy)
  "src/app/shell/agent-testing/agentTestingOverlay.ts": 4500, // PP-13 expand + stale-green + diag mirror (landed past 4120)
  "src/app/nav/studioNavPanel.css": 1700, // + MCP status hint near version/bug
  "src/app/shell/studioMcpHelpers.ts": 1380, // + Traditional keep-overlay full Play prove window API
  "src/app/scenario/demoCursor.ts": 1740, // FM stop≠settle hang-guard; on-target click gate; demoCursorOnTarget.ts
  "src/projects/boots-pharmacy/wire/BootsPharmacyProjectView.tsx": 4825, // + screen-enter camera gate (no blind origin on CJM tab change)
  "src/projects/boots-pharmacy/data/plpListing.ts": 2000, // Make PLP DOM; retire with PLP React
};

const SKIP_DIR = new Set([
  "node_modules",
  "dist",
  ".git",
  "components", // shadcn dump under src/app/components/ui — not our product surface
  "frame", // Make frame dumps
  "imports",
  "__tests__",
  "playwright-out",
]);

const WATCH_EXT = new Set([".ts", ".tsx", ".css", ".mjs"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // Skip shadcn UI kit explicitly
      if (full.replace(/\\/g, "/").endsWith("src/app/components")) continue;
      walk(full, out);
    } else if (WATCH_EXT.has(path.extname(ent.name))) {
      out.push(full);
    }
  }
  return out;
}

const roots = [
  path.join(ROOT, "src", "app"),
  path.join(ROOT, "src", "uxds"),
  path.join(ROOT, "src", "projects"),
  path.join(ROOT, "src", "styles"),
  path.join(ROOT, "scripts"),
];

const files = roots.flatMap((r) => walk(r));
let failed = false;
const offenders = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  // Skip one-shot / generated
  if (rel.startsWith("scripts/inspect-")) continue;
  if (rel.startsWith("scripts/playwright-out/")) continue;
  if (rel.endsWith("codemod-domain-identity.mjs")) continue;

  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\n/).length;
  const ceiling = ALLOWLIST[rel] ?? MAX_LINES;
  if (lines > ceiling) {
    failed = true;
    offenders.push({ rel, lines, ceiling });
  }
}

if (offenders.length) {
  console.error("[check-file-hygiene] FAIL — monster file(s):");
  for (const o of offenders.sort((a, b) => b.lines - a.lines)) {
    console.error(
      `  ${o.rel}: ${o.lines} lines > ceiling ${o.ceiling}` +
        (ALLOWLIST[o.rel] ? " (allowlist)" : " (default)")
    );
  }
  console.error(
    "Split by domain cohesion or bump ALLOWLIST in scripts/check-file-hygiene.mjs with rationale."
  );
  process.exit(1);
}

const allowListed = Object.keys(ALLOWLIST).filter((rel) =>
  fs.existsSync(path.join(ROOT, rel))
);
console.log(
  `[check-file-hygiene] OK — ${files.length} files scanned; default max ${MAX_LINES}; ${allowListed.length} allowlisted`
);
process.exit(0);
