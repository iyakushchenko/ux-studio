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
});
