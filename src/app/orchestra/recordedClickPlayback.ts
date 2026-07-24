import {
  resolveUsableDemoClickTarget,
} from "@/app/recording/recordingCapture";
import type { JourneyBeatRecordedClick } from "@/app/orchestra/types";
import {
  isClickableTarget,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import {
  hasDemoInteractionContract,
  isAlreadySelectedNoopTarget,
} from "@/app/scenario/demoInteractionContract";
import { scrollCameraToTarget } from "@/app/scenario/playbackScroll";
import {
  findTopmostBlockingModal,
  isBlockingModalOpen,
  normalizeStudioModalId,
  resolveClickTargetRespectingModal,
} from "@/app/shell/studioModalGuard";
import {
  fromBool,
  scriptFail,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";
import { resolvePlaybackSelectorChain } from "@/app/recording/recordingCapture";
import { isDegradedClickTarget } from "@/app/recording/recordingLabels";
import { playbackDiagClick } from "@/app/shell/playbackDiag";
import {
  drainLoginModalIfOpen,
  isLoginModalOpenInDom,
} from "@/app/recording/recModalDrain";
import { isFastPlayback, playbackMs } from "@/app/shell/playbackTiming";

const HISTORY_VIEW_DETAILS_SEL =
  '[data-studio-action="history-view-details"], [data-studio-appointment-view-details="true"]';

function normalizeRecordedClickLabel(value: string | undefined): string {
  return (value ?? "")
    .replace(/…|\.\.\.$/g, "")
    .replace(/([A-Za-z])\d+$/, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isHistoryViewDetailsClick(click: JourneyBeatRecordedClick): boolean {
  const label = normalizeRecordedClickLabel(click.element);
  if (label === "view details" || label.startsWith("view details")) return true;
  return click.selectorChain.some((selector) =>
    /history-view-details|appointment-view-details/i.test(selector)
  );
}

/** Prefer live React History CTA — Legacy ghost cards win bare first-match. */
function resolveVisibleHistoryViewDetails(): HTMLElement | null {
  const host =
    document.querySelector<HTMLElement>(
      '[data-studio-react-screen="appointment-history"]'
    ) ?? document.body;
  if (!host) return null;
  return (
    Array.from(host.querySelectorAll<HTMLElement>(HISTORY_VIEW_DETAILS_SEL)).find(
      (btn) =>
        isClickableTarget(btn) &&
        hasDemoInteractionContract(btn) &&
        !btn.closest("[data-studio-legacy-retired]")
    ) ?? null
  );
}

function resolveRecordedClickByLabel(
  click: JourneyBeatRecordedClick,
  root: ParentNode,
): HTMLElement | null {
  const expected = normalizeRecordedClickLabel(click.element);
  if (!expected) return null;

  for (let index = click.selectorChain.length - 1; index >= 0; index -= 1) {
    let nodes: NodeListOf<HTMLElement>;
    try {
      nodes = root.querySelectorAll<HTMLElement>(click.selectorChain[index]);
    } catch {
      continue;
    }
    const matches = Array.from(nodes)
      .flatMap((node) => {
        const interactiveSelector =
          'button, a[href], input, select, textarea, [role="button"], [role="link"], [data-studio-action]';
        const interactive = node.matches(interactiveSelector)
          ? [node]
          : Array.from(node.querySelectorAll<HTMLElement>(interactiveSelector));
        return (interactive.length > 0 ? interactive : [node]).map((candidate) =>
          resolveUsableDemoClickTarget(candidate),
        );
      })
      .filter((node): node is HTMLElement => Boolean(node))
      .filter((node, nodeIndex, all) => all.indexOf(node) === nodeIndex)
      .filter((node) => !node.closest("[data-studio-legacy-retired]"))
      .filter((node) => {
        const actual = normalizeRecordedClickLabel(
          node.getAttribute("aria-label") ?? node.textContent ?? undefined,
        );
        return (
          actual === expected ||
          (expected.length >= 5 && actual.startsWith(expected))
        );
      });
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      const live = matches.find(
        (node) =>
          isClickableTarget(node) && node.getAttribute("data-studio-action")
      );
      if (live) return live;
      const clickable = matches.find((node) => isClickableTarget(node));
      if (clickable) return clickable;
    }
  }
  return null;
}

function resolveRecordedClickTarget(
  click: JourneyBeatRecordedClick,
  options?: { preferSlottedLocation?: boolean }
): HTMLElement | null {
  if (isHistoryViewDetailsClick(click)) {
    const healed = resolveVisibleHistoryViewDetails();
    if (healed) return healed;
  }
  if (
    options?.preferSlottedLocation &&
    isAvailChooseLocationClick(click)
  ) {
    const slotted = findSlottedChooseLocationButton();
    if (slotted) {
      // Prefer exact label/store match among slotted cards when possible.
      const labeled = resolveRecordedClickByLabel(click, document);
      if (
        labeled &&
        isClickableTarget(labeled) &&
        !storeCardHasNoSlots(labeled)
      ) {
        return labeled;
      }
      return slotted;
    }
  }
  const modal = findTopmostBlockingModal();
  const semantic = resolveRecordedClickByLabel(click, modal ?? document);
  const resolved = semantic ?? resolvePlaybackSelectorChain(click.selectorChain, document);
  const modalResolved = resolveClickTargetRespectingModal(resolved, {
    resolveInModal: (modalRoot) =>
      resolveRecordedClickByLabel(click, modalRoot) ??
      resolvePlaybackSelectorChain(click.selectorChain, modalRoot),
  });
  const usable = resolveUsableDemoClickTarget(modalResolved);
  if (
    usable &&
    isClickableTarget(usable) &&
    hasDemoInteractionContract(usable) &&
    !usable.closest("[data-studio-legacy-retired]")
  ) {
    if (
      options?.preferSlottedLocation &&
      isAvailChooseLocationClick(click) &&
      storeCardHasNoSlots(usable)
    ) {
      return findSlottedChooseLocationButton() ?? usable;
    }
    return usable;
  }
  if (isHistoryViewDetailsClick(click)) {
    return resolveVisibleHistoryViewDetails();
  }
  return usable;
}

function isLoginRecordedAction(click: JourneyBeatRecordedClick | undefined): boolean {
  return Boolean(
    click &&
      (click.modalId === "login" ||
        click.selectorChain.some((selector) =>
          /data-studio-action=["']login-sign-in["']/.test(selector)
        ))
  );
}

function isRecordedModalAlreadyOpen(modalId: string | undefined): boolean {
  const expected = normalizeStudioModalId(modalId);
  if (!expected) return false;
  const modal = findTopmostBlockingModal();
  if (!modal) return false;
  const liveRaw =
    modal.getAttribute("data-studio-modal") ??
    modal
      .querySelector<HTMLElement>("[data-studio-modal]")
      ?.getAttribute("data-studio-modal");
  return normalizeStudioModalId(liveRaw) === expected;
}

/** React/filter updates may replace a matching node between resolve and click. */
async function waitForStableRecordedClickTarget(
  click: JourneyBeatRecordedClick,
  options?: { preferSlottedLocation?: boolean }
): Promise<HTMLElement | null> {
  let previous: HTMLElement | null = null;
  let stableSamples = 0;
  // Avail date/time after location pick can lag under fast-suite load.
  const slowPaint = click.selectorChain.some((selector) =>
    /calendar|avail|date\. cell|time/i.test(selector)
  );
  const attempts = slowPaint ? 80 : 40;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = resolveRecordedClickTarget(click, options);
    if (candidate && isClickableTarget(candidate)) {
      stableSamples = candidate === previous ? stableSamples + 1 : 1;
      previous = candidate;
      if (stableSamples >= 3) return candidate;
    } else {
      previous = null;
      stableSamples = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

function isAvailabilityScrimOpen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(".studio-avail-scrim, .proto-avail-scrim")
  );
}

function isAvailabilityRecordedClick(click: JourneyBeatRecordedClick): boolean {
  return click.selectorChain.some((selector) =>
    /data-studio-action=["']avail-|data-studio-avail-/i.test(selector)
  );
}

function isAvailDateSurfaceClick(click: JourneyBeatRecordedClick): boolean {
  return click.selectorChain.some((selector) =>
    /avail-select-date|avail-continue-date|avail-select-time|avail-book-now|data-studio-avail-date/i.test(
      selector
    )
  );
}

function isAvailChooseLocationClick(click: JourneyBeatRecordedClick): boolean {
  return click.selectorChain.some((selector) =>
    /avail-choose-location/i.test(selector)
  );
}

/** List-card banner for pharmacies with no bookable demo slots. */
function storeCardHasNoSlots(el: HTMLElement): boolean {
  const card = el.closest<HTMLElement>("[data-studio-avail-store]");
  if (!card) return false;
  const status = card.querySelector<HTMLElement>(
    ".proto-avail-store__status:not(.proto-avail-store__status--saved)"
  );
  if (!status) return false;
  return /no available slots/i.test(status.textContent ?? "");
}

function findSlottedChooseLocationButton(): HTMLElement | null {
  return (
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-studio-action="avail-choose-location"]'
      )
    ).find(
      (btn) =>
        isClickableTarget(btn) &&
        !storeCardHasNoSlots(btn) &&
        !btn.closest("[data-studio-legacy-retired]")
    ) ?? null
  );
}

function hasEnabledAvailDateCell(): boolean {
  return Boolean(
    document.querySelector<HTMLElement>(
      '[data-studio-action="avail-select-date"]:not([disabled])'
    )
  );
}

/**
 * Poisoned REC may pick a no-slot pharmacy then expect date cells.
 * Heal: leave noSlots → list → Choose Location on a slotted store.
 * Programmatic clicks only — do not invent demo-cursor PASS.
 */
async function ensureAvailDateSurfaceReady(): Promise<boolean> {
  if (hasEnabledAvailDateCell()) return true;
  if (!isAvailabilityScrimOpen()) return false;

  const back = document.querySelector<HTMLElement>(
    '[data-studio-action="avail-back-to-list"]'
  );
  if (back && isClickableTarget(back)) {
    back.click();
    await new Promise((r) => setTimeout(r, 120));
  }
  if (hasEnabledAvailDateCell()) return true;

  const slotted = findSlottedChooseLocationButton();
  if (!slotted) return false;
  slotted.click();
  for (let i = 0; i < 40; i++) {
    if (hasEnabledAvailDateCell()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return hasEnabledAvailDateCell();
}

/**
 * Compile v2 recordedClick Play.
 *
 * Traditional PDP Book Now while logged out opens login — REC often captures a
 * second Book Now after sign-in. Drain login (Sign in) before retry / after
 * click so continuous Play does not stall as target-degraded under the modal.
 * Does not auto-drain choose-pharmacy (own beat usually owns that pick).
 */
export async function playRecordedClick(
  click: JourneyBeatRecordedClick,
  options?: {
    skip?: boolean;
    /** Open blocking lightbox before resolving modal-scoped targets. */
    applyStudioModal?: (modalId: string | undefined) => void;
    /**
     * The next recorded beat owns the login CTA. Preserve its modal instead of
     * consuming the action early, so every recorded intent plays exactly once.
     */
    nextRecordedClick?: JourneyBeatRecordedClick;
  }
): Promise<PlaybackScriptResult> {
  if (options?.skip) return { ok: true };

  // Play must honor REC `&modal=` — open before resolving clicks inside lightbox.
  // A preceding recorded action may already have opened this modal. Reopening
  // it races the URL bridge / exit animation and can detach the real CTA while
  // the cursor is travelling. A recorded click always acts on the live modal.
  // Also: avail date/time beats often stamp modalId=choose-pharmacy from the
  // earlier location pick — never reopen that and wipe the live Availability
  // date step (all-cjms-fast FAIL avail-select-date target-degraded).
  const modalAlreadyOpen = isRecordedModalAlreadyOpen(click.modalId);
  const keepLiveAvailability =
    isAvailabilityRecordedClick(click) && isAvailabilityScrimOpen();
  const isLoginAction = isLoginRecordedAction(click);
  const nextBeatOwnsLogin = isLoginRecordedAction(options?.nextRecordedClick);
  const nextNeedsDateSurface = Boolean(
    options?.nextRecordedClick &&
      isAvailDateSurfaceClick(options.nextRecordedClick)
  );
  const preferSlottedLocation =
    isAvailChooseLocationClick(click) && nextNeedsDateSurface;
  if (
    click.modalId &&
    !modalAlreadyOpen &&
    !keepLiveAvailability &&
    options?.applyStudioModal
  ) {
    try {
      options.applyStudioModal(click.modalId);
    } catch {
      /* hang-safe */
    }
    await new Promise((r) => setTimeout(r, playbackMs(350)));
  } else if (
    click.modalId &&
    !modalAlreadyOpen &&
    !keepLiveAvailability
  ) {
    // Fallback: journey runtime may not be wired — try window bridge.
    try {
      (
        window as Window & {
          __studioApplyStudioModal?: (id: string | undefined) => void;
        }
      ).__studioApplyStudioModal?.(click.modalId);
    } catch {
      /* hang-safe */
    }
    await new Promise((r) => setTimeout(r, playbackMs(350)));
  }

  const cameraChain =
    click.cameraSelectorChain ??
    (click.cameraAnchorSelector ? [click.cameraAnchorSelector] : undefined);
  if (cameraChain?.length) {
    const cameraEl =
      resolvePlaybackSelectorChain(cameraChain, document) ??
      (click.cameraAnchorSelector
        ? document.querySelector<HTMLElement>(click.cameraAnchorSelector)
        : null);
    if (cameraEl && !isDegradedClickTarget(cameraEl)) {
      await scrollCameraToTarget(cameraEl, { instant: false });
    }
  }

  if (isAvailDateSurfaceClick(click)) {
    await ensureAvailDateSurfaceReady();
  }

  let target = await waitForStableRecordedClickTarget(click, {
    preferSlottedLocation,
  });
  if (!target && isLoginModalOpenInDom()) {
    const drain = await drainLoginModalIfOpen({ fast: isFastPlayback() });
    if (!drain.ok) {
      playbackDiagClick({
        ok: false,
        selector: click.selectorChain?.[0] ?? click.element ?? "?",
        detail: `click FAIL — login drain failed (${drain.reason ?? "unknown"})`,
      });
      return scriptFail(
        drain.reason
          ? `recorded-click:login-drain:${drain.reason}`
          : "recorded-click:login-drain-failed"
      );
    }
    if (drain.drained) {
      target = await waitForStableRecordedClickTarget(click, {
        preferSlottedLocation,
      });
    }
  }

  if (!target && isAvailDateSurfaceClick(click)) {
    await ensureAvailDateSurfaceReady();
    target = await waitForStableRecordedClickTarget(click);
  }

  if (!target) {
    const underModal =
      Boolean(resolvePlaybackSelectorChain(click.selectorChain, document)) &&
      isBlockingModalOpen();
    playbackDiagClick({
      ok: false,
      selector: click.selectorChain?.[0] ?? click.element ?? "?",
      detail: underModal
        ? "click FAIL — recorded target under blocking modal (no click-through)"
        : "click FAIL — degraded/missing recorded target (no invent success)",
    });
    return scriptFail(
      underModal
        ? "recorded-click:blocked-by-modal"
        : "recorded-click:target-degraded"
    );
  }

  // Avail handoff / prior beat may already leave the recorded date/time selected.
  // Re-clicking is an idempotent no-op — count as met, not click FAIL (matches
  // built-in select-book-date skip). New REC still rejects selected targets.
  if (isAlreadySelectedNoopTarget(target)) {
    playbackDiagClick({
      ok: true,
      selector: click.selectorChain?.[0] ?? click.element ?? "?",
      detail: "recorded-click · already-selected — skip (outcome met)",
    });
    return { ok: true };
  }

  let clicked = false;
  for (let attempt = 0; attempt < 3 && !clicked; attempt += 1) {
    // The cursor flight itself gives React time to replace a result tile. A
    // failed simulation dispatches no click, so safely re-resolve the semantic
    // target and retry instead of stalling on the detached node.
    const liveTarget =
      attempt === 0 && isClickableTarget(target)
        ? target
        : await waitForStableRecordedClickTarget(click, {
            preferSlottedLocation,
          });
    if (!liveTarget) break;
    clicked = await simulateDemoPointerClick(liveTarget, { scroll: true });
  }
  if (!clicked) return fromBool(false, "recorded-click");

  // PDP Book Now (logged out) opens login — sign in so later beats can proceed.
  // Brief wait so React can paint the modal before we look for it.
  await new Promise((r) => setTimeout(r, playbackMs(200)));
  if (
    isLoginModalOpenInDom() &&
    !nextBeatOwnsLogin &&
    !isLoginAction
  ) {
    const drain = await drainLoginModalIfOpen({ fast: isFastPlayback() });
    if (!drain.ok) {
      playbackDiagClick({
        ok: false,
        selector: click.selectorChain?.[0] ?? click.element ?? "?",
        detail: `click ok but login drain failed (${drain.reason ?? "unknown"})`,
      });
      return scriptFail(
        drain.reason
          ? `recorded-click:login-drain:${drain.reason}`
          : "recorded-click:login-drain-failed"
      );
    }
  }

  return { ok: true };
}
