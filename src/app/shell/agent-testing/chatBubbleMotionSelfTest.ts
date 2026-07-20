/**
 * Full agentic chat bubble-motion self-test (restartable).
 * Gate must be open — samples only record while QA diag gate is open.
 *
 * Console: `await window.__studioRunChatBubbleMotionSelfTest?.()`
 * Docs: SELF_TEST.md § chat-bubble-motion-full
 */

import {
  getPlaybackDiagBundle,
  playbackDiagClear,
  type PlaybackDiagEvent,
} from "@/app/shell/playbackDiag";
import { CHAT_PULL_UP_MS } from "@/projects/boots-pharmacy/screens/chat/chatMotion";

const CHAT_PULL_UP_SETTLE_MS = CHAT_PULL_UP_MS + 100;
/** Scripted Boots chat frames — keep in sync with chatThreadContent. */
export const CHAT_BUBBLE_MOTION_EXPECTED_IDS = [
  "q0",
  "r0",
  "q1",
  "r1",
  "q2",
  "r2",
  "q3",
  "r3",
] as const;

export type ChatBubbleMotionBubbleKind = "query" | "reply";

export type ChatBubbleMotionBubbleResult = {
  id: string;
  kind: ChatBubbleMotionBubbleKind;
  ok: boolean;
  sampleCount: number;
  frameCount: number;
  jumps: number;
  maxAbsDeltaY: number;
  maxAbsDeltaTransformY: number;
  phases: string[];
  hasMount: boolean;
  hasAnimateStart: boolean;
  hasFrames: boolean;
  hasAnimateEnd: boolean;
  /** Reply only — thinking→reply handoff logged. */
  hasThinkingHandoff: boolean;
  continuousY: boolean;
  yHead?: number | null;
  yTail?: number | null;
  detail?: string;
};

export type ChatBubbleMotionSelfTestResult = {
  ok: boolean;
  atIso: string;
  mode: "assert-only" | "drive";
  summary: {
    count: number;
    jumps: number;
    maxAbsDeltaY: number;
    maxAbsDeltaTransformY: number;
    ids: string[];
    skippedPhaseNotes: string[];
  };
  bubbles: ChatBubbleMotionBubbleResult[];
  missingIds: string[];
  checks: Array<{ id: string; ok: boolean; detail?: string }>;
};

function bubbleKind(id: string): ChatBubbleMotionBubbleKind {
  return id.startsWith("r") ? "reply" : "query";
}

function ySeries(samples: PlaybackDiagEvent[]): number[] {
  return samples
    .filter((s) => s.bubble?.phase === "frame" && typeof s.bubble.y === "number")
    .map((s) => s.bubble!.y as number);
}

/**
 * Continuous ease: frame y should mostly decrease (or stay) toward 0 —
 * no up-spike > 2px after motion started descending.
 */
function isContinuousEase(ys: number[]): boolean {
  if (ys.length < 3) return ys.length > 0;
  let sawDescent = false;
  for (let i = 1; i < ys.length; i++) {
    const d = ys[i]! - ys[i - 1]!;
    if (d < -0.05) sawDescent = true;
    // After descent started, forbid large upward jumps (choppy reverse).
    if (sawDescent && d > 2) return false;
  }
  return true;
}

export function analyzeChatBubbleMotionSamples(
  samples: PlaybackDiagEvent[],
  expectedIds: readonly string[] = CHAT_BUBBLE_MOTION_EXPECTED_IDS
): Omit<ChatBubbleMotionSelfTestResult, "mode" | "atIso"> {
  const byId = new Map<string, PlaybackDiagEvent[]>();
  for (const s of samples) {
    const id = s.bubble?.id;
    if (!id) continue;
    const list = byId.get(id) ?? [];
    list.push(s);
    byId.set(id, list);
  }

  const bubbles: ChatBubbleMotionBubbleResult[] = [];
  const missingIds: string[] = [];

  for (const id of expectedIds) {
    const list = byId.get(id) ?? [];
    if (list.length === 0) {
      missingIds.push(id);
      bubbles.push({
        id,
        kind: bubbleKind(id),
        ok: false,
        sampleCount: 0,
        frameCount: 0,
        jumps: 0,
        maxAbsDeltaY: 0,
        maxAbsDeltaTransformY: 0,
        phases: [],
        hasMount: false,
        hasAnimateStart: false,
        hasFrames: false,
        hasAnimateEnd: false,
        hasThinkingHandoff: false,
        continuousY: false,
        detail: "no samples",
      });
      continue;
    }

    const phases = [
      ...new Set(
        list
          .map((s) => s.bubble?.phase)
          .filter((p): p is string => typeof p === "string")
      ),
    ];
    const frames = list.filter((s) => s.bubble?.phase === "frame");
    let jumps = 0;
    let maxAbsDeltaY = 0;
    let maxAbsDeltaTransformY = 0;
    for (const s of list) {
      const b = s.bubble;
      if (!b) continue;
      if (b.jump) jumps += 1;
      if (typeof b.deltaY === "number") {
        maxAbsDeltaY = Math.max(maxAbsDeltaY, Math.abs(b.deltaY));
      }
      if (typeof b.deltaTransformY === "number") {
        maxAbsDeltaTransformY = Math.max(
          maxAbsDeltaTransformY,
          Math.abs(b.deltaTransformY)
        );
      }
    }
    const ys = ySeries(list);
    const continuousY = isContinuousEase(ys);
    const kind = bubbleKind(id);
    const hasMount = phases.includes("mount");
    const hasAnimateStart = phases.includes("animate-start");
    const hasFrames = frames.length >= 3;
    const hasAnimateEnd = phases.includes("animate-end");
    const hasThinkingHandoff =
      kind === "query" ? true : phases.includes("thinking-handoff");

    // q0 is often CJM entry-paint (resolveChatRevealedFrameCount minVisible=1)
    // — no progressive pull-up. Accept sparse phases when jumps=0.
    const entryPaint =
      id === "q0" && !hasFrames && jumps === 0 && list.length > 0;

    const ok = entryPaint
      ? true
      : list.length > 0 &&
        hasAnimateStart &&
        hasFrames &&
        hasAnimateEnd &&
        jumps === 0 &&
        continuousY &&
        hasThinkingHandoff &&
        maxAbsDeltaY <= 10 &&
        maxAbsDeltaTransformY <= 4.5;

    const detailParts: string[] = [];
    if (entryPaint) detailParts.push("entry-paint (minVisible=1)");
    if (!entryPaint && !hasAnimateStart) detailParts.push("missing animate-start");
    if (!entryPaint && !hasFrames) detailParts.push(`frames=${frames.length}`);
    if (!entryPaint && !hasAnimateEnd) detailParts.push("missing animate-end");
    if (jumps > 0) detailParts.push(`jumps=${jumps}`);
    if (!entryPaint && !continuousY) detailParts.push("y not continuous");
    if (kind === "reply" && !phases.includes("thinking-handoff")) {
      detailParts.push("missing thinking-handoff");
    }

    bubbles.push({
      id,
      kind,
      ok,
      sampleCount: list.length,
      frameCount: frames.length,
      jumps,
      maxAbsDeltaY,
      maxAbsDeltaTransformY,
      phases,
      hasMount,
      hasAnimateStart,
      hasFrames,
      hasAnimateEnd,
      hasThinkingHandoff: phases.includes("thinking-handoff"),
      continuousY,
      yHead: ys[0] ?? null,
      yTail: ys.length ? ys[ys.length - 1]! : null,
      detail: detailParts.length ? detailParts.join("; ") : "clean",
    });
  }

  let totalJumps = 0;
  let maxAbsDeltaY = 0;
  let maxAbsDeltaTransformY = 0;
  for (const b of bubbles) {
    totalJumps += b.jumps;
    maxAbsDeltaY = Math.max(maxAbsDeltaY, b.maxAbsDeltaY);
    maxAbsDeltaTransformY = Math.max(
      maxAbsDeltaTransformY,
      b.maxAbsDeltaTransformY
    );
  }

  const checks = [
    {
      id: "all-ids-sampled",
      ok: missingIds.length === 0,
      detail:
        missingIds.length === 0
          ? `${expectedIds.length} ids`
          : `missing ${missingIds.join(",")}`,
    },
    {
      id: "no-jumps",
      ok: totalJumps === 0,
      detail: `jumps=${totalJumps}`,
    },
    {
      id: "bubbles-ok",
      ok: bubbles.every((b) => b.ok),
      detail: `${bubbles.filter((b) => b.ok).length}/${bubbles.length} ok`,
    },
    {
      id: "replies-thinking-handoff",
      ok: bubbles
        .filter((b) => b.kind === "reply" && b.sampleCount > 0)
        .every((b) => b.hasThinkingHandoff),
      detail: "r* thinking→reply",
    },
  ];

  return {
    ok: checks.every((c) => c.ok),
    summary: {
      count: samples.length,
      jumps: totalJumps,
      maxAbsDeltaY,
      maxAbsDeltaTransformY,
      ids: [...byId.keys()],
      skippedPhaseNotes: [],
    },
    bubbles,
    missingIds,
    checks,
  };
}

export function assertChatBubbleMotionFromBundle(
  expectedIds: readonly string[] = CHAT_BUBBLE_MOTION_EXPECTED_IDS
): ChatBubbleMotionSelfTestResult {
  const bundle = getPlaybackDiagBundle();
  const analyzed = analyzeChatBubbleMotionSamples(
    bundle.chatBubbleMotion.samples,
    expectedIds
  );
  return {
    ...analyzed,
    atIso: new Date().toISOString(),
    mode: "assert-only",
    summary: {
      ...analyzed.summary,
      skippedPhaseNotes: bundle.chatBubbleMotion.skippedPhaseNotes,
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function readBubblePace(): {
  stepMs: number;
  thinkMs: number;
  settleMs: number;
} {
  const w = window as Window & {
    __studioChatBubbleMotionPaceMs?: {
      step?: number;
      think?: number;
      settle?: number;
    };
  };
  const o = w.__studioChatBubbleMotionPaceMs;
  return {
    stepMs: typeof o?.step === "number" ? o.step : 400,
    // SITE_PILOT_CHAT_PLAYBACK_THINK_MS (1400) + pull-up (~340) + cushion
    thinkMs: typeof o?.think === "number" ? o.think : 2000,
    settleMs: typeof o?.settle === "number" ? o.settle : 500,
  };
}

/**
 * Drive agentic chat SF progressive path with QA gate open, then assert.
 * Assumes Studio is already on boots-pharmacy chat (or navigates via URL replace).
 */
export async function runChatBubbleMotionSelfTest(options?: {
  /** Assert only against current dump/bundle — skip drive. */
  assertOnly?: boolean;
  expectedIds?: readonly string[];
}): Promise<ChatBubbleMotionSelfTestResult> {
  const expectedIds = options?.expectedIds ?? CHAT_BUBBLE_MOTION_EXPECTED_IDS;

  if (options?.assertOnly) {
    return assertChatBubbleMotionFromBundle(expectedIds);
  }

  const w = window as Window & {
    __studioForceClearAgentTestingOverlay?: () => void;
    __studioOpenQaLogger?: (opts?: { kind?: string }) => void;
    __studioPlaybackDiagClear?: () => void;
    __studioTriggerTransport?: (action: string) => boolean;
    __protoTriggerTransport?: (action: string) => boolean;
    __studioAgentTestingOverlay?: {
      appendFinale?: (result: "pass" | "fail", summary?: string) => void;
      logStep?: (input: {
        label?: string;
        outcome?: "ok" | "soft-fail" | "fail";
        kind?: string;
      }) => void;
    };
  };

  const transport = (action: string) =>
    w.__studioTriggerTransport?.(action) ??
    w.__protoTriggerTransport?.(action) ??
    false;

  const pace = readBubblePace();

  // Ensure chat + agentic CJM URL
  try {
    const u = new URL(location.href);
    let dirty = false;
    if (u.searchParams.get("project") !== "boots-pharmacy") {
      u.searchParams.set("project", "boots-pharmacy");
      dirty = true;
    }
    if (u.searchParams.get("screen") !== "chat") {
      u.searchParams.set("screen", "chat");
      dirty = true;
    }
    if (u.searchParams.get("experience") !== "agentic") {
      u.searchParams.set("experience", "agentic");
      dirty = true;
    }
    if (u.searchParams.get("cjm") !== "on") {
      u.searchParams.set("cjm", "on");
      dirty = true;
    }
    if (dirty) {
      history.replaceState(null, "", u.toString());
      // Soft navigate via existing Studio hash/param listeners if any — reload if needed
      window.dispatchEvent(new PopStateEvent("popstate"));
      await sleep(pace.settleMs);
    }
  } catch {
    /* hang-safe */
  }

  w.__studioForceClearAgentTestingOverlay?.();
  await sleep(200);
  w.__studioOpenQaLogger?.({ kind: "agent" });
  await sleep(pace.settleMs);
  playbackDiagClear();
  w.__studioPlaybackDiagClear?.();

  const onChat = () =>
    new URLSearchParams(location.search).get("screen") === "chat";

  const revealedCount = () =>
    document.querySelectorAll(
      '[data-studio-chat-frame][data-studio-chat-revealed="true"]'
    ).length;

  // Soft reset: retreat on chat only until zero reveals (do not leave chat beat).
  for (let i = 0; i < 16 && onChat() && revealedCount() > 0; i++) {
    transport("step-back");
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === "Step back"
    ) as HTMLButtonElement | undefined;
    if (btn && !btn.disabled) btn.click();
    await sleep(280);
  }
  if (!onChat()) {
    // Fell off chat — hard URL fix (caller should have landed on chat).
    location.assign(
      `${location.pathname}?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic`
    );
    await sleep(1200);
    w.__studioOpenQaLogger?.({ kind: "agent" });
    await sleep(pace.settleMs);
  }

  playbackDiagClear();
  w.__studioPlaybackDiagClear?.();

  const isRevealed = (id: string) => {
    const el = document.querySelector(
      `[data-studio-chat-frame="${id}"]`
    ) as HTMLElement | null;
    return el?.getAttribute("data-studio-chat-revealed") === "true";
  };

  const waitUntil = async (
    pred: () => boolean,
    maxMs: number,
    pollMs = 120
  ) => {
    const start = performance.now();
    while (performance.now() - start < maxMs) {
      if (pred()) return true;
      await sleep(pollMs);
    }
    return pred();
  };

  // 8 frames — wait for each reveal (CTA/type-in/thinking can exceed fixed sleeps)
  for (let i = 0; i < expectedIds.length; i++) {
    const id = expectedIds[i]!;
    if (isRevealed(id)) {
      // Already painted without this run's samples — force re-reveal via back+forward
      if (i === 0 && revealedCount() === 1) {
        /* rare single-frame — still SF */
      } else if (i === 0) {
        w.__studioAgentTestingOverlay?.logStep?.({
          kind: "sequence",
          label: `Bubble ${id} already up — samples may be incomplete`,
          outcome: "soft-fail",
        });
      }
    }
    if (!isRevealed(id)) {
      // q2/q3: sitePilotChat beforeReveal clicks the agent CTA with demo cursor.
      // Do NOT raw-click here — that races/aborts the prelude and starves q3/r3.
      const clicked =
        transport("step-forward") ||
        (() => {
          const btn = [...document.querySelectorAll("button")].find(
            (b) => b.getAttribute("aria-label") === "Step forward"
          ) as HTMLButtonElement | undefined;
          if (!btn || btn.disabled) return false;
          btn.click();
          return true;
        })();
      const maxWait =
        id === "q3" || id === "q2"
          ? pace.thinkMs + 8000
          : id.startsWith("r")
            ? pace.thinkMs + 1800
            : i === 0
              ? pace.stepMs + 1500
              : pace.thinkMs + 2800;
      let got = await waitUntil(() => isRevealed(id), maxWait);
      if (!got && (id === "q2" || id === "q3")) {
        // Retry once via transport only (prelude owns CTA).
        transport("step-forward");
        const btn = [...document.querySelectorAll("button")].find(
          (b) => b.getAttribute("aria-label") === "Step forward"
        ) as HTMLButtonElement | undefined;
        if (btn && !btn.disabled) btn.click();
        got = await waitUntil(() => isRevealed(id), 8000);
      }
      await sleep(CHAT_PULL_UP_SETTLE_MS);
      w.__studioAgentTestingOverlay?.logStep?.({
        kind: "sequence",
        label: `Bubble SF → ${id}${clicked ? "" : " (blocked)"}${got ? "" : " TIMEOUT"}`,
        outcome: clicked && got ? "ok" : "soft-fail",
      });
    } else {
      await sleep(CHAT_PULL_UP_SETTLE_MS);
    }
  }

  await sleep(pace.settleMs);

  // Final composer clearance — only if last content still under dock.
  try {
    const col = document.querySelector<HTMLElement>(
      '[data-studio-react-screen="chat"] .chat__column, main.chat .chat__column'
    );
    const dock = document.querySelector<HTMLElement>(".chat__composer-dock");
    const last = [
      ...document.querySelectorAll(
        '[data-studio-chat-frame][data-studio-chat-revealed="true"]'
      ),
    ].pop() as HTMLElement | undefined;
    if (col && dock && last && !dock.hidden) {
      const clearPx =
        dock.getBoundingClientRect().top - last.getBoundingClientRect().bottom;
      if (clearPx < 16) {
        const max = Math.max(0, col.scrollHeight - col.clientHeight);
        col.scrollTop = max;
      }
    }
  } catch {
    /* hang-safe */
  }
  await sleep(180);

  const result = assertChatBubbleMotionFromBundle(expectedIds);
  result.mode = "drive";

  try {
    w.__studioAgentTestingOverlay?.appendFinale?.(
      result.ok ? "pass" : "fail",
      `chat-bubble-motion ${result.bubbles.filter((b) => b.ok).length}/${result.bubbles.length}`
    );
  } catch {
    /* hang-safe */
  }

  return result;
}
