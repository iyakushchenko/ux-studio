/**
 * Validate local Markdown links and heading anchors across the repository docs.
 * External URLs are intentionally out of scope: this is a deterministic CI gate.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_ROOTS = ["README.md", "AGENTS.md", "docs"];
const failures = [];

function walk(target) {
  const absolute = path.join(ROOT, target);
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isFile()) return [absolute];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(absolute, entry.name);
    return entry.isDirectory()
      ? walk(path.relative(ROOT, child))
      : entry.name.endsWith(".md")
        ? [child]
        : [];
  });
}

function githubSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/\s/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
}

function anchorsFor(markdown) {
  const seen = new Map();
  const anchors = new Set();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubSlug(match[1]);
    const count = seen.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    seen.set(base, count + 1);
  }
  return anchors;
}

const markdownFiles = SCAN_ROOTS.flatMap(walk);
const cache = new Map();
for (const file of markdownFiles) {
  const markdown = fs.readFileSync(file, "utf8");
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || /^(?:https?:|mailto:|tel:)/i.test(target)) continue;
    target = target.split(/\s+["'][^"']*["']$/)[0];
    const hashAt = target.indexOf("#");
    const rawPath = hashAt >= 0 ? target.slice(0, hashAt) : target;
    const rawAnchor = hashAt >= 0 ? target.slice(hashAt + 1) : "";
    let decodedPath;
    let decodedAnchor;
    try {
      decodedPath = decodeURIComponent(rawPath);
      decodedAnchor = decodeURIComponent(rawAnchor).toLowerCase();
    } catch {
      failures.push(`${path.relative(ROOT, file)}: malformed URI in ${target}`);
      continue;
    }
    const destination = decodedPath
      ? path.resolve(path.dirname(file), decodedPath)
      : file;
    if (!fs.existsSync(destination)) {
      failures.push(`${path.relative(ROOT, file)}: missing target ${target}`);
      continue;
    }
    if (!decodedAnchor || path.extname(destination).toLowerCase() !== ".md") continue;
    if (!cache.has(destination)) {
      cache.set(destination, anchorsFor(fs.readFileSync(destination, "utf8")));
    }
    if (!cache.get(destination).has(decodedAnchor)) {
      failures.push(`${path.relative(ROOT, file)}: missing anchor #${rawAnchor} in ${path.relative(ROOT, destination)}`);
    }
  }
}

if (failures.length) {
  console.error(`[check-doc-links] FAIL: ${failures.length} broken local Markdown link(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[check-doc-links] OK: ${markdownFiles.length} Markdown files; local targets and anchors resolve`);
