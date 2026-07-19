import { describe, expect, it } from "vitest";
import {
  STUDIO_SCROLL_OVERFLOW_ATTR,
  STUDIO_SCROLL_OVERFLOW_CLASS,
  elementOverflowsY,
  syncStudioScrollOverflowGutter,
} from "../studioScrollOverflow";

function fakeEl(scrollHeight: number, clientHeight: number): HTMLElement {
  const classSet = new Set<string>();
  const attrs = new Map<string, string>();
  return {
    scrollHeight,
    clientHeight,
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

describe("syncStudioScrollOverflowGutter", () => {
  it("does not mark short panes", () => {
    const el = fakeEl(700, 900);
    expect(syncStudioScrollOverflowGutter(el)).toBe(false);
    expect(el.classList.contains(STUDIO_SCROLL_OVERFLOW_CLASS)).toBe(false);
    expect(el.getAttribute(STUDIO_SCROLL_OVERFLOW_ATTR)).toBeNull();
  });

  it("marks overflowing panes for stable gutter", () => {
    const el = fakeEl(2000, 900);
    expect(syncStudioScrollOverflowGutter(el)).toBe(true);
    expect(el.classList.contains(STUDIO_SCROLL_OVERFLOW_CLASS)).toBe(true);
    expect(el.getAttribute(STUDIO_SCROLL_OVERFLOW_ATTR)).toBe("true");
  });

  it("clears the marker when content shrinks to fit", () => {
    const el = fakeEl(2000, 900);
    syncStudioScrollOverflowGutter(el);
    Object.defineProperty(el, "scrollHeight", { value: 900 });
    expect(syncStudioScrollOverflowGutter(el)).toBe(false);
    expect(el.classList.contains(STUDIO_SCROLL_OVERFLOW_CLASS)).toBe(false);
    expect(el.getAttribute(STUDIO_SCROLL_OVERFLOW_ATTR)).toBeNull();
  });
});
