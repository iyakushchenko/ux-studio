/**
 * Lean static guard: ONE text-link pattern (footer-like).
 *
 * Contract:
 *   - `.uxds-link` rest → no underline
 *   - `.uxds-link:hover` → underline
 *   - Book Step 1 "Learn more" uses `.uxds-link`
 *   - No competing rest-underline rules on `.uxds-link` outside hover
 *
 * Inspired by Summarizer `scripts/check-*.mjs` (cheap, no browser).
 * Wire: `npm run check:links` (also via `npm test`).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const TEXT_LINK_CSS = path.join(ROOT, "src/uxds/components/text-link.css");
const BOOK_STEP1_TSX = path.join(
  ROOT,
  "src/projects/boots-pharmacy/screens/book-step1/BookStep1LocationScreen.tsx"
);
const BOOK_STEP1_CSS = path.join(
  ROOT,
  "src/projects/boots-pharmacy/screens/book-step1/book-step1-location.css"
);

let failed = false;

function fail(msg) {
  failed = true;
  console.error(`[check-text-link-contract] FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`[check-text-link-contract] OK: ${msg}`);
}

function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Extract a CSS rule body for a selector (first match, non-greedy). */
function ruleBody(css, selectorPattern) {
  const re = new RegExp(
    `${selectorPattern}\\s*\\{([^}]*)\\}`,
    "m"
  );
  const m = css.match(re);
  return m ? m[1] : null;
}

function hasDecoration(body, value) {
  if (!body) return false;
  const none =
    /text-decoration(?:-line)?\s*:\s*none\b/.test(body) ||
    /text-decoration\s*:\s*none\b/.test(body);
  const underline = /text-decoration(?:-line)?\s*:\s*underline\b/.test(body);
  if (value === "none") return none && !underline;
  if (value === "underline") return underline;
  return false;
}

// ── 1. Canonical kit CSS ───────────────────────────────────────────────────
if (!fs.existsSync(TEXT_LINK_CSS)) {
  fail(`missing ${path.relative(ROOT, TEXT_LINK_CSS)}`);
} else {
  const raw = fs.readFileSync(TEXT_LINK_CSS, "utf8");
  const css = stripCssComments(raw);

  // Rest rule must include .uxds-link and set decoration none
  const restBody = ruleBody(
    css,
    "\\.uxds-link(?:\\s*,\\s*[^,{]+)*"
  );
  if (!restBody) {
    fail("could not find `.uxds-link` rest rule in text-link.css");
  } else if (!hasDecoration(restBody, "none")) {
    fail(
      "`.uxds-link` rest must be text-decoration: none (footer-like). Found competing underline at rest."
    );
  } else {
    ok("`.uxds-link` rest = no underline");
  }

  const hoverBody = ruleBody(
    css,
    "\\.uxds-link:hover(?:\\s*,\\s*[^,{]+)*"
  );
  if (!hoverBody) {
    fail("could not find `.uxds-link:hover` rule in text-link.css");
  } else if (!hasDecoration(hoverBody, "underline")) {
    fail("`.uxds-link:hover` must set text-decoration: underline");
  } else {
    ok("`.uxds-link:hover` = underline");
  }

  // Color must come from shared tokens (not anonymous hex in kit)
  if (!/var\(--uxds-text-link-link\)/.test(css)) {
    fail("text-link.css must use var(--uxds-text-link-link)");
  } else {
    ok("link color uses --uxds-text-link-link token");
  }

  // Aliases must share the same rule block (no near-dup fork)
  if (!/\.proto-avail-link/.test(css) || !/\.proto-recipient-picker__link/.test(css)) {
    fail("legacy aliases .proto-avail-link / .proto-recipient-picker__link must share .uxds-link rules");
  } else {
    ok("legacy aliases share the canonical rule");
  }
}

// ── 2. Book Step 1 Learn more uses .uxds-link ──────────────────────────────
if (!fs.existsSync(BOOK_STEP1_TSX)) {
  fail(`missing ${path.relative(ROOT, BOOK_STEP1_TSX)}`);
} else {
  const tsx = fs.readFileSync(BOOK_STEP1_TSX, "utf8");
  const learnMore =
    /Learn more[\s\S]{0,200}|className=["'][^"']*uxds-link[^"']*book-step1__learn-more|book-step1__learn-more[^"']*uxds-link/;
  const hasClass =
    /className=["'][^"']*\buxds-link\b[^"']*book-step1__learn-more/.test(tsx) ||
    /className=["'][^"']*book-step1__learn-more[^"']*\buxds-link\b/.test(tsx);
  if (!hasClass) {
    fail(
      'Book Step 1 "Learn more" must use className including uxds-link (see BookStep1LocationScreen.tsx)'
    );
  } else if (!/Learn more/.test(tsx)) {
    fail('Book Step 1 screen missing "Learn more" copy — contract target gone?');
  } else {
    ok('Book Step 1 "Learn more" uses .uxds-link');
  }
  // silence unused
  void learnMore;
}

// ── 3. Page CSS must not re-underline Learn more at rest ───────────────────
if (fs.existsSync(BOOK_STEP1_CSS)) {
  const pageCss = stripCssComments(fs.readFileSync(BOOK_STEP1_CSS, "utf8"));
  const learnRule = ruleBody(pageCss, "\\.book-step1__learn-more(?![:\\w-])");
  if (learnRule && /text-decoration(?:-line)?\s*:\s*underline\b/.test(learnRule)) {
    fail(
      "book-step1-location.css .book-step1__learn-more must not set underline (layout only; chrome in text-link.css)"
    );
  } else {
    ok("Book Step 1 page CSS does not fork Learn more underline");
  }
}

// ── 4. Forbidden: rest-underline on .uxds-link outside text-link.css hover ─
const SCAN_DIRS = [
  path.join(ROOT, "src/projects/boots-pharmacy/screens"),
  path.join(ROOT, "src/uxds/components"),
];
const FORBIDDEN =
  /\.uxds-link(?!:hover)[^{]*\{[^}]*text-decoration(?:-line)?\s*:\s*underline\b/;

for (const dir of SCAN_DIRS) {
  if (!fs.existsSync(dir)) continue;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const name of fs.readdirSync(cur)) {
      const full = path.join(cur, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!name.endsWith(".css")) continue;
      if (path.resolve(full) === path.resolve(TEXT_LINK_CSS)) continue;
      const body = stripCssComments(fs.readFileSync(full, "utf8"));
      if (FORBIDDEN.test(body)) {
        fail(
          `${path.relative(ROOT, full)}: competing .uxds-link rest underline — kill it; use text-link.css only`
        );
      }
    }
  }
}
ok("no competing .uxds-link rest-underline in screen/kit CSS");

if (failed) {
  console.error(
    "\n[check-text-link-contract] Text-link contract broken. Unify to footer-like: no underline rest, underline hover. See FE_STANDARDS §2."
  );
  process.exit(1);
}

console.log("[check-text-link-contract] all checks passed");
