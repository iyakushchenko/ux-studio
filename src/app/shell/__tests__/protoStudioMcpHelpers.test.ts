import { afterEach, describe, expect, it, vi } from "vitest";
import { registerProtoStudioMcpHelpers, parseStudioStepCounter } from "@/app/shell/protoStudioMcpHelpers";

describe("protoStudioMcpHelpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers dismiss and state helpers on window", () => {
    let dismissed = false;
    const win = {
      __protoControlPanelLog: [],
    } as Window & { __protoControlPanelLog: unknown[] };
    vi.stubGlobal("window", win);

    const cleanup = registerProtoStudioMcpHelpers({
      dismissDiagnostic: () => {
        dismissed = true;
      },
      isDiagnosticOpen: () => false,
      getState: () => ({
        journeyMode: true,
        scrollLock: true,
        label: "Book — date",
        counter: "20 / 25",
        beatId: "book-step2-date",
        availStep: null,
      }),
      getOrchestraModeId: () => "agentic-cjm",
    });

    expect(win.__protoStudioState?.()).toMatchObject({
      diagnosticOpen: false,
      journeyMode: true,
      scrollLock: true,
      orchestraMode: "agentic-cjm",
      label: "Book — date",
    });

    expect(win.__protoDismissPlaybackDiagnostic?.()).toBe(false);
    expect(dismissed).toBe(false);

    cleanup();
    expect(win.__protoStudioState).toBeUndefined();
  });

  it("dismisses when diagnostic is open", () => {
    let dismissed = false;
    let open = true;
    const win = {
      __protoControlPanelLog: [],
    } as Window & { __protoControlPanelLog: unknown[] };
    vi.stubGlobal("window", win);

    registerProtoStudioMcpHelpers({
      dismissDiagnostic: () => {
        dismissed = true;
        open = false;
      },
      isDiagnosticOpen: () => open,
      getState: () => ({
        journeyMode: false,
        scrollLock: false,
        label: null,
        counter: null,
        beatId: null,
        availStep: null,
      }),
    });

    expect(win.__protoDismissPlaybackDiagnostic?.()).toBe(true);
    expect(dismissed).toBe(true);
    expect(win.__protoEnsureCleanStudio?.().diagnosticOpen).toBe(false);
  });

  it("switches orchestra mode via MCP helper", () => {
    let mode: "agentic-cjm" | "traditional-cjm" = "agentic-cjm";
    const win = {
      __protoControlPanelLog: [],
    } as Window & { __protoControlPanelLog: unknown[] };
    vi.stubGlobal("window", win);

    registerProtoStudioMcpHelpers({
      dismissDiagnostic: () => {},
      isDiagnosticOpen: () => false,
      getState: () => ({
        journeyMode: false,
        scrollLock: false,
        label: null,
        counter: null,
        beatId: null,
        availStep: null,
      }),
      getOrchestraModeId: () => mode,
      setOrchestraMode: (next) => {
        mode = next;
      },
    });

    expect(win.__protoSetOrchestraMode?.("traditional-cjm")).toBe(true);
    expect(mode).toBe("traditional-cjm");
    expect(win.__protoSetOrchestraMode?.("invalid" as never)).toBe(false);
  });

  it("runs smoke retreat baseline checks", () => {
    const win = {
      __protoControlPanelLog: [],
      document: {
        querySelector: vi.fn(() => ({ getAttribute: () => "true" })),
        querySelectorAll: vi.fn(() => []),
      },
    } as unknown as Window & { __protoControlPanelLog: unknown[] };
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", win.document);

    registerProtoStudioMcpHelpers({
      dismissDiagnostic: () => {},
      isDiagnosticOpen: () => false,
      getState: () => ({
        journeyMode: false,
        scrollLock: false,
        label: null,
        counter: null,
        beatId: null,
        availStep: null,
      }),
    });

    const result = win.__protoSmokeRetreatChecks?.();
    expect(result?.pass).toBe(true);
    expect(result?.checks.some((check) => check.id === "set-orchestra-mode-helper")).toBe(
      true
    );
  });

  it("exposes journey transport helpers", () => {
    let journeyMode = false;
    const transports: string[] = [];
    const win = {
      __protoControlPanelLog: [],
    } as Window & { __protoControlPanelLog: unknown[] };
    vi.stubGlobal("window", win);

    registerProtoStudioMcpHelpers({
      dismissDiagnostic: () => {},
      isDiagnosticOpen: () => false,
      getState: () => ({
        journeyMode,
        scrollLock: false,
        label: journeyMode ? "Chat experience — 1/9" : "Agentic home",
        counter: journeyMode ? "3 / 25" : "1 / 25",
        beatId: journeyMode ? "agentic-chat" : "agentic-home",
        availStep: null,
      }),
      getOrchestraModeId: () => "agentic-cjm" as const,
      setOrchestraMode: () => {},
      setJourneyMode: (enabled) => {
        journeyMode = enabled;
      },
      triggerTransport: (action) => {
        transports.push(action);
      },
    });

    expect(win.__protoSetJourneyMode?.(true)).toBe(true);
    expect(journeyMode).toBe(true);
    expect(win.__protoTriggerTransport?.("play")).toBe(true);
    expect(transports).toEqual(["play"]);
    expect(typeof win.__protoRunHomePlaySmoke).toBe("function");
    expect(typeof win.__protoRunRetreatSmoke).toBe("function");
  });

  it("parses STEPS counter format", () => {
    expect(parseStudioStepCounter("STEPS: 13 / 25")).toEqual({
      visible: 13,
      total: 25,
    });
    expect(parseStudioStepCounter("2 / 25").visible).toBe(2);
  });
});
