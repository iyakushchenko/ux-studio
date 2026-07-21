/**
 * Assemble docs/uxds/inventory/{variables,components}.json from raw dumps.
 * Raw inputs live in docs/uxds/inventory/raw/ (see UXDS_MAP.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "docs", "uxds", "inventory", "raw");
const OUT = path.join(ROOT, "docs", "uxds", "inventory");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(RAW, name), "utf8"));
}

function readLines(name) {
  return fs
    .readFileSync(path.join(RAW, name), "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const nonSetup = readJson("non-setup.json");
const setup = [...readLines("setup-a.txt"), ...readLines("setup-b.txt")];
if (setup.length !== 598) {
  throw new Error(`setup expected 598 names, got ${setup.length}`);
}

const namesByCollection = {
  ...nonSetup,
  setup,
};

const counts = Object.fromEntries(
  Object.entries(namesByCollection).map(([k, v]) => [k, v.length])
);
const totalVariables = Object.values(counts).reduce((a, b) => a + b, 0);

const variables = {
  atIso: "2026-07-21T09:56:00.000Z",
  fileKey: "myqzp3KRc1pxKDOv8RfTsl",
  totalVariables,
  counts,
  namesByCollection,
};

const sets = readLines("sets.txt");
const orphans = readLines("orphans.txt");
const components = {
  atIso: "2026-07-21T09:56:00.000Z",
  fileKey: "myqzp3KRc1pxKDOv8RfTsl",
  pageName: "↳  01 Components",
  pageId: "12336:188269",
  componentSetCount: sets.length,
  orphanComponentCount: orphans.length,
  byPrefix: {
    component: [...sets, ...orphans].filter((n) => n.startsWith("component")).length,
    module: [...sets, ...orphans].filter((n) => n.startsWith("module")).length,
    icon: [...sets, ...orphans].filter((n) => n.startsWith("icon")).length,
  },
  sets,
  orphans,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "variables.json"), JSON.stringify(variables, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "components.json"), JSON.stringify(components, null, 2) + "\n");

console.log(
  `[assemble-uxds-inventory] OK — vars ${totalVariables}, sets ${sets.length}, orphans ${orphans.length}`
);
