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
 *
 * Companion gates (also in npm test):
 *  - check:hygiene · check:links · check:version · check:parity-proven
 *
 * Concept LEGACY `.proto-*` in globals-*.css / Make wire / UXDS link aliases = OK until screen retire.
 * Policy: docs/product/NAMING.md · COMMAND_DOCTRINE.md
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

if (errors.length) {
  console.error("[check:felonies] FAIL — agent felony gate:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error(
    `\n[check:felonies] ${errors.length} violation(s). See NAMING.md + COMMAND_DOCTRINE.md`
  );
  process.exit(1);
}

console.log(
  "[check:felonies] OK — filenames, PANEL CSS, data-proto, BOOTS stubs, channel, version chip, overlay eyes"
);
