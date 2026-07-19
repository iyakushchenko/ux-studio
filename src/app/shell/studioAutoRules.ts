/**
 * Studio Auto-Rules catalog — Arch CI hooks these ids.
 *
 * Canonical doc: docs/product/STUDIO_AUTO_RULES.md
 * Each rule has:
 *  - a stable `id` (string literal scanned by check:felonies / theme-brand)
 *  - a runtime assert and/or source gate
 *  - Quinn MCP prove path when runtime
 *
 * Arch extends this table; do not invent parallel catalogs.
 */

import {
  STUDIO_AUTO_RULE_AGENT_TEARDOWN,
  STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID,
} from "@/app/shell/studioAgentTeardownContract";

export type StudioAutoRuleCiGate =
  | "check:felonies"
  | "check:parity-ratchets"
  | "check:theme-brand"
  | "vitest"
  | "mcp-probe";

export type StudioAutoRule = {
  id: string;
  title: string;
  /** npm script / gate that fails CI when unwired. */
  ciGate: StudioAutoRuleCiGate;
  /** Optional MCP helper name for runtime prove. */
  mcpAssert?: string;
};

/** Ordered catalog — Arch Auto-Rules CI iterates this export. */
export const STUDIO_AUTO_RULES: readonly StudioAutoRule[] = [
  {
    // Literal id required — check:felonies scans the string (not only the const re-export).
    id: "agent-teardown-clean",
    title: STUDIO_AUTO_RULE_AGENT_TEARDOWN.title,
    ciGate: "check:felonies",
    mcpAssert: "__studioAssertAgentTeardownClean",
  },
  {
    id: "auth-ssot",
    title: "Logged-in flag SSoT (studioAuthSession / __studioIsLoggedIn)",
    ciGate: "check:felonies",
  },
  {
    id: "avail-logged-out-start",
    title: "Logged-out availability opens Find Pharmacy (start)",
    ciGate: "check:parity-ratchets",
    mcpAssert: "pdp-check-avail-logged-out",
  },
  {
    id: "pdp-rtb-rhythm",
    title: "Uma §0b PDP RTB vertical rhythm markers (gap 32px + LEGACY exclude)",
    ciGate: "check:parity-ratchets",
  },
  {
    id: "theme-brand-active",
    title: "Brand theme wins on interactive active pills/tabs",
    ciGate: "check:theme-brand",
  },
  {
    id: "robo-cursor-native-feedback",
    title:
      "Robo-cursor fires hover/press like native (events + CSS bridge; default graphic after click)",
    ciGate: "vitest",
  },
] as const;

/** Ids Arch/Ben expect wired — felony scan fails if catalog drops one. */
export const STUDIO_AUTO_RULE_IDS = STUDIO_AUTO_RULES.map((r) => r.id);

export {
  STUDIO_AUTO_RULE_AGENT_TEARDOWN,
  STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID,
};
