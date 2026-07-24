/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  isClickableTarget: vi.fn(() => true),
  simulateDemoPointerClick: vi.fn(async () => true),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  scrollCameraToTarget: vi.fn(async () => undefined),
}));

vi.mock("@/app/shell/playbackDiag", () => ({
  playbackDiagClick: vi.fn(),
}));

vi.mock("@/app/shell/agent-testing", () => ({
  logAgentTestingStep: vi.fn(),
  touchAgentTestingOverlay: vi.fn(),
}));

vi.mock("@/app/shell/qaModalTrack", () => ({
  trackStudioModalForQa: vi.fn(),
  trackStudioModalPickForQa: vi.fn(),
}));

vi.mock("@/app/recording/recUserPace", () => ({
  recUserPace: vi.fn(async () => undefined),
}));

import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { playRecordedClick } from "@/app/orchestra/recordedClickPlayback";

function mountLoginModal(): HTMLElement {
  const root = document.createElement("div");
  root.setAttribute("data-studio-modal", "login");
  root.innerHTML = `<div class="proto-login-card"><button type="button" class="proto-login-cta" data-studio-action="login-sign-in">Sign in</button></div>`;
  document.body.appendChild(root);
  return root;
}

function mountBookNow(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("data-studio-action", "pdp-book-now");
  btn.textContent = "Book now - £150";
  document.body.appendChild(btn);
  return btn;
}

describe("playRecordedClick — login interstitial", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.mocked(simulateDemoPointerClick).mockReset();
    vi.mocked(simulateDemoPointerClick).mockResolvedValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("drains login then clicks Book Now when modal was blocking", async () => {
    const login = mountLoginModal();
    const book = mountBookNow();
    // First resolve is blocked (book outside login modal); after Sign in, modal gone.
    vi.mocked(simulateDemoPointerClick).mockImplementation(async (el) => {
      if (el === login.querySelector(".proto-login-cta") || el.classList?.contains("proto-login-cta")) {
        login.remove();
        return true;
      }
      return el === book;
    });

    const result = await playRecordedClick({
      selectorChain: ['[data-studio-action="pdp-book-now"]'],
      element: "Book Now",
    });

    expect(result).toEqual({ ok: true });
    expect(simulateDemoPointerClick).toHaveBeenCalled();
    expect(document.querySelector('[data-studio-modal="login"]')).toBeNull();
  });

  it("after Book Now opens login, drains Sign in before returning ok", async () => {
    const book = mountBookNow();
    vi.mocked(simulateDemoPointerClick).mockImplementation(async (el) => {
      if (el === book) {
        mountLoginModal();
        return true;
      }
      const cta = document.querySelector<HTMLElement>(".proto-login-cta");
      if (el === cta) {
        document.querySelector('[data-studio-modal="login"]')?.remove();
        return true;
      }
      return false;
    });

    const result = await playRecordedClick({
      selectorChain: ['[data-studio-action="pdp-book-now"]'],
      element: "Book Now",
    });

    expect(result).toEqual({ ok: true });
    expect(document.querySelector('[data-studio-modal="login"]')).toBeNull();
    // Book Now + Sign in
    expect(vi.mocked(simulateDemoPointerClick).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("leaves login for the next recorded login beat instead of consuming it twice", async () => {
    const book = mountBookNow();
    vi.mocked(simulateDemoPointerClick).mockImplementation(async (el) => {
      if (el === book) {
        mountLoginModal();
        return true;
      }
      return false;
    });

    const result = await playRecordedClick(
      {
        selectorChain: ['[data-studio-action="pdp-book-now"]'],
        element: "Book Now",
      },
      { nextRecordedClick: { selectorChain: ['[data-studio-action="login-sign-in"]'], modalId: "login" } }
    );

    expect(result).toEqual({ ok: true });
    expect(document.querySelector('[data-studio-modal="login"]')).not.toBeNull();
    expect(vi.mocked(simulateDemoPointerClick)).toHaveBeenCalledTimes(1);
  });

  it("uses an already-open recorded login modal without remounting it", async () => {
    const login = mountLoginModal();
    const applyStudioModal = vi.fn();
    vi.mocked(simulateDemoPointerClick).mockImplementation(async (el) => {
      if (el === login.querySelector(".proto-login-cta")) {
        login.remove();
        return true;
      }
      return false;
    });

    const result = await playRecordedClick(
      {
        selectorChain: ['[data-studio-action="login-sign-in"]'],
        element: "Login Sign In",
        modalId: "login",
      },
      { applyStudioModal }
    );

    expect(result).toEqual({ ok: true });
    expect(applyStudioModal).not.toHaveBeenCalled();
  });

  it("keeps an already-open availability modal instead of resetting its step", async () => {
    const modal = document.createElement("div");
    modal.setAttribute("data-studio-modal", "choose-pharmacy");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `<button data-studio-action="avail-back-to-list">Back to List</button>`;
    document.body.appendChild(modal);
    const applyStudioModal = vi.fn();

    const result = await playRecordedClick(
      {
        selectorChain: ['[data-studio-action="avail-back-to-list"]'],
        element: "Back to List",
        modalId: "choose-pharmacy",
      },
      { applyStudioModal },
    );

    expect(result).toEqual({ ok: true });
    expect(applyStudioModal).not.toHaveBeenCalled();
  });

  it("does not reopen choose-pharmacy over a live Availability date step", async () => {
    const scrim = document.createElement("div");
    scrim.className = "studio-avail-scrim";
    scrim.innerHTML = `<button type="button" data-studio-action="avail-select-date" data-studio-avail-date="June-21">21</button>`;
    document.body.appendChild(scrim);
    const applyStudioModal = vi.fn();

    const result = await playRecordedClick(
      {
        selectorChain: [
          '[data-studio-action="avail-select-date"][data-studio-avail-date="June-21"]',
        ],
        element: "Select Date",
        modalId: "choose-pharmacy",
      },
      { applyStudioModal },
    );

    expect(result).toEqual({ ok: true });
    expect(applyStudioModal).not.toHaveBeenCalled();
    expect(simulateDemoPointerClick).toHaveBeenCalled();
  });

  it("heals noSlots pharmacy → slotted store before avail-select-date (poisoned REC)", async () => {
    const scrim = document.createElement("div");
    scrim.className = "studio-avail-scrim";
    scrim.innerHTML = `
      <div data-studio-avail-step="noSlots">
        <button type="button" data-studio-action="avail-back-to-list">Back to List</button>
      </div>
      <div data-studio-avail-step="list" hidden>
        <article data-studio-avail-store="strand">
          <p class="proto-avail-store__status">No available slots</p>
          <button type="button" data-studio-action="avail-choose-location">Boots Strand</button>
        </article>
        <article data-studio-avail-store="covent">
          <button type="button" data-studio-action="avail-choose-location">Boots Covent Garden</button>
        </article>
      </div>
      <div data-studio-avail-step="date" hidden></div>
    `;
    document.body.appendChild(scrim);

    const noSlots = scrim.querySelector<HTMLElement>('[data-studio-avail-step="noSlots"]')!;
    const list = scrim.querySelector<HTMLElement>('[data-studio-avail-step="list"]')!;
    const dateStep = scrim.querySelector<HTMLElement>('[data-studio-avail-step="date"]')!;
    const back = scrim.querySelector<HTMLElement>('[data-studio-action="avail-back-to-list"]')!;
    const covent = scrim.querySelector<HTMLElement>(
      '[data-studio-avail-store="covent"] [data-studio-action="avail-choose-location"]',
    )!;

    back.addEventListener("click", () => {
      noSlots.hidden = true;
      list.hidden = false;
    });
    covent.addEventListener("click", () => {
      list.hidden = true;
      dateStep.hidden = false;
      dateStep.innerHTML = `<button type="button" data-studio-action="avail-select-date" data-studio-avail-date="June-21">21</button>`;
    });

    const applyStudioModal = vi.fn();
    const dateBtnSel =
      '[data-studio-action="avail-select-date"][data-studio-avail-date="June-21"]';

    const result = await playRecordedClick(
      {
        selectorChain: [dateBtnSel],
        element: "Select Date",
        modalId: "choose-pharmacy",
      },
      { applyStudioModal },
    );

    expect(result).toEqual({ ok: true });
    expect(applyStudioModal).not.toHaveBeenCalled();
    expect(simulateDemoPointerClick).toHaveBeenCalledWith(
      expect.objectContaining({
        getAttribute: expect.any(Function),
      }),
      expect.objectContaining({ scroll: true }),
    );
    const clicked = vi.mocked(simulateDemoPointerClick).mock.calls[0]?.[0] as HTMLElement;
    expect(clicked.getAttribute("data-studio-avail-date")).toBe("June-21");
  });

  it("prefers a slotted Choose Location when next beat needs date surface", async () => {
    const scrim = document.createElement("div");
    scrim.className = "studio-avail-scrim";
    scrim.innerHTML = `
      <article data-studio-avail-store="strand">
        <p class="proto-avail-store__status">No available slots</p>
        <button type="button" data-studio-action="avail-choose-location">Boots Strand</button>
      </article>
      <article data-studio-avail-store="covent">
        <button type="button" data-studio-action="avail-choose-location">Boots Covent Garden</button>
      </article>
    `;
    document.body.appendChild(scrim);
    const covent = scrim.querySelector<HTMLElement>(
      '[data-studio-avail-store="covent"] [data-studio-action="avail-choose-location"]',
    )!;

    const result = await playRecordedClick(
      {
        selectorChain: [
          '[data-studio-avail-store="strand"] [data-studio-action="avail-choose-location"]',
        ],
        element: "Boots Strand",
        modalId: "choose-pharmacy",
      },
      {
        nextRecordedClick: {
          selectorChain: [
            '[data-studio-action="avail-select-date"][data-studio-avail-date="June-21"]',
          ],
          element: "Select Date",
          modalId: "choose-pharmacy",
        },
      },
    );

    expect(result).toEqual({ ok: true });
    expect(simulateDemoPointerClick).toHaveBeenCalledWith(
      covent,
      expect.objectContaining({ scroll: true }),
    );
  });

  it("never drains the closing login again after its recorded sign-in action", async () => {
    const login = mountLoginModal();
    vi.mocked(simulateDemoPointerClick).mockResolvedValue(true);

    const result = await playRecordedClick({
      selectorChain: ['[data-studio-action="login-sign-in"]'],
      element: "Login Sign In",
      modalId: "login",
    });

    expect(result).toEqual({ ok: true });
    expect(login.isConnected).toBe(true);
    expect(vi.mocked(simulateDemoPointerClick)).toHaveBeenCalledTimes(1);
  });

  it("fails clearly when target sits under a non-login modal", async () => {
    const modal = document.createElement("div");
    modal.setAttribute("data-studio-modal", "quick-view");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
    mountBookNow(); // outside modal → blocked

    const result = await playRecordedClick({
      selectorChain: ['[data-studio-action="pdp-book-now"]'],
      element: "Book Now",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.step).toBe("recorded-click:blocked-by-modal");
    }
  });

  it("uses the recorded label to disambiguate repeated component selectors", async () => {
    document.body.innerHTML = `
      <div data-name="component.plp.tile.title"><a href="#pdp">Chickenpox</a></div>
      <div data-name="component.plp.tile.title"><a href="#pdp">Typhoid</a></div>
    `;
    const typhoid = Array.from(document.querySelectorAll("a")).find(
      (link) => link.textContent === "Typhoid",
    );

    const result = await playRecordedClick({
      selectorChain: ['[data-name="component.plp.tile.title"]'],
      element: "Typhoid",
    });

    expect(result).toEqual({ ok: true });
    expect(simulateDemoPointerClick).toHaveBeenCalledWith(
      typhoid,
      expect.objectContaining({ scroll: true }),
    );
  });

  it("skips already-selected date/time without click FAIL (avail handoff)", async () => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.setAttribute("data-name", "calendar. date. cell");
    cell.setAttribute("data-studio-cal-kind", "date");
    cell.dataset.studioCalSelected = "true";
    cell.textContent = "24";
    document.body.appendChild(cell);

    const result = await playRecordedClick({
      selectorChain: ['[data-name="calendar. date. cell"]'],
      element: "24",
    });

    expect(result).toEqual({ ok: true });
    expect(simulateDemoPointerClick).not.toHaveBeenCalled();
  });

  it("heals View Details to live React CTA — skips Legacy ghost cards", async () => {
    document.body.innerHTML = `
      <div data-studio-react-screen="appointment-history">
        <div data-name="boots-pharmacy.component.ma.acc.overview.recent.order" style="display:none;width:0;height:0">
          <div data-name="View details">View details</div>
        </div>
        <button type="button" data-studio-action="history-view-details">View details</button>
      </div>
    `;
    const live = document.querySelector<HTMLElement>(
      '[data-studio-action="history-view-details"]',
    );

    const result = await playRecordedClick({
      selectorChain: ['[data-name="View details"]'],
      element: "View details",
    });

    expect(result).toEqual({ ok: true });
    expect(simulateDemoPointerClick).toHaveBeenCalledWith(
      live,
      expect.objectContaining({ scroll: true }),
    );
  });
});
