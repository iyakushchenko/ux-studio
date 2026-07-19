#!/usr/bin/env node
/**
 * Local semver bump + CHANGELOG promote (Summarizer-inspired, Studio-sized).
 * Does NOT push tags or publish GitHub Releases (see docs/product/VERSIONING.md).
 *
 * Usage:
 *   node scripts/release.mjs patch [optional note…]
 *   node scripts/release.mjs minor …
 *   node scripts/release.mjs major …
 *
 * Env:
 *   SKIP_BUILD=1  — skip npm run build after bump (emergency only)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = path.join(ROOT, "package.json");
const changelogPath = path.join(ROOT, "CHANGELOG.md");

const CURRENT_HEADING = "## Current (in flight)";
const CURRENT_BLOCKQUOTE = `> _Append a bullet on coherent commits via \`npm run notes:append -- --lane="<lane>" --intent="<text>"\`. Preview with \`npm run notes:preview\`. On \`npm run release:patch\` this section is promoted to \`## v<X.Y.Z> - DDMMYY\` and a fresh empty \`## Current\` is re-inserted. Policy: \`docs/product/VERSIONING.md\`._`;

const parseCurrentBlock = (text) => {
  const lines = text.split(/\r?\n/);
  let currentStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## Current\b/i.test(lines[i])) {
      currentStart = i;
      break;
    }
  }
  if (currentStart === -1) return null;
  let nextHeadingStart = lines.length;
  for (let j = currentStart + 1; j < lines.length; j++) {
    if (/^## /.test(lines[j])) {
      nextHeadingStart = j;
      break;
    }
  }
  let bodyStart = currentStart + 1;
  while (bodyStart < nextHeadingStart && lines[bodyStart].trim() === "") bodyStart++;
  while (bodyStart < nextHeadingStart && lines[bodyStart].startsWith(">")) bodyStart++;
  while (bodyStart < nextHeadingStart && lines[bodyStart].trim() === "") bodyStart++;
  let bodyEnd = nextHeadingStart - 1;
  while (bodyEnd >= bodyStart && lines[bodyEnd].trim() === "") bodyEnd--;
  const bodyLines = bodyEnd >= bodyStart ? lines.slice(bodyStart, bodyEnd + 1) : [];
  return {
    allLines: lines,
    currentStart,
    nextHeadingStart,
    bodyLines,
    body: bodyLines.join("\n"),
  };
};

const releaseType = process.argv[2] || "patch";
const cliNote = process.argv.slice(3).join(" ").trim();

if (!["patch", "minor", "major"].includes(releaseType)) {
  console.error(`[release] Expected patch|minor|major, got: ${releaseType}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const pkgSnapshot = fs.readFileSync(pkgPath, "utf8");
const changelogSnapshot = fs.existsSync(changelogPath)
  ? fs.readFileSync(changelogPath, "utf8")
  : null;

const rollback = (reason) => {
  fs.writeFileSync(pkgPath, pkgSnapshot);
  if (changelogSnapshot !== null) fs.writeFileSync(changelogPath, changelogSnapshot);
  console.error(`↩  Rolled back package.json + CHANGELOG.md (${reason}).`);
};

let releaseBodyMarkdown = "";
if (cliNote) {
  releaseBodyMarkdown = `- ${cliNote}`;
} else if (changelogSnapshot) {
  const current = parseCurrentBlock(changelogSnapshot);
  const trimmed = current?.body?.trim() || "";
  releaseBodyMarkdown = trimmed || "- Maintenance update";
} else {
  releaseBodyMarkdown = "- Maintenance update";
}

const parsed = String(pkg.version || "")
  .split(".")
  .map(Number);
if (parsed.length !== 3 || parsed.some((n) => !Number.isFinite(n) || n < 0)) {
  console.error(`[release] Invalid package version: "${pkg.version}"`);
  process.exit(1);
}
let [major, minor, patch] = parsed;

if (releaseType === "major") {
  major += 1;
  minor = 0;
  patch = 0;
} else if (releaseType === "minor") {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const newVersion = `${major}.${minor}.${patch}`;
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ Bumped version to ${newVersion}`);

// Keep lockfile root version in sync so agents/tools never read a stale 0.0.x.
const lockPath = path.join(ROOT, "package-lock.json");
if (fs.existsSync(lockPath)) {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    lock.version = newVersion;
    if (lock.packages && lock.packages[""]) {
      lock.packages[""].version = newVersion;
    }
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
    console.log(`🔒 Synced package-lock.json version → ${newVersion}`);
  } catch (e) {
    console.warn(`⚠  Could not sync package-lock.json version: ${e}`);
  }
}

const now = new Date();
const dateStr = [
  String(now.getDate()).padStart(2, "0"),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getFullYear()).slice(-2),
].join("");

const freshCurrentBlock = [CURRENT_HEADING, "", CURRENT_BLOCKQUOTE, ""].join("\n");
const newVersionBlock = `## v${newVersion} - ${dateStr}\n${releaseBodyMarkdown}`;

try {
  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(
      changelogPath,
      `${freshCurrentBlock}\n${newVersionBlock}\n`
    );
  } else {
    const text = fs.readFileSync(changelogPath, "utf8");
    const current = parseCurrentBlock(text);
    if (current) {
      const before = current.allLines.slice(0, current.currentStart).join("\n");
      const after = current.allLines.slice(current.nextHeadingStart).join("\n");
      const top = `${freshCurrentBlock}\n${newVersionBlock}\n`;
      const parts = [];
      if (before.length > 0) parts.push(before);
      parts.push(top);
      if (after.length > 0) parts.push(after);
      fs.writeFileSync(
        changelogPath,
        parts.join("\n").replace(/\n{3,}/g, "\n\n")
      );
    } else {
      fs.writeFileSync(
        changelogPath,
        `${freshCurrentBlock}\n${newVersionBlock}\n\n${text.replace(/^\s*\n/, "")}`
      );
    }
  }
  console.log(`📝 Promoted CHANGELOG.md for v${newVersion}.`);
} catch (e) {
  rollback("changelog write failed");
  throw e;
}

if (process.env.SKIP_BUILD === "1") {
  console.log("⏭  SKIP_BUILD=1 — skipped npm run build.");
} else {
  console.log("🚀 Running npm run build…");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    rollback("build failed");
    process.exit(1);
  }
}

try {
  execSync("node scripts/check-release-version-changelog-sync.mjs", {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch {
  rollback("version sync check failed");
  process.exit(1);
}

console.log("");
console.log(`Done. Local release v${newVersion}.`);
console.log("Next (manual, when ready): commit, then optionally tag v" + newVersion);
console.log("No GitHub Release workflow yet — see docs/product/VERSIONING.md.");
