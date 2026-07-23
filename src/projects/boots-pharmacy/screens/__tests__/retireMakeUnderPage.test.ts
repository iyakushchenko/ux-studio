/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  isMakeParkedForScreen,
  resetMakeRetireParkingForTests,
  restoreMakeUnderPage,
  retireMakeUnderPage,
} from "../retireMakeUnderPage";

describe("retireMakeUnderPage", () => {
  afterEach(() => {
    resetMakeRetireParkingForTests();
    document.body.innerHTML = "";
  });

  it("detaches Make children so querySelector cannot find them", () => {
    document.body.innerHTML = `
      <div id="page">
        <div data-name="body" id="make-body">ghost</div>
        <div class="studio-react-screen-host" data-studio-react-screen="book-step-1"></div>
        <div class="proto-footer-mount"></div>
      </div>`;
    const page = document.getElementById("page")!;
    retireMakeUnderPage(page, "book-step-1", {
      hideSelectors: [':scope > [data-name="body"]'],
    });
    expect(document.getElementById("make-body")).toBeNull();
    expect(isMakeParkedForScreen("book-step-1")).toBe(true);
    expect(page.dataset.studioReactScreen).toBe("book-step-1");
    expect(page.querySelector(".studio-react-screen-host")).toBeTruthy();
  });

  it("restores Make children on unmount", () => {
    document.body.innerHTML = `
      <div id="page">
        <div data-name="body" id="make-body">ghost</div>
        <div class="studio-react-screen-host"></div>
      </div>`;
    const page = document.getElementById("page")!;
    retireMakeUnderPage(page, "plp", {
      keepClassNames: new Set(["studio-react-screen-host"]),
    });
    expect(document.getElementById("make-body")).toBeNull();
    restoreMakeUnderPage(page, "plp");
    expect(document.getElementById("make-body")).toBeTruthy();
    expect(isMakeParkedForScreen("plp")).toBe(false);
  });

  it("permanent: true deletes outright — no park entry, restore is a no-op", () => {
    document.body.innerHTML = `
      <div id="page">
        <div data-name="body" id="make-body">ghost</div>
        <div class="studio-react-screen-host" data-studio-react-screen="book-step-1"></div>
        <div class="proto-footer-mount"></div>
      </div>`;
    const page = document.getElementById("page")!;
    retireMakeUnderPage(page, "book-step-1", {
      hideSelectors: [':scope > [data-name="body"]'],
      permanent: true,
    });
    expect(document.getElementById("make-body")).toBeNull();
    expect(page.dataset.studioReactScreen).toBe("book-step-1");
    // Nothing was parked — restore has nothing to bring back.
    expect(isMakeParkedForScreen("book-step-1")).toBe(false);
    restoreMakeUnderPage(page, "book-step-1");
    expect(document.getElementById("make-body")).toBeNull();
  });
});
