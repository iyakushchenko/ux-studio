import { describe, expect, it, vi, afterEach } from "vitest";
import {
  EPHEMERAL_QUERY_KEYS,
  HUB_SCREEN_ID,
  applyStudioScreen,
  hasEphemeralStudioQuery,
  parseStudioUrl,
  resolveNavFromScreenId,
  resolveScreenIdFromNav,
  resolveStudioScreenTarget,
  serializeStudioUrl,
  buildStudioPostAgentHomeState,
  buildStudioPostAgentStayState,
  isStudioPostAgentResetSyncLocked,
  resetStudioAfterAgentTest,
  stripEphemeralStudioQuery,
  STUDIO_POST_AGENT_HOME_SCREEN_ID,
  STUDIO_POST_AGENT_RESET_EVENT,
  writeStudioUrl,
} from "@/app/shell/studioUrl";

const SCREENS = [
  { screenId: "home", childIndex: 11 },
  { screenId: "chat", childIndex: 10 },
  { screenId: "book-step-1", childIndex: 7 },
  { screenId: "book-step-2", childIndex: 4 },
  { screenId: "book-step-3", childIndex: 3 },
] as const;

describe("studioUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses and serializes project + screen (+ optional persona/mode/modal)", () => {
    const parsed = parseStudioUrl(
      "?project=boots-pharmacy&screen=book-step-2&persona=sarah-jenkins&mode=agentic-cjm&proof=junk"
    );
    expect(parsed).toEqual({
      projectId: "boots-pharmacy",
      screenId: "book-step-2",
      personaId: "sarah-jenkins",
      modeId: "agentic-cjm",
      modalId: undefined,
    });
    expect(serializeStudioUrl(parsed)).toBe(
      "?project=boots-pharmacy&screen=book-step-2&persona=sarah-jenkins&mode=agentic-cjm"
    );

    const withModal = parseStudioUrl(
      "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy"
    );
    expect(withModal.modalId).toBe("choose-pharmacy");
    expect(serializeStudioUrl(withModal)).toBe(
      "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy"
    );
    expect(parseStudioUrl("?modal=availability").modalId).toBe(
      "choose-pharmacy"
    );
    expect(
      parseStudioUrl("?project=boots-pharmacy&screen=plp&modal=quick-view")
        .modalId
    ).toBe("quick-view");
    expect(
      serializeStudioUrl({
        projectId: "boots-pharmacy",
        screenId: "plp",
        modalId: "quick-view",
      })
    ).toBe("?project=boots-pharmacy&screen=plp&modal=quick-view");
  });

  it("normalizes screen aliases", () => {
    expect(parseStudioUrl("?screen=book-step2").screenId).toBe("book-step-2");
    expect(parseStudioUrl("?screen=onboarding").screenId).toBe(HUB_SCREEN_ID);
    expect(parseStudioUrl("?screen=Agentic-Home").screenId).toBe("home");
  });

  it("resolves nav ↔ screenId for hub and book steps", () => {
    expect(resolveScreenIdFromNav({ hubOpen: true, current: 0, screens: SCREENS })).toBe(
      HUB_SCREEN_ID
    );
    expect(
      resolveScreenIdFromNav({ hubOpen: false, current: 3, screens: SCREENS })
    ).toBe("book-step-2");

    expect(resolveNavFromScreenId("hub", SCREENS)).toEqual({
      hubOpen: true,
      current: 0,
      screenId: "hub",
    });
    expect(resolveNavFromScreenId("book-step-2", SCREENS)).toEqual({
      hubOpen: false,
      current: 3,
      screenId: "book-step-2",
    });
    expect(resolveNavFromScreenId("nope", SCREENS)).toBeNull();
  });

  it("detects ephemeral proof leftovers", () => {
    expect(hasEphemeralStudioQuery("?proof=unmount-race")).toBe(true);
    expect(hasEphemeralStudioQuery("?project=boots-pharmacy")).toBe(false);
    expect(EPHEMERAL_QUERY_KEYS).toContain("proof");
  });

  it("stripEphemeralStudioQuery removes proof via replaceState", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?proof=unmount-race&project=boots-pharmacy&screen=home",
        pathname: "/",
        search: "?proof=unmount-race&project=boots-pharmacy&screen=home",
        hash: "",
      },
      history: { state: null, replaceState },
    });

    expect(stripEphemeralStudioQuery()).toBe(true);
    expect(replaceState).toHaveBeenCalledTimes(1);
    const next = replaceState.mock.calls[0][2] as string;
    expect(next).toBe("/?project=boots-pharmacy&screen=home");
    expect(next).not.toContain("proof");
  });

  it("buildStudioPostAgentHomeState lands hub without modal", () => {
    expect(
      buildStudioPostAgentHomeState(
        "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy&persona=sarah-jenkins"
      )
    ).toEqual({
      projectId: "boots-pharmacy",
      screenId: STUDIO_POST_AGENT_HOME_SCREEN_ID,
    });
    expect(buildStudioPostAgentHomeState("")).toEqual({
      projectId: "boots-pharmacy",
      screenId: "hub",
    });
  });

  it("buildStudioPostAgentStayState keeps project+screen+modal", () => {
    expect(
      buildStudioPostAgentStayState(
        "?project=boots-pharmacy&screen=plp&modal=choose-pharmacy&proof=x"
      )
    ).toEqual({
      projectId: "boots-pharmacy",
      screenId: "plp",
      modalId: "choose-pharmacy",
    });
  });

  it("resetStudioAfterAgentTest stays on screen by default and strips proof", () => {
    const replaceState = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=plp&modal=choose-pharmacy&proof=junk",
        pathname: "/",
        search:
          "?project=boots-pharmacy&screen=plp&modal=choose-pharmacy&proof=junk",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
      dispatchEvent,
    });

    const state = resetStudioAfterAgentTest();
    expect(state).toEqual({
      projectId: "boots-pharmacy",
      screenId: "plp",
      modalId: "choose-pharmacy",
    });
    expect(replaceState).toHaveBeenCalled();
    const next = replaceState.mock.calls.at(-1)?.[2] as string;
    expect(next).toBe(
      "/?project=boots-pharmacy&screen=plp&modal=choose-pharmacy"
    );
    expect(next).not.toContain("proof");
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: STUDIO_POST_AGENT_RESET_EVENT,
        detail: { state },
      })
    );
    expect(isStudioPostAgentResetSyncLocked()).toBe(true);
  });

  it("resetStudioAfterAgentTest({ resetToHub: true }) lands hub", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=plp&modal=choose-pharmacy",
        pathname: "/",
        search: "?project=boots-pharmacy&screen=plp&modal=choose-pharmacy",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
      dispatchEvent: vi.fn(),
    });

    const state = resetStudioAfterAgentTest({ resetToHub: true });
    expect(state).toEqual({
      projectId: "boots-pharmacy",
      screenId: "hub",
    });
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=hub"
    );
  });

  it("writeStudioUrl replaces bar and drops ephemeral keys", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?proof=stale&screen=home",
        pathname: "/",
        search: "?proof=stale&screen=home",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    const search = writeStudioUrl({
      projectId: "boots-pharmacy",
      screenId: "book-step-2",
    });
    expect(search).toBe("?project=boots-pharmacy&screen=book-step-2");
    expect(replaceState).toHaveBeenCalled();
    const next = replaceState.mock.calls[0][2] as string;
    expect(next).toBe("/?project=boots-pharmacy&screen=book-step-2");
    expect(next).not.toContain("proof");
  });

  it("resolveStudioScreenTarget prefers studioUrl fields over discrete ids", () => {
    expect(
      resolveStudioScreenTarget({
        studioUrl: "?project=boots-pharmacy&screen=book-step-2",
        screenId: "home",
        projectId: "puma",
      })
    ).toEqual({
      projectId: "boots-pharmacy",
      screenId: "book-step-2",
      personaId: undefined,
      modeId: undefined,
      modalId: undefined,
    });

    expect(
      resolveStudioScreenTarget({
        screenId: "book-step2",
        projectId: "boots-pharmacy",
      })
    ).toEqual({
      projectId: "boots-pharmacy",
      screenId: "book-step-2",
      personaId: undefined,
      modeId: undefined,
      modalId: undefined,
    });

    expect(
      resolveStudioScreenTarget({
        studioUrl:
          "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy",
      }).modalId
    ).toBe("choose-pharmacy");
  });

  it("applyStudioScreen invokes applyModal from URL", () => {
    const applyModal = vi.fn();
    applyStudioScreen({
      studioUrl:
        "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy",
      screens: SCREENS,
      setCurrent: vi.fn(),
      setHubOpen: vi.fn(),
      applyModal,
      syncUrl: false,
    });
    expect(applyModal).toHaveBeenCalledWith("choose-pharmacy");
  });

  it("applyStudioScreen maps book steps + hub (shared deep-link / replay path)", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=home",
        pathname: "/",
        search: "?project=boots-pharmacy&screen=home",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    const setCurrent = vi.fn();
    const setHubOpen = vi.fn();
    const setProjectId = vi.fn();

    const step2 = applyStudioScreen({
      studioUrl: "?project=boots-pharmacy&screen=book-step-2",
      screens: SCREENS,
      currentProjectId: "boots-pharmacy",
      setProjectId,
      setCurrent,
      setHubOpen,
      syncUrl: true,
    });
    expect(step2.applied).toBe(true);
    expect(step2.nav).toEqual({
      hubOpen: false,
      current: 3,
      screenId: "book-step-2",
    });
    expect(setHubOpen).toHaveBeenCalledWith(false);
    expect(setCurrent).toHaveBeenCalledWith(3);
    expect(setProjectId).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalled();

    setCurrent.mockClear();
    setHubOpen.mockClear();
    const hub = applyStudioScreen({
      screenId: "hub",
      projectId: "boots-pharmacy",
      screens: SCREENS,
      setCurrent,
      setHubOpen,
      syncUrl: false,
    });
    expect(hub.applied).toBe(true);
    expect(setHubOpen).toHaveBeenCalledWith(true);
    expect(setCurrent).not.toHaveBeenCalled();

    const unknown = applyStudioScreen({
      screenId: "nope",
      screens: SCREENS,
      setCurrent,
      setHubOpen,
      syncUrl: false,
    });
    expect(unknown.applied).toBe(false);
  });
});
