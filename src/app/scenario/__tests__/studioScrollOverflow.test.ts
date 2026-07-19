import { describe, expect, it } from "vitest";
import {
  STUDIO_SCROLL_OVERFLOW_ATTR,
  STUDIO_SCROLL_OVERFLOW_CLASS,
  STUDIO_SCROLLBAR_SIZE_FALLBACK_PX,
  elementOverflowsY,
  measureScrollbarInlineSize,
  syncStudioScrollOverflowGutter,
} from "../studioScrollOverflow";

function fakeEl(
  scrollHeight: number,
  clientHeight: number,
  opts?: { offsetWidth?: number; clientWidth?: number }
): HTMLElement {
  const classSet = new Set<string>();
  const attrs = new Map<string, string>();
  const styles = new Map<string, string>();
  const offsetWidth = opts?.offsetWidth ?? 800;
  const clientWidth = opts?.clientWidth ?? 800;
  return {
    scrollHeight,
    clientHeight,
    offsetWidth,
    clientWidth,
    style: {
      setProperty(name: string, value: string) {
        styles.set(name, value);
      },
      removeProperty(name: string) {
        styles.delete(name);
      },
      getPropertyValue(name: string) {
        return styles.get(name) ?? "";
      },
    },
    classList: {
      toggle(name: string, force?: boolean) {
        if (force === true) classSet.add(name);
        else if (force === false) classSet.delete(name);
        else if (classSet.has(name)) classSet.delete(name);
        else classSet.add(name);
        return classSet.has(name);
      },
      contains(name: string) {
        return classSet.has(name);
      },
    },
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    removeAttribute(name: string) {
      attrs.delete(name);
    },
    getAttribute(name: string) {
      return attrs.get(name) ?? null;
    },
  } as unknown as HTMLElement;
}

describe("elementOverflowsY", () => {
  it("is false when content fits (Home-short case)", () => {
    expect(elementOverflowsY(fakeEl(800, 800))).toBe(false);
    expect(elementOverflowsY(fakeEl(799, 800))).toBe(false);
  });

  it("tolerates 1px subpixel equality noise", () => {
    expect(elementOverflowsY(fakeEl(801, 800))).toBe(false);
    expect(elementOverflowsY(fakeEl(802, 800))).toBe(true);
  });

  it("is true when content overflows (PLP/PDP case)", () => {
    expect(elementOverflowsY(fakeEl(2400, 800))).toBe(true);
  });
});

describe("measureScrollbarInlineSize", () => {
  it("returns offsetWidth − clientWidth", () => {
    expect(
      measureScrollbarInlineSize(fakeEl(900, 800, { offsetWidth: 804, clientWidth: 800 }))
    ).toBe(4);
  });
});

describe("syncStudioScrollOverflowGutter", () => {
  it("does not mark short panes", () => {
    const el = fakeEl(700, 900);
    expect(syncStudioScrollOverflowGutter(el)).toBe(false);
    expect(el.classList.contains(STUDIO_SCROLL_OVERFLOW_CLASS)).toBe(false);
    expect(el.getAttribute(STUDIO_SCROLL_OVERFLOW_ATTR)).toBeNull();
    expect(el.style.getPropertyValue("--studio-scrollbar-size")).toBe("");
  });

  it("marks overflowing panes and sets thin-track inset var", () => {
    const el = fakeEl(2000, 900, { offsetWidth: 804, clientWidth: 800 });
    expect(syncStudioScrollOverflowGutter(el)).toBe(true);
    expect(el.classList.contains(STUDIO_SCROLL_OVERFLOW_CLASS)).toBe(true);
    expect(el.getAttribute(STUDIO_SCROLL_OVERFLOW_ATTR)).toBe("true");
    expect(el.style.getPropertyValue("--studio-scrollbar-size")).toBe("4px");
  });

  it("falls back to 4px when inset not yet measurable", () => {
    const el = fakeEl(2000, 900, { offsetWidth: 800, clientWidth: 800 });
    syncStudioScrollOverflowGutter(el);
    expect(el.style.getPropertyValue("--studio-scrollbar-size")).toBe(
      `${STUDIO_SCROLLBAR_SIZE_FALLBACK_PX}px`
    );
  });

  it("clears the marker when content shrinks to fit", () => {
    const el = fakeEl(2000, 900, { offsetWidth: 804, clientWidth: 800 });
    syncStudioScrollOverflowGutter(el);
    Object.defineProperty(el, "scrollHeight", { value: 900 });
    expect(syncStudioScrollOverflowGutter(el)).toBe(false);
    expect(el.classList.contains(STUDIO_SCROLL_OVERFLOW_CLASS)).toBe(false);
    expect(el.getAttribute(STUDIO_SCROLL_OVERFLOW_ATTR)).toBeNull();
    expect(el.style.getPropertyValue("--studio-scrollbar-size")).toBe("");
  });
});
