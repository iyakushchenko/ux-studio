import type { ProtoFooterProps } from "@/projects/boots-pharmacy/chrome/ProtoFooter";

/** Hide any native Figma footer before mounting ProtoFooter. */
export const PROTO_FOOTER_HIDE_SELECTORS = [
  ':scope > [data-name="boots.phm.module.footer"]',
  ':scope > [data-name="boots-pharmacy.module.footer"]',
  ':scope > [data-name="module.footer"]',
] as const;

/**
 * ProtoFooter variant per Frame219 DOM child index.
 * Matches each screen's native footer: full+columns (PLP-style), compact health (book steps), etc.
 */
export const PROTO_FOOTER_BY_CHILD: Record<number, ProtoFooterProps> = {
  /** Appointment Details — no native footer; use full pharmacy. */
  1: { variant: "full", tone: "pharmacy", showColumns: true },
  /** Appointment History — native compact phm; use full pharmacy (PLP-style). */
  2: { variant: "full", tone: "pharmacy", showColumns: true },
  /** Book Step 3 — Confirmation; native full pharmacy footer. */
  3: { variant: "full", tone: "pharmacy", showColumns: true },
  /** Book Step 2 — Date and Time; native compact health footer. */
  4: { variant: "full", tone: "health", showColumns: false },
  /** Book Step 1 — Location; native minified dark footer → compact health. */
  7: { variant: "full", tone: "health", showColumns: false },
  /** PDP */
  8: { variant: "full", tone: "pharmacy", showColumns: true },
  /** PLP */
  9: { variant: "full", tone: "pharmacy", showColumns: true },
};

/** Site Pilot (home + chat) — no ProtoFooter. */
export const PROTO_SITE_PILOT_CHILD_INDICES = [10, 11] as const;

export const PROTO_FOOTER_CHILD_INDICES = Object.keys(PROTO_FOOTER_BY_CHILD)
  .map(Number)
  .sort((a, b) => a - b);
