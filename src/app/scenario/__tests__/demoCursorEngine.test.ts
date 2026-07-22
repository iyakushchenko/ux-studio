/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelDemoCursorTravel,
  parkDemoCursorAtRest,
  removeDemoCursor,
  setDemoCursorJourneyMode,
  settleDemoCursorAfterInteraction,
} from "@/app/scenario/demoCursor";
import {
  isForbiddenRestTarget,
  resolveCursorParkDecision,
  resolveEarlyHandAtHotspot,
  resolvePostInteractionPark,
  resetCursorEngineTrackerForTests,
} from "@/app/scenario/demoCursorEngine";
import { playbackDiagClear, getPlaybackDiagBundle } from "@/app/shell/playbackDiag";
import {
  shouldMirrorPlaybackDiagToQa,
  labelForPlaybackDiagEvent,
  outcomeForPlaybackDiagEvent,
} from "@/app/shell/playbackDiagQaBridge";

describe("demoCursorEngine park policy", () => {
  afterEach(() => {
    cancelDemoCursorTravel();
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
    resetCursorEngineTrackerForTests();
    playbackDiagClear();
    vi.restoreAllMocks();
  });

  it("defaults to travel when a start pose exists", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: true,
      reason: "retreat",
    });
    expect(d.animate).toBe(true);
    expect(d.abruptAttempt).toBe(false);
    expect(d.mode).toBe("travel");
  });

  it("force snaps without abrupt flag", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: true,
      force: true,
      reason: "resize",
    });
    expect(d.animate).toBe(false);
    expect(d.abruptAttempt).toBe(false);
    expect(d.mode).toBe("force");
  });

  it("first-mount seeds when no start pose", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: false,
      reason: "journey-mode-on",
    });
    expect(d.animate).toBe(false);
    expect(d.mode).toBe("first-mount");
    expect(d.abruptAttempt).toBe(false);
  });

  it("animate:false without force is abrupt → coerce travel", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: true,
      animate: false,
      reason: "legacy-snap",
    });
    expect(d.animate).toBe(true);
    expect(d.abruptAttempt).toBe(true);
    expect(d.mode).toBe("abrupt-coerced");
  });

  it("parkDemoCursorAtRest coerces legacy animate:false and logs ABRUPT-PARK", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await new Promise((r) => setTimeout(r, 0));
    const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(cursor).not.toBeNull();
    // Leave parked rest so next park has a start pose away from new rest.
    cursor!.classList.remove("proto-chat-demo-cursor--parked");
    cursor!.style.left = "120px";
    cursor!.style.top = "80px";

    await parkDemoCursorAtRest({ animate: false, reason: "legacy-caller" });

    const events = getPlaybackDiagBundle().events;
    const abrupt = events.filter((e) =>
      /ABRUPT-PARK/i.test(String(e.detail ?? ""))
    );
    expect(abrupt.length).toBeGreaterThan(0);
    expect(shouldMirrorPlaybackDiagToQa(abrupt[0]!)).toBe(true);
    expect(labelForPlaybackDiagEvent(abrupt[0]!)).toMatch(/teleported/i);
    expect(outcomeForPlaybackDiagEvent(abrupt[0]!)).toBe("fail");
  });
});

describe("demoCursorEngine step vs play + forbidden submit", () => {
  afterEach(() => {
    cancelDemoCursorTravel();
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
    resetCursorEngineTrackerForTests();
    playbackDiagClear();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("parks on stepped playback", () => {
    const d = resolvePostInteractionPark({
      transportMode: "step",
      target: document.createElement("button"),
    });
    expect(d).toEqual({
      park: true,
      reason: "park-on-step",
      forbiddenRest: false,
    });
  });

  it("stays on continuous Play for normal targets", () => {
    const d = resolvePostInteractionPark({
      transportMode: "play",
      target: document.createElement("button"),
    });
    expect(d).toEqual({
      park: false,
      reason: "stay-on-play",
      forbiddenRest: false,
    });
  });

  it("always parks from composer submit even during Play", () => {
    const send = document.createElement("button");
    send.setAttribute("data-studio-action", "agentic-chat-send");
    send.className = "proto-agentic-send";
    expect(isForbiddenRestTarget(send)).toBe(true);
    const d = resolvePostInteractionPark({
      transportMode: "play",
      target: send,
    });
    expect(d).toEqual({
      park: true,
      reason: "park-from-submit",
      forbiddenRest: true,
    });
  });

  it("settleDemoCursorAfterInteraction parks from submit during Play", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: false });
    await new Promise((r) => setTimeout(r, 0));
    const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(cursor).not.toBeNull();
    cursor!.classList.remove("proto-chat-demo-cursor--parked");
    cursor!.style.left = "40px";
    cursor!.style.top = "40px";

    const send = document.createElement("button");
    send.setAttribute("data-studio-action", "agentic-home-send");
    send.className = "proto-agentic-send";
    document.body.appendChild(send);
    Object.defineProperty(send, "getBoundingClientRect", {
      value: () => ({
        left: 200,
        top: 200,
        right: 240,
        bottom: 240,
        width: 40,
        height: 40,
        x: 200,
        y: 200,
        toJSON() {},
      }),
    });

    const decision = await settleDemoCursorAfterInteraction(send);
    expect(decision.reason).toBe("park-from-submit");
    expect(decision.park).toBe(true);

    const events = getPlaybackDiagBundle().events;
    const parkFromSubmit = events.filter((e) =>
      /cursor-engine:park-from-submit/i.test(String(e.detail ?? ""))
    );
    expect(parkFromSubmit.length).toBeGreaterThan(0);
    expect(shouldMirrorPlaybackDiagToQa(parkFromSubmit[0]!)).toBe(true);
    expect(labelForPlaybackDiagEvent(parkFromSubmit[0]!)).toMatch(/submit/i);
  });

  it("settleDemoCursorAfterInteraction stays on Play for CTA", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: false });
    await new Promise((r) => setTimeout(r, 0));
    const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    cursor!.classList.remove("proto-chat-demo-cursor--parked");
    cursor!.style.left = "80px";
    cursor!.style.top = "90px";

    const cta = document.createElement("button");
    cta.textContent = "Check availability";
    document.body.appendChild(cta);

    const decision = await settleDemoCursorAfterInteraction(cta);
    expect(decision.reason).toBe("stay-on-play");
    expect(decision.park).toBe(false);
    expect(cursor!.classList.contains("proto-chat-demo-cursor--parked")).toBe(
      false
    );

    const events = getPlaybackDiagBundle().events;
    const stay = events.filter((e) =>
      /cursor-engine:stay-on-play/i.test(String(e.detail ?? ""))
    );
    expect(stay.length).toBeGreaterThan(0);
  });

  it("early hand flips at interactive edge (not center-gated)", () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    Object.defineProperty(btn, "getBoundingClientRect", {
      value: () => ({
        left: 100,
        top: 100,
        right: 200,
        bottom: 140,
        width: 100,
        height: 40,
        x: 100,
        y: 100,
        toJSON() {},
      }),
    });
    // Tip just inside left edge — should hand.
    expect(
      resolveEarlyHandAtHotspot(102, 120, { destination: btn })
    ).toBe(true);
    // Tip clearly outside — no hand from destination (destinationOnly default).
    expect(
      resolveEarlyHandAtHotspot(10, 10, { destination: btn })
    ).toBe(false);
  });

  it("treats declared tap areas as hand targets", () => {
    const tapArea = document.createElement("div");
    tapArea.setAttribute("data-studio-action", "future-project-action");
    document.body.appendChild(tapArea);
    Object.defineProperty(tapArea, "getBoundingClientRect", {
      value: () => ({
        left: 20, top: 20, right: 140, bottom: 68,
        width: 120, height: 48, x: 20, y: 20, toJSON() {},
      }),
    });
    expect(
      resolveEarlyHandAtHotspot(22, 40, { destination: tapArea })
    ).toBe(true);
  });

  it.each([
    ["native disabled", (el: HTMLElement) => ((el as HTMLButtonElement).disabled = true)],
    ["aria disabled", (el: HTMLElement) => el.setAttribute("aria-disabled", "true")],
    ["inert ancestor", (el: HTMLElement) => el.parentElement?.setAttribute("inert", "")],
    ["pointer-events none", (el: HTMLElement) => (el.style.pointerEvents = "none")],
  ])("never shows hand for %s targets", (_label, disable) => {
    const wrap = document.createElement("div");
    const btn = document.createElement("button");
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
    disable(btn);
    Object.defineProperty(btn, "getBoundingClientRect", {
      value: () => ({
        left: 100, top: 100, right: 200, bottom: 140,
        width: 100, height: 40, x: 100, y: 100, toJSON() {},
      }),
    });
    expect(
      resolveEarlyHandAtHotspot(102, 120, { destination: btn })
    ).toBe(false);
  });

  it("destinationOnly skips mid-path elementFromPoint thrash", () => {
    const dest = document.createElement("button");
    dest.textContent = "Dest";
    const mid = document.createElement("a");
    mid.href = "#";
    mid.textContent = "Mid";
    document.body.append(dest, mid);
    Object.defineProperty(dest, "getBoundingClientRect", {
      value: () => ({
        left: 400,
        top: 400,
        right: 500,
        bottom: 440,
        width: 100,
        height: 40,
        x: 400,
        y: 400,
        toJSON() {},
      }),
    });
    // Without destinationOnly=false, tip over a mid-path link must NOT hand.
    const spy = vi
      .spyOn(document, "elementFromPoint")
      .mockReturnValue(mid);
    expect(
      resolveEarlyHandAtHotspot(50, 50, {
        destination: dest,
        destinationOnly: true,
      })
    ).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    // Opt-in legacy fallthrough still sees mid-path interactive.
    expect(
      resolveEarlyHandAtHotspot(50, 50, {
        destination: dest,
        destinationOnly: false,
      })
    ).toBe(true);
    spy.mockRestore();
  });
});
