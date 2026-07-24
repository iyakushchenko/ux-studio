#!/usr/bin/env node
/**
 * Page final-pass hard gate — FAIL npm test when a React-migrated screen
 * lacks a proven stamp in PAGE_FINAL_PASS.json, or when source contracts fail.
 *
 * Manifest: docs/projects/boots-pharmacy/audits/PAGE_FINAL_PASS.json
 * Policy: docs/product/PAGE_FINAL_PASS.md
 * Wire: npm run check:page-final-pass (also via npm test)
 *
 * CX_CONVEYOR.md Stage 2: required screens are read from the live registry
 * (src/projects/boots-pharmacy/screens/screens.ts), not a hand-maintained
 * copy — see deriveRequiredScreens() below. Registering a new screen now
 * forces it through this gate on the next `npm test`; no separate step to
 * remember.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_REL =
  "docs/projects/boots-pharmacy/audits/PAGE_FINAL_PASS.json";
const DOC_REL = "docs/product/PAGE_FINAL_PASS.md";
const SCREENS_REGISTRY_REL =
  "src/projects/boots-pharmacy/screens/screens.ts";

/**
 * CX_CONVEYOR.md Stage 2: derive required screens from the live registry
 * instead of a hand-maintained duplicate list. Previously a screen could be
 * added to PROJECT_SCREENS (screens.ts) without anyone remembering to also
 * add it here — the gate would silently never see it. Reading screenId
 * straight out of the registry makes that structurally impossible: register
 * a screen, and the final-pass gate requires it on the next `npm test`.
 */
function deriveRequiredScreens() {
  const registryPath = path.join(ROOT, SCREENS_REGISTRY_REL);
  if (!fs.existsSync(registryPath)) {
    fail(`missing screens registry: ${SCREENS_REGISTRY_REL}`);
    return [];
  }
  const text = fs.readFileSync(registryPath, "utf8");
  const ids = [...text.matchAll(/screenId:\s*["']([\w-]+)["']/g)].map(
    (m) => m[1]
  );
  if (ids.length === 0) {
    fail(`${SCREENS_REGISTRY_REL}: no screenId entries found — parser drift?`);
  }
  return ids;
}

const CHECKLIST_KEYS = [
  "semanticHtml",
  "bemScreenId",
  "dataStudioHooks",
  "uxdsKits",
  "noInventSeparators",
  "dsStates",
  // PAGE_FINAL_PASS.md item 6 (doctrine existed 2026-07-19, never enforced
  // until 2026-07-24 — dormant-doctrine gap closed same day as PP-49).
  // Stamp true only after a live __studioMapCurrentInteractions() run shows
  // readinessPass:true, OR every remaining `invalid` item is a named,
  // documented exception (doctrine explicitly allows "intentional
  // decorative/retired controls are recorded" — not literal zero-tolerance).
  // Record the exception in `interactionInventoryNote` when used.
  "interactionInventoryReady",
];

/** screenId → primary React screen source (structure contracts). */
const SCREEN_SOURCES = {
  plp: "src/projects/boots-pharmacy/screens/plp/PlpScreen.tsx",
  pdp: "src/projects/boots-pharmacy/screens/pdp/PdpScreen.tsx",
  "site-pilot": "src/projects/boots-pharmacy/screens/home/HomeScreen.tsx",
  chat: "src/projects/boots-pharmacy/screens/chat/ChatScreen.tsx",
  "appointment-history":
    "src/projects/boots-pharmacy/screens/appointment-history/AppointmentHistoryScreen.tsx",
  "appointment-details":
    "src/projects/boots-pharmacy/screens/appointment-details/AppointmentDetailsScreen.tsx",
  "book-step-1":
    "src/projects/boots-pharmacy/screens/book-step-1/BookStep1LocationScreen.tsx",
  "book-step-2":
    "src/projects/boots-pharmacy/screens/book-step-2/BookStep2DateTimeScreen.tsx",
  "book-step-3":
    "src/projects/boots-pharmacy/screens/book-step-3/BookStep3ConfirmationScreen.tsx",
};

/**
 * screenId → extra shared-component source files composed into the screen.
 * Gate checks (ButtonPrimary/Accordion/etc.) scan these too so extracting a
 * shared component (e.g. AppointmentCard) doesn't false-fail the contract.
 */
const SCREEN_EXTRA_SOURCES = {
  "appointment-history": [
    "src/projects/boots-pharmacy/screens/shared/AppointmentCard.tsx",
  ],
  "appointment-details": [
    "src/projects/boots-pharmacy/screens/shared/AppointmentCard.tsx",
  ],
  pdp: ["src/projects/boots-pharmacy/screens/pdp/PdpRtbCard.tsx"],
};

const SCREEN_MOUNTS = {
  plp: "src/projects/boots-pharmacy/screens/plp/mountPlpScreen.tsx",
  pdp: "src/projects/boots-pharmacy/screens/pdp/mountPdpScreen.tsx",
  "site-pilot": "src/projects/boots-pharmacy/screens/home/mountHomeScreen.tsx",
  chat: "src/projects/boots-pharmacy/screens/chat/mountChatScreen.tsx",
  "appointment-history":
    "src/projects/boots-pharmacy/screens/appointment-history/mountAppointmentHistoryScreen.tsx",
  "appointment-details":
    "src/projects/boots-pharmacy/screens/appointment-details/mountAppointmentDetailsScreen.tsx",
  "book-step-1":
    "src/projects/boots-pharmacy/screens/book-step-1/mountBookStep1Screen.tsx",
  "book-step-2":
    "src/projects/boots-pharmacy/screens/book-step-2/mountBookStep2Screen.tsx",
  "book-step-3":
    "src/projects/boots-pharmacy/screens/book-step-3/mountBookStep3Screen.tsx",
};

/**
 * Legacy frames without in-page crumbs header — engine mounts shared chrome.
 * Do not invent <header> crumbs on these screens (PO / Legacy truth).
 */
const HEADER_LANDMARK_OPTIONAL = new Set(["site-pilot", "chat"]);

/** Screens that must use SearchField or stamp search-icon markers. */
const SEARCH_REQUIRED = new Set(["plp", "book-step-1"]);

/** Screens that must use ButtonPrimary for primary commerce CTAs. */
const BUTTON_PRIMARY_REQUIRED = new Set([
  "plp",
  "pdp",
  "book-step-1",
  "book-step-2",
  "book-step-3",
  "chat",
  "appointment-history",
]);
/** Screens that must use UXDS Accordion kit for expand/collapse bands. */
const ACCORDION_REQUIRED = new Set(["pdp", "appointment-details"]);

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

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

// ── Docs companion ──────────────────────────────────────────────────────────
if (!fs.existsSync(path.join(ROOT, DOC_REL))) {
  fail(`missing ${DOC_REL} (mandatory final-pass checklist)`);
}

// ── Manifest stamp gate ─────────────────────────────────────────────────────
const manifestPath = path.join(ROOT, MANIFEST_REL);
if (!fs.existsSync(manifestPath)) {
  fail(`missing final-pass manifest: ${MANIFEST_REL}`);
  printAndExit();
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (err) {
  fail(`invalid JSON in ${MANIFEST_REL}: ${err.message}`);
  printAndExit();
}

// Registry is authoritative — not the manifest's own copy of the list.
// A screen registered in screens.ts is required whether or not the manifest
// "remembered" to list it too. manifest.requiredScreens is still checked
// below and must match exactly, so drift is a loud, named failure instead
// of a silently-skipped screen.
const required = deriveRequiredScreens();

if (Array.isArray(manifest.requiredScreens)) {
  const manifestSet = new Set(manifest.requiredScreens);
  const registrySet = new Set(required);
  for (const screenId of required) {
    if (!manifestSet.has(screenId)) {
      fail(
        `${SCREENS_REGISTRY_REL} registers "${screenId}" but ${MANIFEST_REL}.requiredScreens does not list it — add it and stamp final-pass before NEXT page`
      );
    }
  }
  for (const screenId of manifest.requiredScreens) {
    if (!registrySet.has(screenId)) {
      fail(
        `${MANIFEST_REL}.requiredScreens lists "${screenId}" but it is not registered in ${SCREENS_REGISTRY_REL} — stale entry`
      );
    }
  }
} else {
  fail(`${MANIFEST_REL}: requiredScreens[] required`);
}

if (!Array.isArray(manifest.screens) || manifest.screens.length === 0) {
  fail(`${MANIFEST_REL}: screens[] required`);
  printAndExit();
}

const byId = new Map();
for (const entry of manifest.screens) {
  if (!entry?.screenId) {
    fail(`${MANIFEST_REL}: screen entry missing screenId`);
    continue;
  }
  if (byId.has(entry.screenId)) {
    fail(`${MANIFEST_REL}: duplicate screenId "${entry.screenId}"`);
  }
  byId.set(entry.screenId, entry);
}

for (const screenId of required) {
  const entry = byId.get(screenId);
  if (!entry) {
    fail(
      `React-migrated screen "${screenId}" missing from ${MANIFEST_REL} screens[] — stamp final-pass before NEXT page`
    );
    continue;
  }

  const status = String(entry.status || "").toLowerCase();
  if (status !== "proven") {
    fail(
      `${screenId}: final-pass status must be "proven" (got "${entry.status ?? ""}") — cannot start NEXT page`
    );
  }

  const checklist = entry.checklist;
  if (!checklist || typeof checklist !== "object") {
    fail(`${screenId}: checklist object required`);
  } else {
    for (const key of CHECKLIST_KEYS) {
      if (checklist[key] !== true) {
        fail(
          `${screenId}: checklist.${key} must be true (got ${JSON.stringify(checklist[key])})`
        );
      }
    }
  }

  const stampedAt = entry.stampedAt;
  if (!stampedAt || typeof stampedAt !== "object") {
    fail(`${screenId}: stampedAt { sha, date } required`);
  } else {
    if (!stampedAt.sha || typeof stampedAt.sha !== "string") {
      fail(`${screenId}: stampedAt.sha required`);
    }
    if (!stampedAt.date || typeof stampedAt.date !== "string") {
      fail(`${screenId}: stampedAt.date required`);
    }
  }
}

// ── Source contracts ────────────────────────────────────────────────────────
for (const screenId of required) {
  const srcRel = SCREEN_SOURCES[screenId];
  const mountRel = SCREEN_MOUNTS[screenId];
  if (!srcRel || !mountRel) {
    fail(
      `${screenId}: no SCREEN_SOURCES / SCREEN_MOUNTS mapping in check-page-final-pass.mjs`
    );
    continue;
  }

  const src = requireFile(srcRel);
  const mount = requireFile(mountRel);
  if (!src || !mount) continue;

  const extraSrc = (SCREEN_EXTRA_SOURCES[screenId] || [])
    .map((rel) => read(rel) || "")
    .join("\n");
  const code = stripComments(src + "\n" + extraSrc);

  // Root data-studio-react-screen
  const reactScreenRe = new RegExp(
    `data-studio-react-screen\\s*=\\s*\\{?["']${screenId}["']\\}?|data-studio-react-screen\\s*=\\s*\\{[A-Z0-9_]+\\}`
  );
  const hasReactScreenAttr = /data-studio-react-screen\s*=/.test(src);
  const screenIdConst =
    screenId === "plp"
      ? /PLP_REACT_SCREEN_ID|["']plp["']/.test(src)
      : screenId === "pdp"
        ? /PDP_REACT_SCREEN_ID|["']pdp["']/.test(src)
        : screenId === "site-pilot"
          ? /HOME_REACT_SCREEN_ID|["']site-pilot["']/.test(src)
          : screenId === "appointment-history"
            ? /APPOINTMENT_HISTORY_REACT_SCREEN_ID|["']appointment-history["']/.test(
                src
              )
            : screenId === "appointment-details"
              ? /APPOINTMENT_DETAILS_REACT_SCREEN_ID|["']appointment-details["']/.test(
                  src
                )
              : new RegExp(
                  `BOOK_STEP${screenId.slice(-1)}_REACT_SCREEN_ID|["']${screenId}["']`
                ).test(src) || new RegExp(`["']${screenId}["']`).test(src);

  if (!hasReactScreenAttr || !screenIdConst) {
    fail(
      `${screenId}: source ${srcRel} must stamp data-studio-react-screen for this screenId`
    );
  } else if (
    !reactScreenRe.test(src) &&
    !/data-studio-react-screen=\{[A-Z0-9_]+\}/.test(src)
  ) {
    fail(
      `${screenId}: data-studio-react-screen binding not found in ${srcRel}`
    );
  }

  // Legacy-retired on mount (shared helper detaches + stamps data-studio-legacy-retired)
  if (
    !/dataset.studioLegacyRetired\s*=/.test(mount) &&
    !/data-studio-legacy-retired/.test(mount) &&
    !/retireLegacyUnderPage\s*\(/.test(mount)
  ) {
    fail(
      `${screenId}: mount ${mountRel} must call retireLegacyUnderPage (or stamp data-studio-legacy-retired)`
    );
  }

  // BEM block = screenId on root
  const bemRoot = new RegExp(
    `className=["']${screenId}(?:\\s|["'])|className=\\{\\s*["']${screenId}["']`
  );
  if (!bemRoot.test(code)) {
    fail(
      `${screenId}: root className must use BEM block "${screenId}" (NAMING.md)`
    );
  }

  // Semantic landmarks (critical structure)
  if (!/<main[\s>]/.test(code)) {
    fail(
      `${screenId}: missing <main> landmark (PAGE_FINAL_PASS semanticHtml)`
    );
  }
  if (
    !HEADER_LANDMARK_OPTIONAL.has(screenId) &&
    !/<header[\s>]/.test(code)
  ) {
    fail(
      `${screenId}: missing <header> landmark for crumbs band (PAGE_FINAL_PASS semanticHtml)`
    );
  }

  // UXDS kits where applicable
  if (SEARCH_REQUIRED.has(screenId)) {
    const hasSearch =
      /<SearchField[\s>]/.test(code) ||
      /data-studio-search-icon\s*=\s*["']true["']/.test(src);
    if (!hasSearch) {
      fail(
        `${screenId}: must use UXDS SearchField or stamp data-studio-search-icon="true"`
      );
    }
    if (screenId === "plp" && !/<SearchField[\s>]/.test(code)) {
      fail(`${screenId}: PLP filter search must use <SearchField>`);
    }
  }

  if (BUTTON_PRIMARY_REQUIRED.has(screenId)) {
    if (!/<ButtonPrimary[\s>]/.test(code)) {
      fail(
        `${screenId}: primary commerce CTA must use <ButtonPrimary> (UXDS kit)`
      );
    }
  }

  // Accordion bands — must use shared UXDS Accordion kit (interactive; no dead headers).
  if (ACCORDION_REQUIRED.has(screenId)) {
    if (
      !/from\s+["']@\/uxds\/interactions["']/.test(src) ||
      !/<Accordion[\s>]/.test(code)
    ) {
      fail(
        `${screenId}: expand/collapse band must use UXDS <Accordion> kit (reusable interactive)`
      );
    }
  }

  // PLP: no invented filter separators
  if (screenId === "plp") {
    const css = requireFile(
      "src/projects/boots-pharmacy/screens/plp/plp.css"
    );
    if (css) {
      const filterSection = css.match(
        /\.plp__filter-section\s*\{[^}]*\}/
      );
      if (
        filterSection &&
        /border-(?:top|bottom)\s*:/.test(filterSection[0])
      ) {
        fail(
          `${screenId}: .plp__filter-section must not invent border separators (Legacy has none)`
        );
      }
    }
  }
}

printAndExit();

function printAndExit() {
  if (errors.length) {
    console.error("[check:page-final-pass] FAIL — page final-pass gate:\n");
    for (const e of errors) console.error(`  • ${e}`);
    console.error(
      `\n[check:page-final-pass] ${errors.length} violation(s). Stamp docs/projects/<id>/audits/PAGE_FINAL_PASS.json + fix source contracts. See docs/product/PAGE_FINAL_PASS.md — cannot start NEXT page (e.g. PDP) until proven.`
    );
    process.exit(1);
  }
  console.log(
    `[check:page-final-pass] OK — ${required.length} React-migrated screen(s) final-pass proven + source contracts`
  );
}
