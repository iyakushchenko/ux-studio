#!/usr/bin/env node
/**
 * Make→React parity ratchets — FAIL npm test on typical fidelity misses.
 * Lean source/DOM-contract scans (Summarizer-style). No Playwright / screenshots.
 *
 * Policy: docs/product/PARITY_RATCHETS.md
 * Seed: LESSONS_LEARNED · UMA_FIDELITY_NOTES · PLP Legacy parity register
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
        `RATCHET no-filter-hr: ${PLP_CSS} .plp__filter-section must not invent border separator (Legacy has none)`
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
        `RATCHET empty-heart-fuchsia: ${PLP_CSS} empty wishlist hover must use --uxds-text-link-link (Legacy tertiary navy)`
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
  if (felonies && !/studioModalRegistry|modal URL sync/.test(felonies)) {
    fail(
      "RATCHET overlay-registry: check-agent-felonies.mjs must gate modal URL sync registry"
    );
  }
  const pkg = requireFile("package.json");
  if (pkg && !/"check:felonies"/.test(pkg)) {
    fail("RATCHET overlay-registry: package.json missing check:felonies script");
  }
}

// ── 4b) Modal URL sync — every registered popup must drive `&modal=` ──────────
{
  const reg = requireFile("src/app/shell/studioModalRegistry.ts");
  if (!reg) {
    fail("RATCHET modal-url-sync: missing studioModalRegistry.ts");
  } else {
    for (const id of [
      "choose-pharmacy",
      "quick-view",
      "login",
      "vaccine-picker",
      "recipient-picker",
    ]) {
      if (!reg.includes(`"${id}"`) && !reg.includes(`'${id}'`)) {
        fail(`RATCHET modal-url-sync: registry missing "${id}"`);
      }
    }
    if (!/urlSync:\s*true/.test(reg)) {
      fail("RATCHET modal-url-sync: registry entries must set urlSync: true");
    }
    if (!/resolveStudioModalIdFromFlags/.test(reg) || !/applyStudioModalFromUrl/.test(reg)) {
      fail(
        "RATCHET modal-url-sync: registry must export resolve + apply URL helpers"
      );
    }
  }
  const app = requireFile("src/app/App.tsx") || "";
  const bridge = requireFile("src/app/shell/useStudioModalUrlBridge.ts") || "";
  if (!/useStudioModalUrlBridge/.test(app)) {
    fail("RATCHET modal-url-sync: App.tsx must use useStudioModalUrlBridge");
  }
  if (!/resolveStudioModalIdFromFlags/.test(`${app}\n${bridge}`)) {
    fail(
      "RATCHET modal-url-sync: App/bridge must sync modalId via resolveStudioModalIdFromFlags"
    );
  }
  const wire = requireFile(
    "src/projects/boots-pharmacy/wire/BootsPharmacyProjectView.tsx"
  );
  if (wire && !/\bopenQuickView\b/.test(wire)) {
    fail("RATCHET modal-url-sync: wire must expose openQuickView");
  }
  if (wire && !/\bapplyStudioModal\b/.test(wire)) {
    fail("RATCHET modal-url-sync: wire must expose applyStudioModal");
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

// ── 8) Legacy-retired screens stamp data-studio-legacy-retired when React mounts ─
{
  for (const rel of REACT_MOUNT_FILES) {
    const src = requireFile(rel);
    if (!src) continue;
    const stamps =
      /dataset.studioLegacyRetired\s*=/.test(src) ||
      /data-studio-legacy-retired/.test(src) ||
      /retireLegacyUnderPage\s*\(/.test(src);
    if (!stamps) {
      fail(
        `RATCHET legacy-retired: ${rel} must retire legacy source via retireLegacyUnderPage (or stamp data-studio-legacy-retired)`
      );
    }
  }
}

// ── 9) Loading — hide results count (no stale jab totals during refresh) ─────
{
  const src = requireFile(PLP_TSX);
  if (src) {
    const code = stripComments(src);
    if (!/data-studio-plp-results-loading/.test(src)) {
      fail(
        `RATCHET count-hide-load: ${PLP_TSX} must stamp data-studio-plp-results-loading while listingPhase===loading`
      );
    }
    if (!/listingPhase\s*===\s*["']loading["']\s*\?\s*null/.test(code)) {
      fail(
        `RATCHET count-hide-load: ${PLP_TSX} loading branch must render null count children (no jab-count text while loading)`
      );
    }
    // Fail if "available" appears in the loading arm before the null short-circuit.
    if (
      /listingPhase\s*===\s*["']loading["']\s*\?[\s\S]{0,120}available/.test(code)
    ) {
      fail(
        `RATCHET count-hide-load: ${PLP_TSX} must not render jab-count "available" text in the loading branch`
      );
    }
    const css = requireFile(PLP_CSS);
    if (css && !/\.plp__results-count--loading/.test(css)) {
      fail(
        `RATCHET count-hide-load: ${PLP_CSS} missing .plp__results-count--loading hide rule`
      );
    }
  }
}

// ── 10) SearchField kit — control shell hover (+ focus-within) ───────────────
// Rule of thumb (PARITY_RATCHETS.md): every interactive DS control shipped must
// define hover/focus in kit CSS. This ratchet seeds that for SearchField.
{
  const css = requireFile("src/uxds/components/search-field.css");
  if (css) {
    const compact = css.replace(/\s+/g, " ");
    if (!/\.uxds-search-field__control:hover\b/.test(compact)) {
      fail(
        "RATCHET search-field-states: search-field.css must define .uxds-search-field__control:hover (Legacy inset ring on control shell)"
      );
    }
    if (!/\.uxds-search-field__control:focus-within\b/.test(compact)) {
      fail(
        "RATCHET search-field-states: search-field.css must define .uxds-search-field__control:focus-within"
      );
    }
    const hoverRule = compact.match(
      /\.uxds-search-field__control:hover(?:\s*,\s*\.uxds-search-field__control:focus-within)?\s*\{[^}]*\}/
    );
    if (!hoverRule || !/border-color|box-shadow/.test(hoverRule[0])) {
      fail(
        "RATCHET search-field-states: .uxds-search-field__control:hover must set border-color and/or box-shadow (Legacy ring)"
      );
    }
  }
}

// ── 11) Logged-out avail → Find Pharmacy (start) — Auto-Rule avail-logged-out-start
{
  const rel =
    "src/projects/boots-pharmacy/wire/resolveAvailIntent.ts";
  const src = requireFile(rel);
  if (src) {
    if (!/AVAIL_START_INTENT|step:\s*["']start["']/.test(src)) {
      fail(
        `RATCHET avail-logged-out-start: ${rel} must define start intent (Find Pharmacy)`
      );
    }
    if (!/!hasLocation/.test(src) && !/hasLocation\s*=/.test(src)) {
      fail(
        `RATCHET avail-logged-out-start: ${rel} must gate on hasLocation / logged-out`
      );
    }
    // Logged-out path must return start for date/time intents.
    if (
      !/return AVAIL_START_INTENT/.test(src) &&
      !/return\s*\{\s*step:\s*["']start["']/.test(src)
    ) {
      fail(
        `RATCHET avail-logged-out-start: ${rel} must return start intent when logged-out without location`
      );
    }
    if (!/isStudioLoggedIn/.test(src)) {
      fail(
        `RATCHET avail-logged-out-start: ${rel} must use isStudioLoggedIn SSoT`
      );
    }
  }
  const testRel =
    "src/projects/boots-pharmacy/wire/__tests__/resolveAvailIntent.test.ts";
  if (!fs.existsSync(path.join(ROOT, testRel))) {
    fail(
      `RATCHET avail-logged-out-start: missing ${testRel} (unit cover logged-out → start)`
    );
  } else {
    const testSrc = requireFile(testRel);
    if (
      testSrc &&
      !/start/.test(testSrc) &&
      !/Find Pharmacy|logged.?out/i.test(testSrc)
    ) {
      fail(
        `RATCHET avail-logged-out-start: ${testRel} must cover logged-out → start`
      );
    }
  }
}

// ── 12) Uma §0b PDP RTB rhythm markers — Auto-Rule pdp-rtb-rhythm ───────────
{
  const pdpCss = requireFile(
    "src/projects/boots-pharmacy/screens/pdp/pdp.css"
  );
  if (pdpCss) {
    const rtbCol = pdpCss.match(/\.pdp__rtb-col\s*\{[^}]+\}/);
    if (!rtbCol || !/gap:\s*32px/.test(rtbCol[0])) {
      fail(
        "RATCHET pdp-rtb-rhythm: .pdp__rtb-col must set gap: 32px (Uma §0b Legacy parity)"
      );
    }
    if (
      !/\.studio-react-screen-host\[data-studio-react-screen=["']pdp["']\]\s+\.pdp__rtb-col[\s\S]{0,120}gap:\s*32px\s*!important/.test(
        pdpCss.replace(/\s+/g, " ")
      )
    ) {
      fail(
        "RATCHET pdp-rtb-rhythm: host belt must force .pdp__rtb-col gap: 32px !important"
      );
    }
  }
  const globals = requireFile("src/styles/globals-screens.css");
  if (globals) {
    if (
      !/\[data-name=["']module\.pdp\.rtb["']\]:not\(\.pdp__rtb-card\)/.test(
        globals
      )
    ) {
      fail(
        "RATCHET pdp-rtb-rhythm: globals-screens LEGACY module.pdp.rtb rules must exclude .pdp__rtb-card"
      );
    }
  }
}

// ── Docs companion present ──────────────────────────────────────────────────
{
  if (!fs.existsSync(path.join(ROOT, "docs/product/PARITY_RATCHETS.md"))) {
    fail("missing docs/product/PARITY_RATCHETS.md (document each ratchet)");
  }
  if (!fs.existsSync(path.join(ROOT, "docs/product/STUDIO_AUTO_RULES.md"))) {
    fail("missing docs/product/STUDIO_AUTO_RULES.md");
  }
}

if (errors.length) {
  console.error("parity-ratchets FAIL:");
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log("parity-ratchets OK (15 contracts)");
