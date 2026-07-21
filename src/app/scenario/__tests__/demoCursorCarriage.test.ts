/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearDemoCursorCarriageLatches,
  isDemoCursorCarriageMode,
  isDemoCursorPointerMode,
  parkDemoCursorForTypeIn,
  removeDemoCursor,
  setDemoCursorJourneyMode,
  syncDemoCursorGraphicMode,
} from "@/app/scenario/demoCursor";
import { isTextEntryFocusTarget } from "@/app/scenario/demoCursorEngine";
import {
  playbackDiagTypeInEnd,
  playbackDiagTypeInStart,
} from "@/app/shell/playbackDiag";

describe("isTextEntryFocusTarget", () => {
  it("accepts text inputs and textareas", () => {
    const input = document.createElement("input");
    input.type = "text";
    expect(isTextEntryFocusTarget(input)).toBe(true);
    const search = document.createElement("input");
    search.type = "search";
    expect(isTextEntryFocusTarget(search)).toBe(true);
    expect(isTextEntryFocusTarget(document.createElement("textarea"))).toBe(
      true
    );
  });

  it("rejects button-like inputs", () => {
    for (const type of ["button", "submit", "checkbox", "radio", "file"]) {
      const input = document.createElement("input");
      input.type = type;
      expect(isTextEntryFocusTarget(input)).toBe(false);
    }
  });

  it("accepts contenteditable", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    expect(isTextEntryFocusTarget(div)).toBe(true);
  });
});

describe("demoCursor carriage graphic", () => {
  beforeEach(() => {
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
  });

  afterEach(() => {
    removeDemoCursor({ immediate: true });
    setDemoCursorJourneyMode(false);
  });

  it("shows carriage when a text field is focused", async () => {
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    // Allow first-mount park to create the cursor node.
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.focus();
    syncDemoCursorGraphicMode();
    expect(isDemoCursorCarriageMode()).toBe(true);
    expect(isDemoCursorPointerMode()).toBe(false);
    ta.blur();
    await Promise.resolve();
    syncDemoCursorGraphicMode();
    expect(isDemoCursorCarriageMode()).toBe(false);
    ta.remove();
  });

  it("type-in park latches carriage graphic", () => {
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    parkDemoCursorForTypeIn(ta);
    expect(isDemoCursorCarriageMode()).toBe(true);
    const img = document.querySelector(
      ".proto-chat-demo-cursor__graphic--carriage"
    ) as HTMLImageElement | null;
    expect(img).toBeTruthy();
    // Large demo size — not tiny intrinsic 7×22 (CSS height fills 37px host).
    expect(img!.getAttribute("height")).toBe("44");
    ta.remove();
  });

  it("does not keep carriage after type-in-end while focus sticks on composer", async () => {
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.focus();
    parkDemoCursorForTypeIn(ta);
    expect(isDemoCursorCarriageMode()).toBe(true);
    playbackDiagTypeInStart("chat", 3);
    playbackDiagTypeInEnd(true, "unit");
    // Sticky focus (Play often leaves composer focused) must not keep I-beam.
    expect(document.activeElement).toBe(ta);
    expect(isDemoCursorCarriageMode()).toBe(false);
    expect(isDemoCursorPointerMode()).toBe(false);
    ta.remove();
  });

  it("clearing carriage latches drops I-beam without needing blur", async () => {
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    parkDemoCursorForTypeIn(ta);
    expect(isDemoCursorCarriageMode()).toBe(true);
    clearDemoCursorCarriageLatches();
    expect(isDemoCursorCarriageMode()).toBe(false);
    ta.remove();
  });
});
