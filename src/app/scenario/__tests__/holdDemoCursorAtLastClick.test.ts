/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  holdDemoCursorAtLastClick,
  parkDemoCursorAtRest,
  removeDemoCursor,
  setDemoCursorJourneyMode,
} from "@/app/scenario/demoCursor";

describe("holdDemoCursorAtLastClick", () => {
  afterEach(() => {
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
    vi.restoreAllMocks();
  });

  it("keeps cursor visible at last click point (no fade / no park-away)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await new Promise((r) => setTimeout(r, 0));
    const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(cursor).not.toBeNull();
    cursor!.style.left = "640px";
    cursor!.style.top = "420px";
    cursor!.style.opacity = "1";

    holdDemoCursorAtLastClick();
    const held = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(held).not.toBeNull();
    expect(held!.style.left).toBe("640px");
    expect(held!.style.top).toBe("420px");
    expect(Number(held!.style.opacity || "1")).toBeGreaterThan(0.5);
    expect(held!.classList.contains("proto-chat-demo-cursor--exit")).toBe(false);
    expect(held!.classList.contains("proto-chat-demo-cursor--parked")).toBe(
      false
    );
  });

  it("suppresses journey-park while hold is active (SF idle flip)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await new Promise((r) => setTimeout(r, 0));
    const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(cursor).not.toBeNull();
    cursor!.style.left = "800px";
    cursor!.style.top = "500px";
    cursor!.style.opacity = "1";

    holdDemoCursorAtLastClick();
    await parkDemoCursorAtRest({ animate: false });

    const held = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(held).not.toBeNull();
    expect(held!.style.left).toBe("800px");
    expect(held!.style.top).toBe("500px");
    expect(held!.classList.contains("proto-chat-demo-cursor--parked")).toBe(
      false
    );
    expect(Number(held!.style.opacity || "1")).toBeGreaterThan(0.5);
  });
});
