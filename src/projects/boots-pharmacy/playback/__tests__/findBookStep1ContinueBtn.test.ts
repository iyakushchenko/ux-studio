/** @vitest-environment happy-dom */
/**
 * Contract: traditional book-location-pick must prefer React Continue and skip
 * Legacy-retired ghosts — same first-match class as PDP Book now (LESSONS).
 */
import { describe, expect, it } from "vitest";
import { findBookStep1ContinueBtn } from "../traditional";

describe("findBookStep1ContinueBtn (Legacy-retired skip)", () => {
  it("prefers React host over Legacy-retired Continue", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-studio-legacy-retired="book-step-1" style="display:none">
        <div data-name="component.input.button">Continue</div>
        <div class="proto-chosen-slot"></div>
      </div>
      <div class="studio-react-screen-host">
        <main class="book-step-1" data-studio-react-screen="book-step-1">
          <button type="button" data-studio-action="book-step-1-continue">
            Continue
          </button>
        </main>
      </div>
    `;
    const btn = findBookStep1ContinueBtn(root);
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("data-studio-action")).toBe(
      "book-step-1-continue"
    );
    expect(btn?.closest("[data-studio-legacy-retired]")).toBeNull();
  });

  it("skips Legacy-retired and returns null when React Continue absent", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-studio-legacy-retired="book-step-1">
        <div data-name="component.input.button">Continue</div>
      </div>
    `;
    expect(findBookStep1ContinueBtn(root)).toBeNull();
  });
});
