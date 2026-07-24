/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  inventorySurface,
  registerInteractionInventory,
  type InteractionSurface,
} from "@/app/shell/interactionInventory";

function rect(width = 120, height = 32): DOMRect {
  return { x: 1, y: 2, width, height, top: 2, left: 1, right: 1 + width, bottom: 2 + height, toJSON: () => ({}) } as DOMRect;
}

describe("interaction inventory", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("classifies stable, semantic, visual, disabled, and invalid candidates without clicking", () => {
    document.body.innerHTML = `<main id="surface">
      <button data-studio-action="buy">Buy</button>
      <button class="plain">Details</button>
      <div class="visual">Looks live</div>
      <button disabled>Unavailable</button>
      <button aria-label=""></button>
    </main>`;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect());
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => ({
      display: "block",
      visibility: "visible",
      opacity: "1",
      cursor: (el as HTMLElement).classList.contains("visual") ? "pointer" : "auto",
    }) as CSSStyleDeclaration);
    const result = inventorySurface(document.querySelector("main")!, {
      id: "home",
      label: "Home",
      kind: "screen",
    });
    expect(result.totals["ready-target"]).toBe(1);
    expect(result.totals["semantic-ready"]).toBe(1);
    expect(result.totals["visual-candidate"]).toBe(1);
    expect(result.totals.disabled).toBe(1);
    expect(result.totals.invalid).toBe(1);
  });

  it("flags a control as invalid when its only identity attribute is shared by >1 element (PP-49 ambiguous-target)", () => {
    document.body.innerHTML = `<main id="surface">
      <button data-name="component.input.button">Change vaccine</button>
      <button data-name="component.input.button">Change location</button>
    </main>`;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect());
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      display: "block",
      visibility: "visible",
      opacity: "1",
      cursor: "auto",
    } as CSSStyleDeclaration);
    const result = inventorySurface(document.querySelector("main")!, {
      id: "book-step-2",
      label: "Book step 2",
      kind: "screen",
    });
    expect(result.totals.invalid).toBe(2);
    expect(result.items.every((item) => item.issues.includes("ambiguous-target"))).toBe(true);
  });

  it("maps every registered surface including Hub and restores the original surface", async () => {
    document.body.innerHTML = `<main><button data-studio-action="go">Go</button></main>`;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect());
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ display: "block", visibility: "visible", opacity: "1", cursor: "auto" } as CSSStyleDeclaration);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    const surfaces: InteractionSurface[] = [
      { id: "hub", label: "Hub", kind: "hub" },
      { id: "home", label: "Home", kind: "screen", index: 0 },
    ];
    let active = surfaces[1]!;
    const cleanup = registerInteractionInventory({
      projectId: "example",
      surfaces,
      getActiveSurface: () => active,
      getActiveRoot: () => document.querySelector("main"),
      navigate: (surface) => { active = surface; },
    });
    const result = await window.__studioMapAllInteractions!();
    expect(result.surfaces.map((surface) => surface.surfaceId)).toEqual(["hub", "home"]);
    expect(result.pass).toBe(true);
    expect(active.id).toBe("home");
    expect(window.__studioGetLastInteractionInventory?.()).toEqual(result);
    cleanup();
  });
});
