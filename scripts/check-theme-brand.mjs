#!/usr/bin/env node
/**
 * Brand theme wins — FAIL when project theme does not drive interactive actives.
 *
 * PO rage: active pills/tabs show raw UXDS default teal while Boots primary differs.
 * Hook for Uma/Finn brand-primary pill ships — extend this file, do not fork.
 *
 * Policy: docs/product/STUDIO_AUTO_RULES.md (R5) · PROJECT_STYLEGUIDE.md · DS_STRICTNESS.md
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

/** UXDS default strong-selected fill (design.css) — must not win over Boots brand primary. */
const UXDS_DEFAULT_STRONG_SELECTED = "#305854";

const THEME_REL =
  "src/projects/boots-pharmacy/styleguide/theme.css";
const FILTER_CHIP_REL = "src/uxds/components/filter-chip.css";
const DESIGN_TOKENS_REL = "src/uxds/tokens/design.css";
const AVAIL_REL =
  "src/projects/boots-pharmacy/overlays/AvailabilityTool.tsx";

// ── 1) Project theme must define brand primary + remap filter-chip selected ──
{
  const theme = read(THEME_REL);
  if (!theme) {
    fail(`missing ${THEME_REL} (Boots theme required for brand-active gate)`);
  } else {
    if (!/\[data-studio-project\s*=\s*["']boots-pharmacy["']\]/.test(theme)) {
      fail(
        `${THEME_REL} must scope remaps under [data-studio-project="boots-pharmacy"]`
      );
    }
    const brandPrimary = theme.match(
      /--project-brand-primary\s*:\s*([^;]+);/
    );
    if (!brandPrimary) {
      fail(
        `RATCHET theme-brand: ${THEME_REL} must define --project-brand-primary`
      );
    } else {
      const primaryVal = brandPrimary[1].trim();
      // Brand primary must differ from UXDS :root strong-selected default so
      // theme application is observable (PO: not generic UXDS teal).
      if (
        new RegExp(`^${UXDS_DEFAULT_STRONG_SELECTED}$`, "i").test(primaryVal)
      ) {
        fail(
          `RATCHET theme-brand: --project-brand-primary must differ from UXDS default selected-strong ${UXDS_DEFAULT_STRONG_SELECTED}`
        );
      }
      if (!/^#[0-9a-fA-F]{6}$/.test(primaryVal) && !/^var\(/.test(primaryVal)) {
        fail(
          `RATCHET theme-brand: --project-brand-primary must be a hex or var() (got "${primaryVal}")`
        );
      }
    }
    // Selected strong must chain through brand primary (not a free hex that
    // accidentally matches UXDS default #305854 while primary is #467672).
    const selectedRemap = theme.match(
      /--uxds-filter-chip-surface-selected-strong\s*:\s*([^;]+);/
    );
    if (!selectedRemap) {
      fail(
        `RATCHET theme-brand: ${THEME_REL} must remap --uxds-filter-chip-surface-selected-strong`
      );
    } else {
      const value = selectedRemap[1].trim();
      if (!/var\(\s*--project-brand-primary/.test(value)) {
        fail(
          `RATCHET theme-brand: --uxds-filter-chip-surface-selected-strong must use var(--project-brand-primary…) (got "${value}")`
        );
      }
      if (
        new RegExp(UXDS_DEFAULT_STRONG_SELECTED, "i").test(value) &&
        !/var\(/.test(value)
      ) {
        fail(
          `RATCHET theme-brand: selected-strong must not hardcode UXDS default ${UXDS_DEFAULT_STRONG_SELECTED} — use brand primary`
        );
      }
    }
    const hoverRemap = theme.match(
      /--uxds-filter-chip-surface-selected-strong-hover\s*:\s*([^;]+);/
    );
    if (!hoverRemap || !/var\(\s*--project-brand-primary/.test(hoverRemap[1])) {
      fail(
        `RATCHET theme-brand: --uxds-filter-chip-surface-selected-strong-hover must use var(--project-brand-primary…)`
      );
    }
  }
}

// ── 2) Kit strong selected must consume themeable tokens (no hard fill) ─────
{
  const kit = read(FILTER_CHIP_REL);
  if (!kit) {
    fail(`missing ${FILTER_CHIP_REL}`);
  } else {
    const strongSelected = kit.match(
      /\.uxds-filter-chip--strong\.is-selected[\s\S]{0,200}?\{([^}]+)\}/
    );
    const block = strongSelected?.[1] ?? "";
    if (!/--uxds-filter-chip-surface-selected-strong/.test(block)) {
      fail(
        "RATCHET theme-brand: .uxds-filter-chip--strong.is-selected must set background via var(--uxds-filter-chip-surface-selected-strong)"
      );
    }
    if (/background\s*:\s*#[0-9a-fA-F]{3,8}/.test(block)) {
      fail(
        "RATCHET theme-brand: .uxds-filter-chip--strong.is-selected must not hardcode hex background (theme must win)"
      );
    }
  }
}

// ── 3) UXDS defaults stay in design tokens; theme overrides at project scope ─
{
  const design = read(DESIGN_TOKENS_REL);
  if (design) {
    if (
      !new RegExp(
        `--uxds-filter-chip-surface-selected-strong\\s*:\\s*${UXDS_DEFAULT_STRONG_SELECTED}`,
        "i"
      ).test(design)
    ) {
      // Soft: if UXDS default hex changes, still require the custom property exists.
      if (!/--uxds-filter-chip-surface-selected-strong\s*:/.test(design)) {
        fail(
          `${DESIGN_TOKENS_REL} must define --uxds-filter-chip-surface-selected-strong`
        );
      }
    }
  }
}

// ── 4) Boots Availability store filters use strong chips (theme-bound) ──────
{
  const avail = read(AVAIL_REL);
  if (!avail) {
    fail(`missing ${AVAIL_REL}`);
  } else {
    if (!/uxds-filter-chip--strong/.test(avail)) {
      fail(
        `RATCHET theme-brand: ${AVAIL_REL} store filters must use uxds-filter-chip--strong (brand-active via theme)`
      );
    }
    if (!/All locations/.test(avail) || !/Slots available/.test(avail)) {
      fail(
        `RATCHET theme-brand: ${AVAIL_REL} must keep All locations / Slots available strong chips`
      );
    }
    // Forbid anonymous active fills on avail filter row (page CSS zoo).
    const globals = read("src/styles/globals-screens.css") || "";
    const availFilterBlock = globals.match(
      /\.proto-avail-store-filters[\s\S]{0,800}?\{[\s\S]{0,1200}?\}/g
    );
    if (availFilterBlock) {
      for (const block of availFilterBlock) {
        if (
          /\.is-selected|\[data-state=["']on["']\]/.test(block) &&
          /background\s*:\s*#[0-9a-fA-F]{3,8}/.test(block)
        ) {
          fail(
            "RATCHET theme-brand: globals-screens must not hardcode hex active fill on .proto-avail-store-filters — use UXDS strong + theme tokens"
          );
        }
      }
    }
  }
}

// ── Docs companion ──────────────────────────────────────────────────────────
{
  if (!fs.existsSync(path.join(ROOT, "docs/product/STUDIO_AUTO_RULES.md"))) {
    fail("missing docs/product/STUDIO_AUTO_RULES.md");
  }
}

if (errors.length) {
  console.error("[check:theme-brand] FAIL — brand theme active-state gate:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error(
    `\n[check:theme-brand] ${errors.length} violation(s). See STUDIO_AUTO_RULES.md R5`
  );
  process.exit(1);
}

console.log(
  "[check:theme-brand] OK — project brand primary remaps filter-chip selected; kit uses tokens"
);
