/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  isLegacyParkedForScreen,
  resetLegacyRetireParkingForTests,
  restoreLegacyUnderPage,
  retireLegacyUnderPage,
} from "../retireLegacyUnderPage";

describe("retireLegacyUnderPage", () => {
  afterEach(() => {
    resetLegacyRetireParkingForTests();
    document.body.innerHTML = "";
  });

  it("detaches Legacy children so querySelector cannot find them", () => {
    document.body.innerHTML = `
      <div id="page">
        <div data-name="body" id="legacy-body">ghost</div>
        <div class="studio-react-screen-host" data-studio-react-screen="book-step-1"></div>
        <div class="proto-footer-mount"></div>
      </div>`;
    const page = document.getElementById("page")!;
    retireLegacyUnderPage(page, "book-step-1", {
      hideSelectors: [':scope > [data-name="body"]'],
    });
    expect(document.getElementById("legacy-body")).toBeNull();
    expect(isLegacyParkedForScreen("book-step-1")).toBe(true);
    expect(page.dataset.studioReactScreen).toBe("book-step-1");
    expect(page.querySelector(".studio-react-screen-host")).toBeTruthy();
  });

  it("restores Legacy children on unmount", () => {
    document.body.innerHTML = `
      <div id="page">
        <div data-name="body" id="legacy-body">ghost</div>
        <div class="studio-react-screen-host"></div>
      </div>`;
    const page = document.getElementById("page")!;
    retireLegacyUnderPage(page, "plp", {
      keepClassNames: new Set(["studio-react-screen-host"]),
    });
    expect(document.getElementById("legacy-body")).toBeNull();
    restoreLegacyUnderPage(page, "plp");
    expect(document.getElementById("legacy-body")).toBeTruthy();
    expect(isLegacyParkedForScreen("plp")).toBe(false);
  });

  it("permanent: true deletes outright — no park entry, restore is a no-op", () => {
    document.body.innerHTML = `
      <div id="page">
        <div data-name="body" id="legacy-body">ghost</div>
        <div class="studio-react-screen-host" data-studio-react-screen="book-step-1"></div>
        <div class="proto-footer-mount"></div>
      </div>`;
    const page = document.getElementById("page")!;
    retireLegacyUnderPage(page, "book-step-1", {
      hideSelectors: [':scope > [data-name="body"]'],
      permanent: true,
    });
    expect(document.getElementById("legacy-body")).toBeNull();
    expect(page.dataset.studioReactScreen).toBe("book-step-1");
    // Nothing was parked — restore has nothing to bring back.
    expect(isLegacyParkedForScreen("book-step-1")).toBe(false);
    restoreLegacyUnderPage(page, "book-step-1");
    expect(document.getElementById("legacy-body")).toBeNull();
  });
});
