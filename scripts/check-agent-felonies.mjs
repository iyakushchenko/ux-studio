#!/usr/bin/env node
/**
 * Agent felony gate — FAIL npm test when agents violate hard laws.
 * Lean, Summarizer-inspired: fast walk + string scans. No Playwright.
 *
 * Felonies:
 *  1. Filenames starting with proto / Proto under src, scripts, docs
 *  2. .proto-* selectors in PANEL CSS (src/app CSS) — chrome must be .studio-*
 *  3. data-proto-* attrs in src/app (engine) — use data-studio-*
 *  4. New docs/product/BOOTS_* files (thin Moved stubs allowlisted)
 *  5. studioRelease channel must be alpha|beta|rc|stable
 *  6. version chip must track package.json (no hardcoded UI semver; JSON import present)
 *  7. Overlay eyes — probe/demo-click must guard under-overlay clicks; known modals registered
 *  8. Modal URL sync registry — every popup syncs `&modal=` on open
 *  9. Probe teardown — finally forceClear path + resetStudioAfterAgentTest strips `&modal=`
 * 10. Auth SSoT — studioAuthSession / __studioIsLoggedIn used for logged-in branching
 *
 * Companion gates (also in npm test):
 *  - check:hygiene · check:links · check:version · check:parity-* · check:theme-brand
 *  - check:page-final-pass
 *
 * Concept LEGACY `.proto-*` in globals-*.css / Make wire / UXDS link aliases = OK until screen retire.
 * Policy: docs/product/NAMING.md · COMMAND_DOCTRINE.md · STUDIO_AUTO_RULES.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SKIP_DIR = new Set([
  "node_modules",
  "dist",
  ".git",
  "playwright-out",
  "imports",
  "frame",
]);

/** Thin Moved stubs — fail if they grow past a redirect. */
const BOOTS_STUB_ALLOW = new Set([
  "docs/product/BOOTS_BOOK_STEP1_DESIGN_DELTA.md",
  "docs/product/BOOTS_BOOK_STEP2_DESIGN_DELTA.md",
  "docs/product/BOOTS_BOOK_STEP3_DESIGN_DELTA.md",
  "docs/product/BOOTS_REACT_SCREEN_PILOT.md",
]);

/** UXDS may keep Make class aliases for one-pattern link contract. */
const PROTO_CSS_ALLOW = new Set([
  "src/uxds/components/text-link.css",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (ent.isDirectory()) {
      if (rel === "src/app/components") continue;
      walk(full, out);
    } else {
      out.push({ full, rel, base: ent.name });
    }
  }
  return out;
}

const errors = [];
const fail = (msg) => errors.push(msg);

// --- 1) proto* filenames ---
for (const rootName of ["src", "scripts", "docs"]) {
  for (const { rel, base } of walk(path.join(ROOT, rootName))) {
    if (/^proto/i.test(base)) {
      fail(`proto* filename forbidden: ${rel}`);
    }
  }
}

// --- 2) PANEL CSS: no .proto-* selectors ---
const PROTO_CLASS_RE = /\.proto-[a-zA-Z0-9_-]+/;
for (const { full, rel } of walk(path.join(ROOT, "src", "app"))) {
  if (!rel.endsWith(".css")) continue;
  if (PROTO_CSS_ALLOW.has(rel)) continue;
  const text = fs.readFileSync(full, "utf8");
  if (!PROTO_CLASS_RE.test(text)) continue;
  const hits = text
    .split(/\r?\n/)
    .map((line, i) => ({ line, i: i + 1 }))
    .filter(({ line }) => PROTO_CLASS_RE.test(line));
  for (const h of hits.slice(0, 8)) {
    fail(`PANEL CSS .proto-* forbidden: ${rel}:${h.i}`);
  }
}

// --- 3) data-proto-* in engine src/app ---
const DATA_PROTO_RE = /data-proto-[a-zA-Z0-9_-]+/;
for (const { full, rel } of walk(path.join(ROOT, "src", "app"))) {
  if (!/\.(ts|tsx|css|mjs|js)$/.test(rel)) continue;
  const text = fs.readFileSync(full, "utf8");
  if (!DATA_PROTO_RE.test(text)) continue;
  const hits = text
    .split(/\r?\n/)
    .map((line, i) => ({ line, i: i + 1 }))
    .filter(
      ({ line }) =>
        DATA_PROTO_RE.test(line) &&
        !/no new|forbid|forbidden|must not|prefer data-studio/i.test(line)
    );
  for (const h of hits.slice(0, 5)) {
    fail(`data-proto-* in engine: ${rel}:${h.i}`);
  }
}

// --- 4) docs/product/BOOTS_* ---
const productDocs = path.join(ROOT, "docs", "product");
if (fs.existsSync(productDocs)) {
  for (const ent of fs.readdirSync(productDocs, { withFileTypes: true })) {
    if (!ent.isFile() || !/^BOOTS_/i.test(ent.name)) continue;
    const rel = `docs/product/${ent.name}`;
    if (BOOTS_STUB_ALLOW.has(rel)) {
      const body = fs.readFileSync(path.join(productDocs, ent.name), "utf8");
      if (body.split(/\r?\n/).length > 8 || !/Moved|Canonical/i.test(body)) {
        fail(
          `${rel} is no longer a thin Moved stub — keep content under docs/projects/`
        );
      }
      continue;
    }
    fail(`project doc under docs/product/ forbidden: ${rel}`);
  }
}

// --- 5) studioRelease channel ---
const releasePath = path.join(ROOT, "src", "app", "shell", "studioRelease.ts");
if (!fs.existsSync(releasePath)) {
  fail("missing src/app/shell/studioRelease.ts");
} else {
  const releaseSrc = fs.readFileSync(releasePath, "utf8");
  if (
    !/STUDIO_RELEASE_CHANNEL[^=]*=\s*"(alpha|beta|rc|stable)"/.test(releaseSrc)
  ) {
    fail(
      'studioRelease.ts must set STUDIO_RELEASE_CHANNEL = "alpha"|"beta"|"rc"|"stable"'
    );
  }
}

// --- 6) version chip ↔ package.json (no drift / no hardcoded UI semver) ---
const pkgVersion = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
      .version;
  } catch {
    return null;
  }
})();
if (!pkgVersion || !/^\d+\.\d+\.\d+$/.test(pkgVersion)) {
  fail("package.json missing valid semver version");
} else if (fs.existsSync(releasePath)) {
  const releaseSrc = fs.readFileSync(releasePath, "utf8");
  if (!/from\s+["'](?:\.\.\/)+package\.json["']/.test(releaseSrc)) {
    fail(
      "studioRelease.ts must import package.json (live semver for version chip)"
    );
  }
  // Hardcoded ship numbers in release module (allow 0.0.0 fallback only).
  const hardcoded = releaseSrc.match(/["'](\d+\.\d+\.\d+)["']/g) || [];
  for (const hit of hardcoded) {
    const n = hit.replace(/["']/g, "");
    if (n !== "0.0.0") {
      fail(
        `studioRelease.ts must not hardcode ship semver ${hit} — use package.json`
      );
    }
  }
}
const versionChipPath = path.join(
  ROOT,
  "src",
  "app",
  "nav",
  "StudioNavVersionChip.tsx"
);
if (fs.existsSync(versionChipPath)) {
  const chipSrc = fs.readFileSync(versionChipPath, "utf8");
  if (!/getStudioRelease/.test(chipSrc)) {
    fail("StudioNavVersionChip must call getStudioRelease()");
  }
  if (/["'`]\d+\.\d+\.\d+["'`]/.test(chipSrc) || /v\d+\.\d+\.\d+/.test(chipSrc)) {
    fail(
      "StudioNavVersionChip must not hardcode a version string — use getStudioRelease()"
    );
  }
}

// --- 7) Overlay eyes — registry + probe/demo-click guard (PO rage hard fail) ---
const REQUIRED_OVERLAY_IDS = [
  "choose-pharmacy",
  "quick-view",
  "login",
  "vaccine-picker",
  "recipient-picker",
];
const modalGuardPath = path.join(
  ROOT,
  "src",
  "app",
  "shell",
  "studioModalGuard.ts"
);
if (!fs.existsSync(modalGuardPath)) {
  fail("missing src/app/shell/studioModalGuard.ts (overlay registry)");
} else {
  const guardSrc = fs.readFileSync(modalGuardPath, "utf8");
  if (!/REGISTERED_OVERLAY_MODAL_IDS/.test(guardSrc)) {
    fail("studioModalGuard must export REGISTERED_OVERLAY_MODAL_IDS");
  }
  for (const id of REQUIRED_OVERLAY_IDS) {
    if (!guardSrc.includes(`"${id}"`) && !guardSrc.includes(`'${id}'`)) {
      fail(`overlay registry missing modal id "${id}" in studioModalGuard.ts`);
    }
    if (!guardSrc.includes(`[data-studio-modal="${id}"]`)) {
      // BLOCKING_MODAL_SELECTOR may build from REGISTERED_OVERLAY_MODAL_IDS map
      if (!/REGISTERED_OVERLAY_MODAL_IDS\.map/.test(guardSrc)) {
        fail(
          `BLOCKING_MODAL_SELECTOR must include [data-studio-modal="${id}"] or map REGISTERED_OVERLAY_MODAL_IDS`
        );
      }
    }
  }
}

const demoCursorPath = path.join(
  ROOT,
  "src",
  "app",
  "scenario",
  "demoCursor.ts"
);
if (!fs.existsSync(demoCursorPath)) {
  fail("missing src/app/scenario/demoCursor.ts");
} else {
  const demoSrc = fs.readFileSync(demoCursorPath, "utf8");
  if (
    !/resolveClickTargetRespectingModal|isElementBlockedByModal/.test(demoSrc)
  ) {
    fail(
      "FELONY: simulateDemoPointerClick path must import overlay guard (resolveClickTargetRespectingModal / isElementBlockedByModal)"
    );
  }
  // Guard must appear inside simulateDemoPointerClick body (not only unused import).
  const fnIdx = demoSrc.indexOf("export async function simulateDemoPointerClick");
  if (fnIdx < 0) {
    fail("simulateDemoPointerClick export missing");
  } else {
    const body = demoSrc.slice(fnIdx, fnIdx + 1200);
    if (
      !/resolveClickTargetRespectingModal|isElementBlockedByModal/.test(body)
    ) {
      fail(
        "FELONY: simulateDemoPointerClick must call overlay guard before clicking"
      );
    }
  }
}

const pageProbePath = path.join(
  ROOT,
  "src",
  "app",
  "shell",
  "studioMcpPageProbe.ts"
);
if (!fs.existsSync(pageProbePath)) {
  fail("missing src/app/shell/studioMcpPageProbe.ts");
} else {
  const probeSrc = fs.readFileSync(pageProbePath, "utf8");
  if (!/isElementBlockedByModal|isBlockingModalOpen|refuse-click/.test(probeSrc)) {
    fail(
      "FELONY: __studioRunMcpPageProbe must refuse under-overlay clicks (refuse-click / modal guard)"
    );
  }
}

/** DOM mounts must stamp data-studio-modal for registered overlays. */
const OVERLAY_DOM_EXPECT = [
  {
    rel: "src/projects/boots-pharmacy/overlays/AvailabilityTool.tsx",
    id: "choose-pharmacy",
  },
  {
    rel: "src/projects/boots-pharmacy/popups/QuickViewPopup.tsx",
    id: "quick-view",
  },
  {
    rel: "src/projects/boots-pharmacy/popups/LoginPopup.tsx",
    id: "login",
  },
  {
    rel: "src/projects/boots-pharmacy/popups/VaccinePickerPopup.tsx",
    id: "vaccine-picker",
  },
  {
    rel: "src/projects/boots-pharmacy/popups/RecipientPickerPopup.tsx",
    id: "recipient-picker",
  },
];
for (const { rel, id } of OVERLAY_DOM_EXPECT) {
  const full = path.join(ROOT, ...rel.split("/"));
  if (!fs.existsSync(full)) {
    fail(`overlay mount missing: ${rel}`);
    continue;
  }
  const src = fs.readFileSync(full, "utf8");
  if (!src.includes(`data-studio-modal="${id}"`)) {
    fail(`FELONY: ${rel} must set data-studio-modal="${id}"`);
  }
}

// --- 8) Modal URL sync registry — every popup must sync `&modal=` on open ---
const modalRegistryPath = path.join(
  ROOT,
  "src",
  "app",
  "shell",
  "studioModalRegistry.ts"
);
if (!fs.existsSync(modalRegistryPath)) {
  fail("missing src/app/shell/studioModalRegistry.ts (modal URL registry)");
} else {
  const regSrc = fs.readFileSync(modalRegistryPath, "utf8");
  if (!/export const STUDIO_MODAL_REGISTRY/.test(regSrc)) {
    fail("studioModalRegistry must export STUDIO_MODAL_REGISTRY");
  }
  if (!/resolveStudioModalIdFromFlags/.test(regSrc)) {
    fail("studioModalRegistry must export resolveStudioModalIdFromFlags");
  }
  if (!/applyStudioModalFromUrl/.test(regSrc)) {
    fail("studioModalRegistry must export applyStudioModalFromUrl");
  }
  if (!/STUDIO_MODAL_REGISTRY_IDS/.test(regSrc)) {
    fail("studioModalRegistry must export STUDIO_MODAL_REGISTRY_IDS (literal id list)");
  }
  for (const id of REQUIRED_OVERLAY_IDS) {
    if (!regSrc.includes(`"${id}"`) && !regSrc.includes(`'${id}'`)) {
      fail(
        `FELONY: STUDIO_MODAL_REGISTRY / STUDIO_MODAL_REGISTRY_IDS missing modal id "${id}"`
      );
    }
  }
  // Each registry entry must declare urlSync + open/close helpers.
  const entryBlocks = [
    ...regSrc.matchAll(
      /\{\s*id:\s*STUDIO_MODAL\.\w+[\s\S]*?mountRel:\s*"[^"]+"/g
    ),
  ];
  if (entryBlocks.length < REQUIRED_OVERLAY_IDS.length) {
    fail(
      `FELONY: STUDIO_MODAL_REGISTRY must list ≥${REQUIRED_OVERLAY_IDS.length} entries with id+mountRel (found ${entryBlocks.length})`
    );
  }
  for (const m of entryBlocks) {
    const block = m[0];
    if (!/urlSync:\s*true/.test(block)) {
      fail("FELONY: every STUDIO_MODAL_REGISTRY entry must set urlSync: true");
    }
    if (!/openHelper:\s*"[A-Za-z0-9_]+"/.test(block)) {
      fail("FELONY: registry entry missing openHelper string");
    }
    if (!/closeHelper:\s*"[A-Za-z0-9_]+"/.test(block)) {
      fail("FELONY: registry entry missing closeHelper string");
    }
  }
}

const appPath = path.join(ROOT, "src", "app", "App.tsx");
const modalBridgePath = path.join(
  ROOT,
  "src",
  "app",
  "shell",
  "useStudioModalUrlBridge.ts"
);
if (!fs.existsSync(appPath)) {
  fail("missing src/app/App.tsx");
} else {
  const appSrc = fs.readFileSync(appPath, "utf8");
  const bridgeSrc = fs.existsSync(modalBridgePath)
    ? fs.readFileSync(modalBridgePath, "utf8")
    : "";
  const modalSyncSrc = `${appSrc}\n${bridgeSrc}`;
  if (!/resolveStudioModalIdFromFlags/.test(modalSyncSrc)) {
    fail(
      "FELONY: App / useStudioModalUrlBridge must derive modalId via resolveStudioModalIdFromFlags"
    );
  }
  if (!/useStudioModalUrlBridge/.test(appSrc)) {
    fail("FELONY: App.tsx must use useStudioModalUrlBridge for modal URL sync");
  }
  if (!/applyStudioModalFromUrl|applyStudioModal/.test(modalSyncSrc)) {
    fail(
      "FELONY: App / bridge must apply modals via applyStudioModal / applyStudioModalFromUrl"
    );
  }
  // Must not hard-wire only choose-pharmacy into modalId.
  if (
    /modalId:\s*wire\?\.availabilityOpen\s*\?\s*STUDIO_MODAL\.choosePharmacy/.test(
      modalSyncSrc
    )
  ) {
    fail(
      "FELONY: still syncs only choose-pharmacy — use resolveStudioModalIdFromFlags"
    );
  }
}

const wirePath = path.join(
  ROOT,
  "src",
  "projects",
  "boots-pharmacy",
  "wire",
  "BootsPharmacyProjectView.tsx"
);
if (!fs.existsSync(wirePath)) {
  fail("missing BootsPharmacyProjectView.tsx");
} else {
  const wireSrc = fs.readFileSync(wirePath, "utf8");
  const OPEN_HELPERS = [
    "openAvailabilityTool",
    "openQuickView",
    "openLoginPopup",
    "openVaccinePicker",
    "openRecipientPicker",
  ];
  for (const helper of OPEN_HELPERS) {
    if (!new RegExp(`\\b${helper}\\b`).test(wireSrc)) {
      fail(`FELONY: wire missing registered open helper ${helper}`);
    }
  }
  if (!/\bapplyStudioModal\b/.test(wireSrc)) {
    fail("FELONY: wire must expose applyStudioModal for URL / popstate / replay");
  }
  // Direct open setters must live only inside registered helpers (no orphan opens).
  const OPEN_SETTERS = [
    { setter: "setQuickViewOpen(true)", helper: "openQuickView" },
    { setter: "setLoginPopupOpen(true)", helper: "openLoginPopup" },
    { setter: "setVaccinePickerOpen(true)", helper: "openVaccinePicker" },
    { setter: "setRecipientPickerOpen(true)", helper: "openRecipientPicker" },
  ];
  for (const { setter, helper } of OPEN_SETTERS) {
    let from = 0;
    let count = 0;
    while (true) {
      const idx = wireSrc.indexOf(setter, from);
      if (idx < 0) break;
      count++;
      const before = wireSrc.slice(Math.max(0, idx - 220), idx);
      if (!new RegExp(`${helper}\\s*=`).test(before)) {
        fail(
          `FELONY: ${setter} outside registered helper ${helper} — open must go through helper (URL sync)`
        );
      }
      from = idx + setter.length;
    }
    if (count < 1) {
      fail(`FELONY: expected ${setter} inside ${helper}`);
    }
  }
  // Availability open setter must be reached only via openAvailabilityTool.
  {
    let from = 0;
    let orphan = 0;
    let viaHelper = 0;
    while (true) {
      const idx = wireSrc.indexOf("setAvailabilityOpen(true)", from);
      if (idx < 0) break;
      const before = wireSrc.slice(Math.max(0, idx - 400), idx);
      if (/openAvailabilityTool\s*=/.test(before)) viaHelper++;
      else orphan++;
      from = idx + "setAvailabilityOpen(true)".length;
    }
    if (viaHelper < 1) {
      fail("FELONY: openAvailabilityTool must call setAvailabilityOpen(true)");
    }
    if (orphan > 0) {
      fail(
        "FELONY: setAvailabilityOpen(true) outside openAvailabilityTool — modal URL would desync"
      );
    }
  }
}

// --- 9) Auto-Rule agent-teardown-clean — sticky modal/overlay after probe = felony ---
{
  const RULE_ID = "agent-teardown-clean";
  const contractPath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "studioAgentTeardownContract.ts"
  );
  const catalogPath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "studioAutoRules.ts"
  );
  const urlPath = path.join(ROOT, "src", "app", "shell", "studioUrl.ts");
  const probePath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "studioMcpPageProbe.ts"
  );
  const sessionPath = path.join(ROOT, "src", "app", "shell", "mcpTestSession.ts");
  const helpersPath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "studioMcpHelpers.ts"
  );

  if (!fs.existsSync(contractPath)) {
    fail(
      `FELONY ${RULE_ID}: missing studioAgentTeardownContract.ts (Auto-Rule contract)`
    );
  } else {
    const contractSrc = fs.readFileSync(contractPath, "utf8");
    if (!contractSrc.includes(`"${RULE_ID}"`)) {
      fail(
        `FELONY ${RULE_ID}: contract must export id literal "${RULE_ID}"`
      );
    }
    if (!/assertStudioAgentTeardownClean/.test(contractSrc)) {
      fail(
        `FELONY ${RULE_ID}: contract must export assertStudioAgentTeardownClean`
      );
    }
    if (!/__studioAssertAgentTeardownClean/.test(contractSrc)) {
      fail(
        `FELONY ${RULE_ID}: contract must wire window.__studioAssertAgentTeardownClean`
      );
    }
    if (!/__studioWaitAgentTeardownClean|waitForStudioAgentTeardownClean/.test(contractSrc)) {
      fail(
        `FELONY ${RULE_ID}: contract must export waitForStudioAgentTeardownClean for MCP prove`
      );
    }
  }

  if (!fs.existsSync(catalogPath)) {
    fail(`FELONY ${RULE_ID}: missing studioAutoRules.ts catalog for Arch CI`);
  } else {
    const catalogSrc = fs.readFileSync(catalogPath, "utf8");
    if (!catalogSrc.includes(`"${RULE_ID}"`) && !/STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID/.test(catalogSrc)) {
      fail(`FELONY ${RULE_ID}: studioAutoRules catalog must list the rule id`);
    }
    if (!/export const STUDIO_AUTO_RULES/.test(catalogSrc)) {
      fail("FELONY agent-teardown-clean: studioAutoRules must export STUDIO_AUTO_RULES");
    }
  }

  if (!fs.existsSync(urlPath)) {
    fail("FELONY agent-teardown-clean: missing studioUrl.ts");
  } else {
    const urlSrc = fs.readFileSync(urlPath, "utf8");
    // Stay builder must not copy modalId from current URL (sticky felony).
    if (/modalId:\s*current\.modalId/.test(urlSrc)) {
      fail(
        `FELONY ${RULE_ID}: buildStudioPostAgentStayState must not preserve current.modalId`
      );
    }
    if (!/modalId:\s*undefined/.test(urlSrc)) {
      fail(
        `FELONY ${RULE_ID}: resetStudioAfterAgentTest must force modalId: undefined`
      );
    }
  }

  if (!fs.existsSync(appPath)) {
    fail("FELONY agent-teardown-clean: missing App.tsx");
  } else {
    const appSrc = fs.readFileSync(appPath, "utf8");
    if (!/STUDIO_POST_AGENT_RESET_EVENT/.test(appSrc)) {
      fail(
        `FELONY ${RULE_ID}: App must listen for STUDIO_POST_AGENT_RESET_EVENT`
      );
    }
    if (!/closeAllPopups\(\)/.test(appSrc)) {
      fail(
        `FELONY ${RULE_ID}: post-agent reset must call closeAllPopups()`
      );
    }
    // Must force modalId: undefined (not state?.modalId) on post-agent apply.
    if (/modalId:\s*state\?\.modalId/.test(appSrc)) {
      fail(
        `FELONY ${RULE_ID}: App onPostAgentReset must not re-apply state?.modalId`
      );
    }
    if (!/modalId:\s*undefined/.test(appSrc)) {
      fail(
        `FELONY ${RULE_ID}: App onPostAgentReset must set modalId: undefined`
      );
    }
  }

  for (const [rel, full] of [
    ["studioMcpPageProbe.ts", probePath],
    ["mcpTestSession.ts", sessionPath],
  ]) {
    if (!fs.existsSync(full)) {
      fail(`FELONY ${RULE_ID}: missing ${rel}`);
      continue;
    }
    const src = fs.readFileSync(full, "utf8");
    if (!/resetStudioAfterAgentTest/.test(src)) {
      fail(
        `FELONY ${RULE_ID}: ${rel} finally must call resetStudioAfterAgentTest (strip &modal=)`
      );
    }
  }

  if (!fs.existsSync(helpersPath)) {
    fail("FELONY agent-teardown-clean: missing studioMcpHelpers.ts");
  } else {
    const helpersSrc = fs.readFileSync(helpersPath, "utf8");
    if (!/installStudioAgentTeardownContractApi/.test(helpersSrc)) {
      fail(
        `FELONY ${RULE_ID}: studioMcpHelpers must installStudioAgentTeardownContractApi`
      );
    }
  }

  const overlayPath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "agentTestingOverlay.ts"
  );
  if (!fs.existsSync(overlayPath)) {
    fail("FELONY agent-teardown-clean: missing agentTestingOverlay.ts");
  } else {
    const overlaySrc = fs.readFileSync(overlayPath, "utf8");
    if (!/resetStudioAfterAgentTest|safeResetStudio/.test(overlaySrc)) {
      fail(
        `FELONY ${RULE_ID}: forceClear/stop path must call resetStudioAfterAgentTest`
      );
    }
    if (!/export function forceClearAgentTestingOverlay/.test(overlaySrc)) {
      fail(`FELONY ${RULE_ID}: forceClearAgentTestingOverlay must remain exported`);
    }
  }

  const armPath = path.join(ROOT, "src", "app", "shell", "helperOverlayArm.ts");
  if (!fs.existsSync(armPath)) {
    fail(`FELONY ${RULE_ID}: missing helperOverlayArm.ts`);
  } else {
    const armSrc = fs.readFileSync(armPath, "utf8");
    if (!/AssertAgentTeardownClean/.test(armSrc) || !/WaitAgentTeardownClean/.test(armSrc)) {
      fail(
        `FELONY ${RULE_ID}: helperOverlayArm must treat Assert/WaitAgentTeardownClean as read-only (no re-arm)`
      );
    }
  }
}

// --- 10) Auth SSoT — studioAuthSession / __studioIsLoggedIn -----------------
{
  const RULE_ID = "auth-ssot";
  const authPath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "studioAuthSession.ts"
  );
  const catalogPath = path.join(
    ROOT,
    "src",
    "app",
    "shell",
    "studioAutoRules.ts"
  );

  if (!fs.existsSync(catalogPath)) {
    fail(`FELONY ${RULE_ID}: missing studioAutoRules.ts`);
  } else {
    const catalogSrc = fs.readFileSync(catalogPath, "utf8");
    for (const id of [
      "agent-teardown-clean",
      "auth-ssot",
      "avail-logged-out-start",
      "pdp-rtb-rhythm",
      "theme-brand-active",
      "robo-cursor-native-feedback",
      "fixed-localhost-reuse-tab",
    ]) {
      if (!catalogSrc.includes(`"${id}"`) && !catalogSrc.includes(`'${id}'`)) {
        fail(
          `FELONY ${RULE_ID}: studioAutoRules catalog missing id "${id}" (see STUDIO_AUTO_RULES.md)`
        );
      }
    }
  }

  // --- 11) Auto-Rule fixed-localhost-reuse-tab — Vite must not silently bump ports ---
  {
    const RULE_ID = "fixed-localhost-reuse-tab";
    const vitePath = path.join(ROOT, "vite.config.ts");
    if (!fs.existsSync(vitePath)) {
      fail(`FELONY ${RULE_ID}: missing vite.config.ts`);
    } else {
      const viteSrc = fs.readFileSync(vitePath, "utf8");
      if (!/\bport:\s*5173\b/.test(viteSrc)) {
        fail(
          `FELONY ${RULE_ID}: vite.config.ts must set server.port: 5173 (canonical http://localhost:5173)`
        );
      }
      if (!/\bstrictPort:\s*true\b/.test(viteSrc)) {
        fail(
          `FELONY ${RULE_ID}: vite.config.ts must set server.strictPort: true (never silent port bump)`
        );
      }
    }
    const autoRulesDoc = path.join(
      ROOT,
      "docs",
      "product",
      "STUDIO_AUTO_RULES.md"
    );
    if (fs.existsSync(autoRulesDoc)) {
      const doc = fs.readFileSync(autoRulesDoc, "utf8");
      if (!doc.includes("fixed-localhost-reuse-tab")) {
        fail(
          `FELONY ${RULE_ID}: STUDIO_AUTO_RULES.md must document fixed-localhost-reuse-tab`
        );
      }
      if (!doc.includes("list_pages") || !doc.includes("new_page")) {
        fail(
          `FELONY ${RULE_ID}: STUDIO_AUTO_RULES.md must stamp Chrome MCP list_pages / new_page reuse practice`
        );
      }
    }
  }

  if (!fs.existsSync(authPath)) {
    fail(`FELONY ${RULE_ID}: missing src/app/shell/studioAuthSession.ts`);
  } else {
    const authSrc = fs.readFileSync(authPath, "utf8");
    if (!/export function isStudioLoggedIn/.test(authSrc)) {
      fail(`FELONY ${RULE_ID}: must export isStudioLoggedIn`);
    }
    if (!/export function setStudioLoggedIn/.test(authSrc)) {
      fail(`FELONY ${RULE_ID}: must export setStudioLoggedIn`);
    }
    if (!/window\.__studioIsLoggedIn\s*=/.test(authSrc)) {
      fail(`FELONY ${RULE_ID}: must install window.__studioIsLoggedIn`);
    }
    if (!/window\.__studioSetLoggedIn\s*=/.test(authSrc)) {
      fail(`FELONY ${RULE_ID}: must install window.__studioSetLoggedIn`);
    }
  }

  const availIntentPath = path.join(
    ROOT,
    "src",
    "projects",
    "boots-pharmacy",
    "wire",
    "resolveAvailIntent.ts"
  );
  if (fs.existsSync(availIntentPath)) {
    const intentSrc = fs.readFileSync(availIntentPath, "utf8");
    if (!/isStudioLoggedIn/.test(intentSrc)) {
      fail(
        `FELONY ${RULE_ID}: resolveAvailIntent must use isStudioLoggedIn`
      );
    }
    if (!/from\s+["']@\/app\/shell\/studioAuthSession["']/.test(intentSrc)) {
      fail(
        `FELONY ${RULE_ID}: resolveAvailIntent must import from studioAuthSession`
      );
    }
  }

  if (fs.existsSync(pageProbePath)) {
    const probeSrc = fs.readFileSync(pageProbePath, "utf8");
    if (!/__studioIsLoggedIn/.test(probeSrc)) {
      fail(
        `FELONY ${RULE_ID}: studioMcpPageProbe must read window.__studioIsLoggedIn`
      );
    }
  }

  const headerMount = path.join(
    ROOT,
    "src",
    "projects",
    "boots-pharmacy",
    "chrome",
    "headerMount.tsx"
  );
  if (fs.existsSync(headerMount)) {
    const hdr = fs.readFileSync(headerMount, "utf8");
    if (/export function isHeaderLoggedIn/.test(hdr)) {
      const alias = hdr.match(
        /export function isHeaderLoggedIn[\s\S]{0,160}?^\}/m
      );
      if (alias && !/isStudioLoggedIn\(\)/.test(alias[0])) {
        fail(
          `FELONY ${RULE_ID}: isHeaderLoggedIn must alias isStudioLoggedIn()`
        );
      }
    }
  }

  if (
    !fs.existsSync(path.join(ROOT, "docs", "product", "STUDIO_AUTO_RULES.md"))
  ) {
    fail("FELONY: missing docs/product/STUDIO_AUTO_RULES.md");
  }
}

if (errors.length) {
  console.error("[check:felonies] FAIL — agent felony gate:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error(
    `\n[check:felonies] ${errors.length} violation(s). See NAMING.md + COMMAND_DOCTRINE.md + STUDIO_AUTO_RULES.md`
  );
  process.exit(1);
}

console.log(
  "[check:felonies] OK — filenames, PANEL CSS, data-proto, BOOTS stubs, channel, version chip, overlay eyes, modal URL sync, agent-teardown-clean, auth-ssot, fixed-localhost-reuse-tab"
);
