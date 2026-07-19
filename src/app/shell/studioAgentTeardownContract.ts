/**
 * Studio Auto-Rule: agent-teardown-clean
 *
 * HARD contract after probe / sitrep / forceClear / MCP session end:
 *  1. AGENT TESTING overlay DOM gone (no sticky sitrep root)
 *  2. URLSearchParams has no `modal`
 *  3. No blocking dialog in DOM (`data-studio-modal`)
 *
 * Arch hooks this id into Studio Auto-Rules CI. Quinn MCP-proves via
 * `window.__studioAssertAgentTeardownClean()`. Ben gates wiring in `check:felonies`.
 */

import { BLOCKING_MODAL_SELECTOR } from "@/app/shell/studioModalGuard";
import { STUDIO_QUERY } from "@/app/shell/studioUrl";

/** Stable Auto-Rule id — Arch CI catalog + felonies scan this literal. */
export const STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID = "agent-teardown-clean" as const;

export const STUDIO_AUTO_RULE_AGENT_TEARDOWN = {
  id: STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID,
  title: "Post-agent teardown clears overlay + modal",
  /** Overlay root id from agentTestingOverlay (must stay in sync). */
  overlayRootId: "agent-testing-overlay",
  /** Address-bar key that must be absent after teardown. */
  modalQueryKey: STUDIO_QUERY.modal,
  /** Source files that must keep the contract wired (felony scan). */
  wirePaths: [
    "src/app/shell/studioUrl.ts",
    "src/app/App.tsx",
    "src/app/shell/studioMcpPageProbe.ts",
    "src/app/shell/mcpTestSession.ts",
    "src/app/shell/agentTestingOverlay.ts",
  ],
} as const;

export type StudioAgentTeardownSnapshot = {
  overlayRootPresent: boolean;
  modalParam: string | null;
  blockingModalDomPresent: boolean;
  href: string;
};

export type StudioAgentTeardownAssertResult = {
  ruleId: typeof STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID;
  pass: boolean;
  failures: string[];
  snapshot: StudioAgentTeardownSnapshot;
};

export function readStudioAgentTeardownSnapshot(
  doc: Pick<Document, "getElementById" | "querySelector"> | undefined =
    typeof document !== "undefined" ? document : undefined,
  loc: Pick<Location, "href" | "search"> | undefined =
    typeof window !== "undefined" ? window.location : undefined
): StudioAgentTeardownSnapshot {
  const search = loc?.search ?? "";
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const modalParam = params.get(STUDIO_AUTO_RULE_AGENT_TEARDOWN.modalQueryKey);
  const overlayRootPresent =
    !!doc &&
    typeof doc.getElementById === "function" &&
    doc.getElementById(STUDIO_AUTO_RULE_AGENT_TEARDOWN.overlayRootId) != null;
  const blockingModalDomPresent =
    !!doc &&
    typeof doc.querySelector === "function" &&
    doc.querySelector(BLOCKING_MODAL_SELECTOR) != null;
  return {
    overlayRootPresent,
    modalParam,
    blockingModalDomPresent,
    href: loc?.href ?? "",
  };
}

/**
 * Pure assert — pass a snapshot or read live DOM/URL.
 * FAIL if overlay root, `&modal=`, or blocking dialog remains.
 */
export function assertStudioAgentTeardownClean(
  snapshot: StudioAgentTeardownSnapshot = readStudioAgentTeardownSnapshot()
): StudioAgentTeardownAssertResult {
  const failures: string[] = [];
  if (snapshot.overlayRootPresent) {
    failures.push("overlay root still in DOM");
  }
  if (snapshot.modalParam != null && snapshot.modalParam !== "") {
    failures.push(`URL still has modal=${snapshot.modalParam}`);
  }
  if (snapshot.blockingModalDomPresent) {
    failures.push("blocking data-studio-modal dialog still in DOM");
  }
  return {
    ruleId: STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID,
    pass: failures.length === 0,
    failures,
    snapshot,
  };
}

const DEFAULT_TEARDOWN_WAIT_MS = 1200;

/**
 * Poll until clean (React closeAllPopups flush) or timeout.
 * Prefer this after forceClear / probe finally in MCP prove.
 */
export async function waitForStudioAgentTeardownClean(options?: {
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<StudioAgentTeardownAssertResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TEARDOWN_WAIT_MS;
  const intervalMs = options?.intervalMs ?? 50;
  const endsAt = Date.now() + Math.max(0, timeoutMs);
  let last = assertStudioAgentTeardownClean();
  while (!last.pass && Date.now() < endsAt) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, intervalMs);
    });
    last = assertStudioAgentTeardownClean();
  }
  return last;
}

/** Window API for Quinn MCP prove after probe / forceClear. */
export function installStudioAgentTeardownContractApi(): void {
  if (typeof window === "undefined") return;
  window.__studioAssertAgentTeardownClean = () =>
    assertStudioAgentTeardownClean();
  window.__studioWaitAgentTeardownClean = (timeoutMs?: number) =>
    waitForStudioAgentTeardownClean(
      typeof timeoutMs === "number" ? { timeoutMs } : undefined
    );
}

export function uninstallStudioAgentTeardownContractApi(): void {
  if (typeof window === "undefined") return;
  delete window.__studioAssertAgentTeardownClean;
  delete window.__studioWaitAgentTeardownClean;
}

declare global {
  interface Window {
    __studioAssertAgentTeardownClean?: () => StudioAgentTeardownAssertResult;
    __studioWaitAgentTeardownClean?: (
      timeoutMs?: number
    ) => Promise<StudioAgentTeardownAssertResult>;
  }
}
