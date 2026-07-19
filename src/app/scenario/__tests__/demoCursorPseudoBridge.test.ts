/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from "vitest";
import {
  bridgeDemoPseudoSelector,
  ensureDemoPseudoBridge,
  removeDemoPseudoBridge,
} from "@/app/scenario/demoCursorPseudoBridge";

describe("bridgeDemoPseudoSelector", () => {
  it("mirrors :hover onto .proto-chat-cta--hover", () => {
    expect(bridgeDemoPseudoSelector(".proto-popup-close:hover")).toBe(
      ".proto-popup-close.proto-chat-cta--hover"
    );
  });

  it("mirrors :active onto .proto-chat-cta--pressed", () => {
    expect(
      bridgeDemoPseudoSelector(".proto-popup-close:active:not(:focus-visible)")
    ).toBe(".proto-popup-close.proto-chat-cta--pressed:not(:focus-visible)");
  });

  it("keeps descendant hover compounds", () => {
    expect(
      bridgeDemoPseudoSelector(".pdp__icon-hit:hover .pdp__heart-icon")
    ).toBe(".pdp__icon-hit.proto-chat-cta--hover .pdp__heart-icon");
  });

  it("skips :not(:hover) negatives", () => {
    expect(bridgeDemoPseudoSelector(".foo:not(:hover)")).toBeNull();
  });

  it("does not double-bridge already-mirrored selectors", () => {
    expect(
      bridgeDemoPseudoSelector(".proto-popup-close.proto-chat-cta--hover")
    ).toBeNull();
  });
});

describe("ensureDemoPseudoBridge", () => {
  afterEach(() => {
    removeDemoPseudoBridge();
    document
      .querySelectorAll("[data-test-hover-sheet]")
      .forEach((el) => el.remove());
  });

  it("injects bridged rules from document stylesheets", () => {
    const sheet = document.createElement("style");
    sheet.setAttribute("data-test-hover-sheet", "1");
    sheet.textContent = `.probe-hover-target:hover{color:#012169}.probe-hover-target:active{opacity:0.8}`;
    document.head.appendChild(sheet);

    ensureDemoPseudoBridge();
    const bridge = document.getElementById("studio-demo-pseudo-bridge");
    expect(bridge).toBeTruthy();
    expect(bridge?.textContent).toContain(
      ".probe-hover-target.proto-chat-cta--hover"
    );
    expect(bridge?.textContent).toContain(
      ".probe-hover-target.proto-chat-cta--pressed"
    );
  });
});
