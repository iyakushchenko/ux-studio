/** @vitest-environment happy-dom */
import { describe, expect, it, afterEach, vi } from "vitest";
import {
  isDemoCursorHotspotOnTarget,
  CURSOR_HOTSPOT_X,
  CURSOR_HOTSPOT_Y,
} from "../demoCursorOnTarget";

describe("isDemoCursorHotspotOnTarget", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("treats playback shield as pass-through when tip is on target bbox", () => {
    const target = document.createElement("button");
    target.textContent = "Send";
    document.body.appendChild(target);
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 100,
      right: 140,
      bottom: 140,
      width: 40,
      height: 40,
      x: 100,
      y: 100,
      toJSON() {
        return this;
      },
    });

    const shield = document.createElement("div");
    shield.className = "studio-playback-shield";
    document.body.appendChild(shield);

    const cursor = document.createElement("div");
    cursor.className = "proto-chat-demo-cursor";
    cursor.style.left = `${100 + 20 - CURSOR_HOTSPOT_X}px`;
    cursor.style.top = `${100 + 20 - CURSOR_HOTSPOT_Y}px`;
    document.body.appendChild(cursor);

    vi.spyOn(document, "elementFromPoint").mockReturnValue(shield);

    expect(isDemoCursorHotspotOnTarget(cursor, target)).toBe(true);
  });
});
