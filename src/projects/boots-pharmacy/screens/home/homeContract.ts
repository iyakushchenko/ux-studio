/** Studio / CJM contract for Agentic. Site Pilot. Home React migration. */

import { AGENTIC_HOME_DEMO_QUERY } from "@/projects/boots-pharmacy/playback/sitePilotHome";

export const HOME_CHILD_INDEX = 11;

/**
 * Public URL / registry screen id — Make “Agentic. Site Pilot. Home”.
 * `home` is reserved for a future real Home page; do not reuse here.
 * Package folder may remain `screens/home/` until a cheap rename.
 */
export const HOME_REACT_SCREEN_ID = "site-pilot";

export const HOME_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${HOME_CHILD_INDEX})`;

/** Make Body10 hero line — personalised when header login is active. */
export const HOME_HEADING_DEFAULT =
  "What health services are you focusing on today?";
export const HOME_HEADING_LOGGED_IN =
  "Sarah, what health services are you focusing on today?";

export function resolveHomeHeading(loggedIn: boolean): string {
  return loggedIn ? HOME_HEADING_LOGGED_IN : HOME_HEADING_DEFAULT;
}

/** Default Agentic query textarea value — shared with playback (Sarah's demo intent). */
export const HOME_QUERY_DEFAULT = AGENTIC_HOME_DEMO_QUERY;

/** Make Frame352 — suggested-dialog chips (Frame219 Body10, `component.gse.system.message`). */
export const HOME_CHIP_LABELS = [
  "Vaccine services",
  "Skin health services",
  "Other Health services",
] as const;

export type HomeChipLabel = (typeof HOME_CHIP_LABELS)[number];

/** Kebab slug for `data-studio-*` / `data-studio-action` (no spaces). */
export function homeChipSlug(label: HomeChipLabel): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}

/** Stable Studio action id — `agentic-home-chip-vaccine-services` etc. */
export function homeChipActionId(label: HomeChipLabel): string {
  return `agentic-home-chip-${homeChipSlug(label)}`;
}

export const HOME_SUGGESTED_LABEL = "Suggested dialog options:";
export const HOME_SUGGESTED_LABEL_ID = "home-suggested-label";

/** Textarea autosize — hug 1 line, grow to 5, then scroll (matches wire agentic query). */
export const HOME_QUERY_LINE_PX = 24;
export const HOME_QUERY_MAX_LINES = 5;
