/**
 * One-shot domain identity codemod (phase 2).
 * PANEL/shell chrome classes: .proto-* → .studio-*
 * Attributes: data-proto-* → data-studio-* (+ dataset.proto* → dataset.studio*)
 *
 * Does NOT rewrite LEGACY Make dump class names in globals-screens.css
 * (concept/Make-coupled). Re-run is mostly idempotent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** Ordered longest-first class token renames (no leading dot). */
const CLASS_RENAMES = [
  ["proto-agent-testing", "studio-agent-testing"],
  ["proto-playback-diagnostic", "studio-playback-diagnostic"],
  ["proto-playback-shield", "studio-playback-shield"],
  ["proto-diagnostic-copy", "studio-diagnostic-copy"],
  ["proto-chat-composer-portal-host", "studio-chat-composer-portal-host"],
  ["proto-fatal-error", "studio-fatal-error"],
  ["proto-wire-mount", "studio-wire-mount"],
  ["proto-app-content", "studio-app-content"],
  ["proto-app-root", "studio-app-root"],
  ["proto-tertiary-cta", "studio-tertiary-cta"],
  ["proto-icon-hit", "studio-icon-hit"],
  ["proto-avail-scrim", "studio-avail-scrim"],
  ["proto-nav-", "studio-nav-"],
  ["proto-studio-", "studio-"],
  ["proto-viewport", "studio-viewport"],
  ["proto-scroll-", "studio-scroll-"],
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  ".git",
  "agent-transcripts",
]);

/** Do not rewrite this script (would eat its own rename table). */
const SKIP_FILES = new Set(["scripts/codemod-domain-identity.mjs"]);

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".css",
  ".mjs",
  ".js",
  ".md",
  ".json",
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (TEXT_EXT.has(path.extname(ent.name))) out.push(full);
  }
  return out;
}

function applyClassRenames(src) {
  let out = src;
  for (const [from, to] of CLASS_RENAMES) {
    out = out.split(from).join(to);
  }
  return out;
}

function applyDataRenames(src) {
  let out = src;
  out = out.split("data-proto-").join("data-studio-");
  out = out.split("dataset.proto").join("dataset.studio");
  return out;
}

const roots = [
  path.join(ROOT, "src"),
  path.join(ROOT, "scripts"),
  path.join(ROOT, "docs"),
  path.join(ROOT, ".cursor"),
  path.join(ROOT, "AGENTS.md"),
  path.join(ROOT, "README.md"),
  path.join(ROOT, "package.json"),
];

const files = [];
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  const st = fs.statSync(r);
  if (st.isDirectory()) walk(r, files);
  else files.push(r);
}

let changed = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (SKIP_FILES.has(rel)) continue;
  let src = fs.readFileSync(file, "utf8");
  let next = applyClassRenames(applyDataRenames(src));
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log(`updated ${rel}`);
  }
}

console.log(`\n[codemod-domain-identity] files changed: ${changed}`);
