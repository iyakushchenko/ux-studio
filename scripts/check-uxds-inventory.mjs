/**
 * HARD gate: exhaustive UXDS map inventory must exist and stay within floors.
 * Regenerated from Figma fileKey myqzp3KRc1pxKDOv8RfTsl — see docs/uxds/UXDS_MAP.md.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INV = path.join(ROOT, "docs", "uxds", "inventory");

const FLOORS = {
  totalVariables: 990,
  collections: 6,
  design: 100,
  setup: 590,
  "screen & fonts": 150,
  componentSets: 220,
  orphans: 340,
  reactKitRows: 5,
};

function fail(msg) {
  process.stderr.write(`[check:uxds-inventory] FAIL ${msg}\n`);
  process.exit(1);
}

function readJson(rel) {
  const p = path.join(INV, rel);
  if (!fs.existsSync(p)) fail(`missing ${path.relative(ROOT, p)}`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`invalid JSON ${path.relative(ROOT, p)}: ${e.message}`);
  }
}

const variables = readJson("variables.json");
const components = readJson("components.json");
const reactKit = readJson("react-kit-map.json");

if (typeof variables.totalVariables !== "number") fail("variables.totalVariables missing");
if (variables.totalVariables < FLOORS.totalVariables) {
  fail(`totalVariables ${variables.totalVariables} < floor ${FLOORS.totalVariables}`);
}
if (!variables.namesByCollection || typeof variables.namesByCollection !== "object") {
  fail("variables.namesByCollection missing");
}
const colNames = Object.keys(variables.namesByCollection);
if (colNames.length < FLOORS.collections) {
  fail(`collections ${colNames.length} < floor ${FLOORS.collections}`);
}
for (const key of ["design", "setup", "screen & fonts"]) {
  const list = variables.namesByCollection[key];
  if (!Array.isArray(list)) fail(`namesByCollection['${key}'] missing`);
  const floor = FLOORS[key];
  if (list.length < floor) fail(`${key} count ${list.length} < floor ${floor}`);
}

if ((components.componentSetCount ?? 0) < FLOORS.componentSets) {
  fail(`componentSetCount ${components.componentSetCount} < floor ${FLOORS.componentSets}`);
}
if ((components.orphanComponentCount ?? 0) < FLOORS.orphans) {
  fail(`orphanComponentCount ${components.orphanComponentCount} < floor ${FLOORS.orphans}`);
}
if (!Array.isArray(components.sets) || components.sets.length < FLOORS.componentSets) {
  fail("components.sets incomplete");
}
if (!Array.isArray(components.orphans) || components.orphans.length < FLOORS.orphans) {
  fail("components.orphans incomplete");
}

if (!Array.isArray(reactKit.kits) || reactKit.kits.length < FLOORS.reactKitRows) {
  fail(`react-kit-map.kits ${reactKit.kits?.length ?? 0} < floor ${FLOORS.reactKitRows}`);
}

process.stdout.write(
  `[check:uxds-inventory] OK — vars ${variables.totalVariables}, sets ${components.componentSetCount}, orphans ${components.orphanComponentCount}, kits ${reactKit.kits.length}\n`
);
