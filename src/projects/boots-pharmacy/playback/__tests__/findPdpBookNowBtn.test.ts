/** @vitest-environment happy-dom */
/**
 * Contract: traditional `pdp-book-now` must prefer React PDP host and skip
 * Make-retired Book now — same first-match class as Chat/Home (LESSONS).
 */
import { describe, expect, it } from "vitest";
import { findPdpBookNowBtn } from "../traditional";

describe("findPdpBookNowBtn (Make-retired skip)", () => {
  it("prefers React host over Make-retired first-match Book now", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-studio-make-retired="pdp" style="display:none">
        <div data-name="component.input.button">Book now - £150</div>
      </div>
      <div class="studio-react-screen-host">
        <main class="pdp" data-studio-react-screen="pdp">
          <button type="button" data-studio-action="pdp-book-now" data-name="component.input.button">
            Book now - £150
          </button>
        </main>
      </div>
    `;
    const btn = findPdpBookNowBtn(root);
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("data-studio-action")).toBe("pdp-book-now");
    expect(btn?.closest("[data-studio-make-retired]")).toBeNull();
    expect(btn?.closest(".studio-react-screen-host")).not.toBeNull();
  });

  it("skips Make-retired and returns null when React host absent", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-studio-make-retired="pdp">
        <div data-name="component.input.button">Book now - £150</div>
      </div>
    `;
    expect(findPdpBookNowBtn(root)).toBeNull();
  });
});
