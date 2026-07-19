import { describe, expect, it } from "vitest";
import { nextDisclosureOpen } from "./disclosureState";

describe("nextDisclosureOpen", () => {
  it("toggles when next is omitted", () => {
    expect(nextDisclosureOpen(false)).toBe(true);
    expect(nextDisclosureOpen(true)).toBe(false);
  });

  it("honors an explicit next value", () => {
    expect(nextDisclosureOpen(true, true)).toBe(true);
    expect(nextDisclosureOpen(true, false)).toBe(false);
  });
});
