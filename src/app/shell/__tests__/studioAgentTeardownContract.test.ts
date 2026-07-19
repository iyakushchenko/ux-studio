import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID,
  assertStudioAgentTeardownClean,
  readStudioAgentTeardownSnapshot,
  waitForStudioAgentTeardownClean,
} from "@/app/shell/studioAgentTeardownContract";
import { STUDIO_AUTO_RULES } from "@/app/shell/studioAutoRules";
import {
  buildStudioPostAgentStayState,
  resetStudioAfterAgentTest,
} from "@/app/shell/studioUrl";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("studioAgentTeardownContract (auto-rule agent-teardown-clean)", () => {
  it("catalog exposes agent-teardown-clean for Arch CI", () => {
    expect(STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID).toBe("agent-teardown-clean");
    expect(STUDIO_AUTO_RULES.some((r) => r.id === STUDIO_AUTO_RULE_AGENT_TEARDOWN_ID)).toBe(
      true
    );
    expect(STUDIO_AUTO_RULES.some((r) => r.id === "agent-teardown-clean")).toBe(true);
  });

  it("assert fails when modal param or overlay remains", () => {
    const fail = assertStudioAgentTeardownClean({
      overlayRootPresent: true,
      modalParam: "choose-pharmacy",
      blockingModalDomPresent: true,
      href: "http://localhost/?modal=choose-pharmacy",
    });
    expect(fail.pass).toBe(false);
    expect(fail.ruleId).toBe("agent-teardown-clean");
    expect(fail.failures.length).toBe(3);
  });

  it("assert passes when clean", () => {
    const ok = assertStudioAgentTeardownClean({
      overlayRootPresent: false,
      modalParam: null,
      blockingModalDomPresent: false,
      href: "http://localhost/?project=boots-pharmacy&screen=pdp",
    });
    expect(ok.pass).toBe(true);
    expect(ok.failures).toEqual([]);
  });

  it("stay state never preserves modal (contract source)", () => {
    expect(
      buildStudioPostAgentStayState(
        "?project=boots-pharmacy&screen=pdp&modal=choose-pharmacy"
      ).modalId
    ).toBeUndefined();
  });

  it("waitForStudioAgentTeardownClean resolves when clean", async () => {
    vi.stubGlobal("document", {
      getElementById: () => null,
      querySelector: () => null,
    });
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=pdp",
        search: "?project=boots-pharmacy&screen=pdp",
      },
    });
    const result = await waitForStudioAgentTeardownClean({
      timeoutMs: 200,
      intervalMs: 20,
    });
    expect(result.pass).toBe(true);
  });

  it("resetStudioAfterAgentTest clears modal so assert can pass on URL", () => {
    const replaceState = vi.fn(
      (_s: unknown, _t: string, url?: string) => {
        if (typeof url === "string" && url.includes("?")) {
          const qs = url.slice(url.indexOf("?"));
          (window.location as { search: string }).search = qs;
          (window.location as { href: string }).href =
            `http://localhost:5173${url.startsWith("/") ? url : `/${url}`}`;
        }
      }
    );
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=pdp&modal=choose-pharmacy",
        search: "?project=boots-pharmacy&screen=pdp&modal=choose-pharmacy",
        pathname: "/",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
      dispatchEvent: vi.fn(() => true),
    });
    vi.stubGlobal("document", {
      getElementById: () => null,
      querySelector: () => null,
    });

    resetStudioAfterAgentTest();
    const snap = readStudioAgentTeardownSnapshot();
    expect(snap.modalParam).toBeNull();
    expect(assertStudioAgentTeardownClean(snap).pass).toBe(true);
  });
});
