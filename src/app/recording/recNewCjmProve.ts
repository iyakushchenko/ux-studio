/**
 * REC robustness prove — ALWAYS create a NEW random CJM, then Play that one.
 *
 * FORBIDDEN as prove: only playing built-in agentic-cjm / traditional-cjm
 * or replaying an old rec-* and calling REC robustness done.
 *
 * Window: `__studioRunRecNewCjmProve` / `__protoRunRecNewCjmProve`
 */

import { armRecCapture, assertRecLive, stopRecCaptureViaUi, type RecArmCaptureHooks } from "@/app/recording/recArmCapture";
import {
  isRecordingActive,
  stopRecording,
  type StartRecordingOptions,
} from "@/app/recording/recordingSession";
import { resolveUsableDemoClickTarget } from "@/app/recording/recordingCapture";
import { describeRecordingClickTarget } from "@/app/recording/recordingCapture";
import {
  logAgentTestingStep,
  touchAgentTestingOverlay,
} from "@/app/shell/agent-testing";
import { requireFreshQaSession } from "@/app/shell/requireFreshQaSession";
import { runFullPlayProve, type FullPlayProvePeak } from "@/app/shell/fullPlayProve";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { isStudioRecModeOnInDom } from "@/app/recording/studioRecModeDom";
import { afterRecClickDrainModal } from "@/app/recording/recModalDrain";
import { recUserPace, REC_USER_PACE_MS } from "@/app/recording/recUserPace";
import { getPrototypeScrollRoot } from "@/app/scenario/playbackScroll";
import { assertFirstBeatMatchesStartScreen } from "@/app/recording/recStartScreenAssert";
import { getLastRecordingSession } from "@/app/recording/recordingSession";

export type RecNewCjmProveOptions = {
  experience?: "agentic" | "traditional";
  label?: string;
  /** Max wait for Play prove of the new journey. */
  timeoutMs?: number;
  settleMs?: number;
};

export type RecNewCjmProveResult = {
  pass: boolean;
  journeyId: string | null;
  recLive: boolean;
  peak: FullPlayProvePeak | null;
  errors: string[];
};

export type RecNewCjmProveHooks = RecArmCaptureHooks & {
  setOrchestraMode?: (modeId: string) => void;
  getStartOptions?: () => StartRecordingOptions;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Product-facing CJM title — never agent-test / prove codenames. */
function mintDemoJourneyLabel(experience: "agentic" | "traditional"): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const slug = Math.random().toString(36).slice(2, 6);
  if (experience === "agentic") {
    return `Sarah · Home→Chat · ${hh}:${mm} · ${slug}`;
  }
  return `Sarah · PLP→Book · ${hh}:${mm} · ${slug}`;
}

/** Honest click targets — never coarse shell / tiles container. */
const PROVE_CLICK_SELECTORS = [
  '[data-studio-action="plp-book-now"]',
  '[data-studio-action="pdp-book-now"]',
  '[data-studio-action="book-step-1-continue"]',
  '[data-studio-action="plp-quick-view"]',
  'a[href*="pdp"]',
  'button[data-studio-action]',
  '[data-studio-action]',
] as const;

function pickHonestClickTarget(
  preferred?: readonly string[]
): HTMLElement | null {
  const list = preferred ?? PROVE_CLICK_SELECTORS;
  for (const sel of list) {
    const nodes = document.querySelectorAll<HTMLElement>(sel);
    for (const node of nodes) {
      if (!node.isConnected) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      const usable = resolveUsableDemoClickTarget(node);
      if (usable) return usable;
    }
  }
  return null;
}

async function pacedClick(sel: string, label: string): Promise<boolean> {
  await recUserPace("beforeCta");
  const target =
    pickHonestClickTarget([sel]) ??
    document.querySelector<HTMLElement>(sel);
  if (!target) return false;
  const usable = resolveUsableDemoClickTarget(target) ?? target;
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RecNewCjmCaptureClick",
      label: `robo-cursor · ${label} · ${describeRecordingClickTarget(usable)}`,
      outcome: "ok",
    });
  } catch {
    /* hang-safe */
  }
  const ok = await simulateDemoPointerClick(usable, { scroll: true });
  await recUserPace("afterClick");
  // HARD: never rush past a blocking modal (choose-pharmacy after Continue).
  const drain = await afterRecClickDrainModal();
  if (!drain.ok) {
    throw new Error(drain.reason ?? `modal drain failed (${drain.modalId})`);
  }
  await recUserPace("afterScreenChange");
  return ok;
}

async function pacedScrollStop(deltaPx: number): Promise<void> {
  const host = getPrototypeScrollRoot();
  if (!host) return;
  host.scrollBy({ top: deltaPx, behavior: "instant" as ScrollBehavior });
  host.dispatchEvent(new Event("scroll", { bubbles: true }));
  await recUserPace("betweenBeats");
  host.scrollBy({
    top: Math.sign(deltaPx) * 60,
    behavior: "instant" as ScrollBehavior,
  });
  host.dispatchEvent(new Event("scroll", { bubbles: true }));
  await recUserPace("scrollStopSettle");
}

function goPlpViaUrlOrTab(): void {
  // Prefer URL deep-link (same as PO / prove recipe) when not already on PLP.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("screen") !== "plp") {
      url.searchParams.set("project", url.searchParams.get("project") || "boots-pharmacy");
      url.searchParams.set("screen", "plp");
      url.searchParams.set("persona", url.searchParams.get("persona") || "sarah-jenkins");
      url.searchParams.set("cjm", "off");
      url.searchParams.set(
        "experience",
        url.searchParams.get("experience") || "traditional"
      );
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  } catch {
    /* hang-safe */
  }
  const tab =
    document.querySelector<HTMLElement>(
      '[data-studio-screen="plp"], button[aria-label*="Vaccination"], [data-screen-id="plp"]'
    ) ??
    Array.from(document.querySelectorAll<HTMLElement>("button, a")).find((el) =>
      /vaccination|plp/i.test(el.textContent ?? "")
    );
  tab?.click();
}

/**
 * ALWAYS CLEAR → arm REC (CREATE NEW) → human-paced path (modal drain) →
 * Add as CJM → Play THAT new journey. FAIL if rec never live or journeyId missing.
 *
 * Pace = {@link REC_USER_PACE_MS} (not optional). Modal `&modal=` = drain before next beat.
 */
export async function runRecNewCjmProve(
  hooks: RecNewCjmProveHooks,
  options?: RecNewCjmProveOptions
): Promise<RecNewCjmProveResult> {
  const experience = options?.experience ?? "traditional";
  const settle = options?.settleMs ?? 100;
  const errors: string[] = [];
  let journeyId: string | null = null;
  let recLive = false;
  let peak: FullPlayProvePeak | null = null;

  // 1) UNSKIPPABLE ALWAYS CLEAR QA (code law).
  const qa = requireFreshQaSession("AGENT TESTING — REC new CJM prove");
  if (!qa.ok) {
    errors.push(qa.reason ?? "QA ALWAYS CLEAR failed");
    return failResult(errors, journeyId, recLive, peak);
  }
  touchAgentTestingOverlay("AGENT TESTING — REC new CJM prove");

  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RunRecNewCjmProve",
      label: `REC robustness = NEW CJM only · ${experience}`,
      outcome: "ok",
    });
  } catch {
    /* hang-safe */
  }

  // Seed orchestra flavor so minted id is rec-trad-* / rec-agentic-*.
  const seedMode =
    experience === "traditional" ? "traditional-cjm" : "agentic-cjm";
  hooks.setOrchestraMode?.(seedMode);
  await delay(settle);

  // Land on PLP for traditional capture path.
  goPlpViaUrlOrTab();
  await recUserPace("afterScreenChange");
  for (let i = 0; i < 20 && !pickHonestClickTarget(['[data-studio-action="plp-book-now"]']); i++) {
    await delay(150);
  }

  // 2) Arm REC for real (CREATE NEW + Start).
  const armed = await armRecCapture(hooks);
  recLive = armed.ok;
  if (!armed.ok) {
    errors.push(armed.reason ?? "REC arm failed");
    return failResult(errors, journeyId, recLive, peak);
  }

  const assert1 = assertRecLive();
  if (!assert1.ok) {
    errors.push(assert1.reason ?? "assertRecLive failed after arm");
    return failResult(errors, journeyId, false, peak);
  }

  // 3) Human-paced NEW path — scroll-stops + Book + modal drain (not a 1-click stub).
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RecNewCjmCapturePath",
      label: `human pace · afterClick=${REC_USER_PACE_MS.afterClick}ms · scrollStop=${REC_USER_PACE_MS.scrollStopSettle}ms`,
      outcome: "ok",
    });
  } catch {
    /* hang-safe */
  }

  try {
    await pacedScrollStop(480);
    await pacedScrollStop(360);
    if (!(await pacedClick('[data-studio-action="plp-book-now"]', "PLP Book now"))) {
      // Fallback: any honest target once — still paced + modal-drained.
      const fallback = pickHonestClickTarget();
      if (!fallback) {
        errors.push("no honest click target (data-studio-action) on page");
        if (isRecordingActive()) stopRecording();
        return failResult(errors, journeyId, recLive, peak);
      }
      await recUserPace("beforeCta");
      const ok = await simulateDemoPointerClick(fallback, { scroll: true });
      if (!ok) {
        errors.push("robo-cursor click failed / degraded target");
        if (isRecordingActive()) stopRecording();
        return failResult(errors, journeyId, recLive, peak);
      }
      await recUserPace("afterClick");
      const drain = await afterRecClickDrainModal();
      if (!drain.ok) errors.push(drain.reason ?? "modal drain failed");
    } else {
      await pacedScrollStop(320);
      await pacedClick('[data-studio-action="pdp-book-now"]', "PDP Book now");
      // Traditional: Book may open login first — drain Sign in, then Book again.
      {
        const screenNow = (() => {
          try {
            return new URL(window.location.href).searchParams.get("screen");
          } catch {
            return null;
          }
        })();
        const loginGone = !document.querySelector(
          '[data-studio-modal="login"], .proto-login-card'
        );
        if (screenNow === "pdp" && loginGone) {
          await pacedClick(
            '[data-studio-action="pdp-book-now"]',
            "PDP Book now (after login)"
          );
        }
      }
      await pacedClick(
        '[data-studio-action="book-step-1-continue"]',
        "Book Step 1 Continue"
      );
      // afterRecClickDrainModal inside pacedClick handles choose-pharmacy.
      // After pick, book-step-1 still owns the page — Continue again → step 2.
      const screenAfterPharmacy = (() => {
        try {
          return new URL(window.location.href).searchParams.get("screen");
        } catch {
          return null;
        }
      })();
      if (screenAfterPharmacy === "book-step-1") {
        await pacedClick(
          '[data-studio-action="book-step-1-continue"]',
          "Book Step 1 Continue (after pharmacy)"
        );
      }
      // Onward as far as honest — Reserve when book-step-2 is up.
      for (
        let i = 0;
        i < 20 &&
        !document.querySelector('[data-studio-action="book-step-2-reserve"]');
        i++
      ) {
        await delay(150);
      }
      if (
        document.querySelector('[data-studio-action="book-step-2-reserve"]')
      ) {
        await pacedClick(
          '[data-studio-action="book-step-2-reserve"]',
          "Book Step 2 Reserve"
        );
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    if (isRecordingActive()) stopRecording();
    return failResult(errors, journeyId, recLive, peak);
  }

  // 4) ■ Stop via REC deck, then + Add as CJM via real UI (product title).
  if (!isRecordingActive()) {
    errors.push("REC died before Stop");
    return failResult(errors, journeyId, false, peak);
  }
  if (!(await stopRecCaptureViaUi(settle))) {
    stopRecording();
    await delay(settle);
  }
  if (isRecordingActive()) {
    errors.push("Stop failed — session still live");
    return failResult(errors, journeyId, false, peak);
  }

  const label = options?.label?.trim() || mintDemoJourneyLabel(experience);
  const beforeIds = new Set(
    (
      (
        window as Window & {
          __studioListJourneys?: () => Array<{ id: string; label?: string }>;
        }
      ).__studioListJourneys?.() ?? []
    ).map((j) => j.id)
  );

  const addBtn = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Add to project as CJM"]'
  );
  if (!addBtn || addBtn.disabled) {
    errors.push("Add as CJM button missing/disabled — stay in REC CREATE NEW deck");
    return failResult(errors, journeyId, recLive, peak);
  }
  addBtn.click();
  await delay(settle);
  const titleInput = document.querySelector<HTMLInputElement>(
    '.studio-nav-recording-add-cjm__input, [aria-label="New CJM title"] input'
  );
  const confirmBtn = document.querySelector<HTMLButtonElement>(
    ".studio-nav-recording-add-cjm__action--confirm"
  );
  if (!titleInput || !confirmBtn) {
    errors.push("Add as CJM title panel missing");
    return failResult(errors, journeyId, recLive, peak);
  }
  // Native value set so React controlled input accepts product title.
  const nativeSet = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  nativeSet?.call(titleInput, label);
  titleInput.dispatchEvent(new Event("input", { bubbles: true }));
  titleInput.dispatchEvent(new Event("change", { bubbles: true }));
  await delay(settle / 2);
  confirmBtn.click();
  await delay(settle * 2);

  const afterList =
    (
      window as Window & {
        __studioListJourneys?: () => Array<{ id: string; label?: string }>;
      }
    ).__studioListJourneys?.() ?? [];
  const minted = afterList.find(
    (j) => /^rec-/i.test(j.id) && !beforeIds.has(j.id)
  );
  journeyId = minted?.id ?? null;
  if (!journeyId) {
    // Fallback: SaveRecordingAsJourney if UI Add did not mint (same product label).
    const saveFn = (
      window as Window & {
        __studioSaveRecordingAsJourney?: (opts?: {
          label?: string;
          addAsNew?: boolean;
        }) => { journey: { id: string } };
      }
    ).__studioSaveRecordingAsJourney;
    if (!saveFn) {
      errors.push("Add as CJM UI did not mint journeyId");
      return failResult(errors, null, recLive, peak);
    }
    try {
      journeyId = saveFn({ label, addAsNew: true }).journey.id;
    } catch (err) {
      errors.push(
        `Add as CJM failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return failResult(errors, null, recLive, peak);
    }
  }
  if (journeyId === "agentic-cjm" || journeyId === "traditional-cjm") {
    errors.push(`journeyId missing or built-in: ${journeyId}`);
    return failResult(errors, null, recLive, peak);
  }
  if (!/^rec-/i.test(journeyId)) {
    errors.push(`journeyId not a new rec-* id: ${journeyId}`);
    return failResult(errors, journeyId, recLive, peak);
  }

  // HARD: first beat must equal screen at ● Start.
  const lastSession = getLastRecordingSession();
  const beat0 =
    (
      afterList as Array<{ id: string; beatIds?: string[] }>
    ).find((j) => j.id === journeyId)?.beatIds?.[0] ?? null;
  if (lastSession) {
    const startAssert = assertFirstBeatMatchesStartScreen(lastSession, {
      id: journeyId,
      label,
      beats: beat0
        ? [{ id: beat0, label: beat0, kind: "tab-landing" }]
        : [],
    });
    if (!startAssert.ok) {
      errors.push(startAssert.reason ?? "first beat ≠ start screen");
      return failResult(errors, journeyId, recLive, peak);
    }
  } else if (beat0) {
    errors.push(
      `cannot assert start screen — no last recording session (beat0=${beat0})`
    );
    return failResult(errors, journeyId, recLive, peak);
  }

  // 5) REC off + Play THAT new journey (not built-in).
  if (isStudioRecModeOnInDom()) {
    const recSw = document.querySelector<HTMLButtonElement>(
      '[role="switch"][aria-label="REC on"]'
    );
    recSw?.click();
    await delay(settle);
  }

  const play = await runFullPlayProve({
    journeyId,
    experience,
    timeoutMs: options?.timeoutMs ?? 120_000,
  });
  peak = play.peak;
  if (!play.pass) {
    errors.push(...(play.errors.length ? play.errors : ["Play prove failed"]));
  }

  const pass = errors.length === 0 && Boolean(journeyId) && recLive && play.pass;
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RunRecNewCjmProve",
      label: pass
        ? `REC new CJM PASS · ${journeyId}`
        : `REC new CJM FAIL · ${errors.join("; ")}`,
      outcome: pass ? "ok" : "fail",
    });
  } catch {
    /* hang-safe */
  }

  return { pass, journeyId, recLive, peak, errors };
}

function failResult(
  errors: string[],
  journeyId: string | null,
  recLive: boolean,
  peak: FullPlayProvePeak | null
): RecNewCjmProveResult {
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RunRecNewCjmProve",
      label: `REC new CJM FAIL · ${errors.join("; ")}`,
      outcome: "fail",
    });
  } catch {
    /* hang-safe */
  }
  return { pass: false, journeyId, recLive, peak, errors };
}
