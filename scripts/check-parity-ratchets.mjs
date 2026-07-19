#!/usr/bin/env node
/**
 * Make→React parity ratchets — FAIL npm test on typical fidelity misses.
 * Lean source/DOM-contract scans (Summarizer-style). No Playwright / screenshots.
 *
 * Policy: docs/product/PARITY_RATCHETS.md
 * Seed: LESSONS_LEARNED · UMA_FIDELITY_NOTES · PLP Make parity register
 *
 * Every new typical PO fail class → add a ratchet here (Arch/Ben).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const errors = [];
const fail = (msg) => errors.push(msg);

function read(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

function requireFile(rel) {
  const text = read(rel);
  if (text == null) {
    fail(`missing required file: ${rel}`);
    return "";
  }
  return text;
}

/** Drop line and block comments so string-count ratchets ignore docs in source. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === "dist" ||
      ent.name === ".git" ||
      ent.name === "frame"
    ) {
      continue;
    }
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const PLP_TSX = "src/projects/boots-pharmacy/screens/plp/PlpScreen.tsx";
const PLP_CSS = "src/projects/boots-pharmacy/screens/plp/plp.css";
const AVAIL_TSX =
  "src/projects/boots-pharmacy/overlays/AvailabilityTool.tsx";
const BOOK1_TSX =
  "src/projects/boots-pharmacy/screens/book-step-1/BookStep1LocationScreen.tsx";

const REACT_MOUNT_FILES = [
  "src/projects/boots-pharmacy/screens/plp/mountPlpScreen.tsx",
  "src/projects/boots-pharmacy/screens/book-step-1/mountBookStep1Screen.tsx",
  "src/projects/boots-pharmacy/screens/book-step-2/mountBookStep2Screen.tsx",
  "src/projects/boots-pharmacy/screens/book-step-3/mountBookStep3Screen.tsx",
];

// ── 1) Search fields must expose a visible search-icon marker ───────────────
{
  const SEARCH_FILES = [
    { rel: PLP_TSX, minIcons: 1, label: "PLP filter search" },
    { rel: BOOK1_TSX, minIcons: 1, label: "Book Step 1 location search" },
    { rel: AVAIL_TSX, minIcons: 1, label: "Availability search" },
  ];

  for (const { rel, minIcons, label } of SEARCH_FILES) {
    const src = requireFile(rel);
    if (!src) continue;
    // PLP uses UXDS SearchField which stamps the marker in the kit source.
    const iconCount = (
      src.match(/data-studio-search-icon\s*=\s*["']true["']/g) || []
    ).length;
    const usesUxdsSearch =
      /<SearchField[\s\S]{0,200}iconPosition\s*=\s*["']end["']/.test(src) ||
      /from ["']@\/uxds\/components["']/.test(src) && /SearchField/.test(src);
    if (iconCount < minIcons && !usesUxdsSearch) {
      fail(
        `RATCHET search-icon: ${label} (${rel}) needs ≥${minIcons} data-studio-search-icon="true" or UXDS SearchField (found ${iconCount})`
      );
    }
  }

  // Any React screen with type="search" or known search placeholders must mark icon.
  const screensRoot = path.join(ROOT, "src", "projects");
  for (const full of walk(screensRoot)) {
    if (!/\.tsx$/.test(full)) continue;
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (rel.includes("/frame/")) continue;
    const src = fs.readFileSync(full, "utf8");
    const hasSearchInput =
      /type\s*=\s*["']search["']/.test(src) ||
      /placeholder\s*=\s*["']Search (countries|diseases|disease|country)["']/i.test(
        src
      );
    if (!hasSearchInput) continue;
    const usesUxdsSearch = /<SearchField[\s>]/.test(src);
    if (
      !/data-studio-search-icon\s*=\s*["']true["']/.test(src) &&
      !usesUxdsSearch
    ) {
      fail(
        `RATCHET search-icon: ${rel} has search input/placeholder but no data-studio-search-icon="true"`
      );
    }
  }

  // UXDS kit must stamp icon marker + icon-pos.
  const searchKit = requireFile("src/uxds/components/SearchField.tsx");
  if (searchKit) {
    if (!/data-studio-search-icon\s*=\s*["']true["']/.test(searchKit)) {
      fail(
        'RATCHET search-icon: SearchField.tsx must stamp data-studio-search-icon="true"'
      );
    }
    if (
      !/data-studio-search-icon-pos\s*=\s*\{?iconPosition\}?/.test(searchKit) &&
      !/data-studio-search-icon-pos=/.test(searchKit)
    ) {
      fail(
        "RATCHET search-icon-pos: SearchField.tsx must stamp data-studio-search-icon-pos"
      );
    }
  }
}

// ── 1b) PLP search icon on the RIGHT (end) + single clear + no type=search ──
{
  const src = requireFile(PLP_TSX);
  if (src) {
    if (!/iconPosition\s*=\s*["']end["']/.test(src)) {
      fail(
        `RATCHET search-icon-pos: ${PLP_TSX} FilterSearch must use iconPosition="end" (magnifier RIGHT)`
      );
    }
    if (/type\s*=\s*["']search["']/.test(src)) {
      fail(
        `RATCHET single-clear: ${PLP_TSX} must not use type="search" (native X duplicates clear)`
      );
    }
    if (!/data-studio-plp-view-all\s*=\s*["']true["']/.test(src)) {
      fail(
        `RATCHET view-all: ${PLP_TSX} missing data-studio-plp-view-all="true"`
      );
    }
    if (!/PLP_FILTER_LIST_MAX|capPlpFilterOptionList/.test(src)) {
      fail(
        `RATCHET view-all: ${PLP_TSX} must cap filter lists via PLP_FILTER_LIST_MAX / capPlpFilterOptionList`
      );
    }
    if (!/data-studio-plp-option-count/.test(src)) {
      fail(
        `RATCHET filter-counters: ${PLP_TSX} missing data-studio-plp-option-count on filter options`
      );
    }
    if (!/countPlpFacetOption|countPlpTypeOption/.test(src)) {
      fail(
        `RATCHET filter-counters: ${PLP_TSX} must call countPlpFacetOption / countPlpTypeOption`
      );
    }
  }
}

// ── 1c) No invented filter horizontal separator ─────────────────────────────
{
  const css = requireFile(PLP_CSS);
  if (css) {
    const compact = css.replace(/\s+/g, " ");
    const sectionRule = /\.plp__filter-section\s*\{[^}]*\}/;
    const match = compact.match(sectionRule);
    if (match && /border-bottom|border-top/.test(match[0])) {
      fail(
        `RATCHET no-filter-hr: ${PLP_CSS} .plp__filter-section must not invent border separator (Make has none)`
      );
    }
    if (
      /\.plp__filter-(separator|divider|hr)\b/.test(css) ||
      /plp__filter-hr/.test(css)
    ) {
      fail(
        `RATCHET no-filter-hr: ${PLP_CSS} must not define invented filter separator classes`
      );
    }
  }
}

// ── 2) Bookmark control — bookmarked copy + hover remove ────────────────────
{
  const src = requireFile(PLP_TSX);
  if (src) {
    if (!src.includes("In your Bookmarks")) {
      fail(
        `RATCHET bookmark-copy: ${PLP_TSX} missing default bookmarked text "In your Bookmarks"`
      );
    }
    if (!src.includes("Remove from Bookmarks")) {
      fail(
        `RATCHET bookmark-copy: ${PLP_TSX} missing hover text "Remove from Bookmarks"`
      );
    }
  }
}

// ── 3) No invented fuchsia on empty-heart hover ─────────────────────────────
{
  const css = requireFile(PLP_CSS);
  if (css) {
    const compact = css.replace(/\s+/g, " ");
    // Empty (not .is-active) wishlist hover must NOT set fuchsia / Boots filled pink.
    const emptyHoverRule =
      /\.plp__tertiary:hover\s*\.plp__tertiary-icon\[data-name="icon=add to wishlist"\]:not\(\.is-active\)[^}]*\}/;
    const emptyMatch = compact.match(emptyHoverRule);
    if (!emptyMatch) {
      fail(
        `RATCHET empty-heart-fuchsia: ${PLP_CSS} missing empty wishlist hover rule (:not(.is-active))`
      );
    } else if (
      /#c8247e|#c2186e|fuchsia|hotpink|#ff00ff/i.test(emptyMatch[0])
    ) {
      fail(
        `RATCHET empty-heart-fuchsia: ${PLP_CSS} sets fuchsia on empty bookmark hover (filled/active only)`
      );
    } else if (!/--uxds-text-link-link/.test(emptyMatch[0])) {
      fail(
        `RATCHET empty-heart-fuchsia: ${PLP_CSS} empty wishlist hover must use --uxds-text-link-link (Make tertiary navy)`
      );
    }
    // Filled may use fuchsia — require active rule exists (parity of filled state).
    if (
      !/\.plp__tertiary-icon\[data-name="icon=add to wishlist"\]\.is-active/.test(
        compact
      )
    ) {
      fail(
        `RATCHET empty-heart-fuchsia: ${PLP_CSS} missing .is-active filled bookmark color rule`
      );
    }
  }
}

// ── 4) Overlay registry — owned by check:felonies; assert companion still wired ─
{
  const felonies = requireFile("scripts/check-agent-felonies.mjs");
  if (felonies && !/REGISTERED_OVERLAY_MODAL_IDS|REQUIRED_OVERLAY_IDS/.test(felonies)) {
    fail(
      "RATCHET overlay-registry: check-agent-felonies.mjs must keep overlay eyes / REGISTERED_OVERLAY_MODAL_IDS gate"
    );
  }
  const pkg = requireFile("package.json");
  if (pkg && !/"check:felonies"/.test(pkg)) {
    fail("RATCHET overlay-registry: package.json missing check:felonies script");
  }
}

// ── 5) Promo / Advantage bar on PLP ─────────────────────────────────────────
{
  const src = requireFile(PLP_TSX);
  if (src) {
    const flat = stripComments(src).replace(/\s+/g, " ");
    if (
      !/Collect 3 points for every £1 you spend with Boots Advantage\s*Card/.test(
        flat
      )
    ) {
      fail(
        `RATCHET advantage-bar: ${PLP_TSX} missing Advantage Card copy string`
      );
    }
    if (!/data-studio-plp-advantage\s*=\s*["']true["']/.test(src)) {
      fail(
        `RATCHET advantage-bar: ${PLP_TSX} missing data-studio-plp-advantage="true"`
      );
    }
  }
}

// ── 6) Primary Book now must use UXDS primary token class ───────────────────
{
  const src = requireFile(PLP_TSX);
  if (src) {
    const usesBookPrimary =
      /<ButtonPrimary[\s\S]{0,400}Book now|Book now[\s\S]{0,80}<\/ButtonPrimary>/.test(
        src
      );
    if (!usesBookPrimary) {
      fail(
        `RATCHET book-now-primary: ${PLP_TSX} Book now must render via <ButtonPrimary> (.uxds-btn-primary)`
      );
    }
    // ButtonPrimary always emits uxds-btn-primary; commerce variant is OK.
    if (
      !/ButtonPrimary[\s\S]{0,200}uxds-btn-primary|--commerce[\s\S]{0,200}Book now|className="plp__book uxds-btn-primary/.test(
        src
      )
    ) {
      // Still OK if ButtonPrimary wraps Book now (base class comes from component).
      if (!usesBookPrimary) {
        fail(
          `RATCHET book-now-primary: ${PLP_TSX} missing .uxds-btn-primary / ButtonPrimary on Book now`
        );
      }
    }
  }
}

// ── 7) Loading states — no duplicate "Updating results" in count + loader ───
{
  const src = requireFile(PLP_TSX);
  if (src) {
    const code = stripComments(src);
    const updatingHits = code.match(/Updating results/g) || [];
    if (updatingHits.length !== 1) {
      fail(
        `RATCHET loader-dup: ${PLP_TSX} must contain exactly one "Updating results" in code (found ${updatingHits.length}) — spinner label only, never also in count`
      );
    }
    const countBlock = code.match(
      /data-studio-plp-results[\s\S]{0,800}?<\/p>/
    );
    if (countBlock && /Updating results/.test(countBlock[0])) {
      fail(
        `RATCHET loader-dup: ${PLP_TSX} results-count block must not contain "Updating results"`
      );
    }
    if (!/data-studio-plp-listing-loader\s*=\s*["']true["']/.test(src)) {
      fail(
        `RATCHET loader-dup: ${PLP_TSX} missing data-studio-plp-listing-loader="true" on spinner overlay`
      );
    }
  }
}

// ── 8) Make-retired screens stamp data-studio-make-retired when React mounts ─
{
  for (const rel of REACT_MOUNT_FILES) {
    const src = requireFile(rel);
    if (!src) continue;
    const stamps =
      /dataset\.studioMakeRetired\s*=/.test(src) ||
      /data-studio-make-retired/.test(src);
    if (!stamps) {
      fail(
        `RATCHET make-retired: ${rel} must set data-studio-make-retired / dataset.studioMakeRetired when retiring Make chrome`
      );
    }
  }
}

// ── Docs companion present ──────────────────────────────────────────────────
{
  if (!fs.existsSync(path.join(ROOT, "docs/product/PARITY_RATCHETS.md"))) {
    fail("missing docs/product/PARITY_RATCHETS.md (document each ratchet)");
  }
}

if (errors.length) {
  console.error("parity-ratchets FAIL:");
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log("parity-ratchets OK (11 contracts)");
