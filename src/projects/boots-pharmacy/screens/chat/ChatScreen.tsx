import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "@/uxds/motion";
import { ButtonPrimary } from "@/uxds/components";
import {
  CHAT_PULL_UP,
  CHAT_PULL_UP_MS,
  logChatBubbleMotion,
  startChatBubbleMotionSample,
} from "./chatMotion";
import {
  endSitePilotChatThinking,
  isSitePilotChatSendThinking,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import { SitePilotComposer } from "../shared/SitePilotComposer";
import {
  STUDIO_SCROLL_OVERFLOW_ATTR,
  STUDIO_SCROLL_OVERFLOW_CLASS,
  syncStudioScrollOverflowGutter,
} from "@/app/scenario/studioScrollOverflow";
import { scrollChatCamera } from "@/app/scenario/playbackScroll";
import { CHAT_REACT_SCREEN_ID } from "./chatContract";
import { ChatSitePilotBar } from "./ChatSitePilotBar";
import {
  getChatThinkingBridgeState,
  subscribeChatThinkingBridge,
} from "./chatThinkingBridge";
import {
  dumpChatThreadDomOrder,
  getChatScenarioRevealState,
  isChatReplyHeldForPlaybackThinking,
  logChatReveal,
  resolveChatFrameRevealed,
  resolveChatPullUpAnimateIds,
  resolveChatRevealedFrameCount,
  subscribeChatScenarioReveal,
} from "./chatScenarioRevealBridge";
import { ChatThinkingBubble } from "./ChatThinkingBubble";
import {
  CHAT_CHIP_LABELS,
  CHAT_SUGGESTED_LABEL,
  CHAT_SUGGESTED_LABEL_ID,
  CHAT_THREAD_FRAMES,
  chatChipActionId,
  chatChipSlug,
  type ChatChipLabel,
  type ChatThreadFrame,
} from "./chatThreadContent";
import "./chat.css";

/**
 * Apply BEM once — do not set React `className` (scenario engine owns
 * `proto-scenario-frame*`). Plain `<div>` only: framer-motion inline opacity
 * overrides `.proto-scenario-frame--hidden` and dumps the full thread on enter.
 */
function useStaticFrameClasses(
  classNames: readonly string[]
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const name of classNames) el.classList.add(name);
  }, [classNames]);
  return ref;
}

/** Drop engine inline display/hide leftovers when React reveal bridge paints a frame. */
function useChatFrameRevealPaint(
  ref: RefObject<HTMLDivElement | null>,
  revealed: boolean
): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !revealed) return;
    el.style.display = "";
    el.classList.remove("proto-scenario-frame--hidden");
    el.dataset.studioScenarioVisible = "true";
  }, [ref, revealed]);
}

export type ChatScreenProps = {
  onSend?: (query: string) => void;
  onChip?: (label: ChatChipLabel) => void;
  onAgentCta?: (label: string) => void;
  onProductLink?: (label: string) => void;
};

/** Make `Frame342` / `Frame343` thumb paths (`svg-p97rh8hlns`). */
const THUMB_UP_PATHS = [
  "M10.8967 3.98816C11.8405 1.52853 10.0387 0.613319 8.95191 0.0985124C8.58011 -0.10169 8.1225 0.0127112 7.8651 0.355915L2.74563 7.4202C2.63123 7.56321 2.57403 7.73481 2.57403 7.93501V15.1423C2.57403 15.6285 2.94584 16.0003 3.43204 16.0003H11.9549C13.385 16.0003 14.672 15.1137 15.1868 13.7981L16.102 11.3957C16.5882 10.1658 16.4166 8.76442 15.673 7.67761C14.9294 6.59079 13.6996 5.93298 12.3554 5.93298H9.98152L10.8967 4.04536C10.8967 4.01676 10.8967 3.98816 10.8967 3.98816ZM12.3554 7.64901C13.1276 7.64901 13.814 8.02081 14.243 8.65002C14.672 9.27923 14.7578 10.0514 14.5004 10.7664L13.5852 13.1689C13.3278 13.8267 12.67 14.2843 11.9549 14.2843H4.29005V8.19241L8.83751 1.95754C9.60972 2.41514 9.58112 2.70114 9.32372 3.33035L7.8365 6.41919C7.7221 6.67659 7.7221 6.9912 7.8937 7.2486C8.0367 7.50601 8.3227 7.64901 8.60871 7.64901H12.3554Z",
  "M0 7.93548V15.1428C0 15.629 0.371805 16.0008 0.858011 16.0008C1.34422 16.0008 1.71602 15.629 1.71602 15.1428V7.93548C1.71602 7.44928 1.34422 7.07747 0.858011 7.07747C0.371805 7.07747 0 7.44928 0 7.93548Z",
] as const;

const THUMB_DOWN_PATHS = [
  "M5.47929 12.0126C4.53548 14.4723 6.3373 15.3875 7.42411 15.9023C7.79592 16.1025 8.25352 15.9881 8.51093 15.6449L13.6304 8.58058C13.7448 8.43758 13.802 8.26597 13.802 8.06577V0.858481C13.802 0.372275 13.4302 0.000471115 12.944 0.000471115H4.42107C2.99106 0.000471115 1.70404 0.887081 1.18924 2.2027L0.274023 4.60513C-0.212184 5.83494 -0.0405811 7.23636 0.703028 8.32318C1.44664 9.40999 2.67645 10.0678 4.02067 10.0678H6.3945L5.47929 11.9554C5.47929 11.984 5.47929 12.0126 5.47929 12.0126ZM4.02067 8.35178C3.24846 8.35178 2.56205 7.97997 2.13305 7.35076C1.70404 6.72156 1.61824 5.94934 1.87564 5.23434L2.79085 2.83191C3.04826 2.1741 3.70607 1.71649 4.42107 1.71649H12.086V7.80837L7.53851 14.0432C6.7663 13.5856 6.79491 13.2996 7.05231 12.6704L8.53953 9.58159C8.65393 9.32419 8.65393 9.00958 8.48233 8.75218C8.33932 8.49478 8.05332 8.35178 7.76732 8.35178H4.02067Z",
  "M16.376 8.0653V0.85801C16.376 0.371804 16.0042 0 15.518 0C15.0318 0 14.66 0.371804 14.66 0.85801V8.0653C14.66 8.55151 15.0318 8.92331 15.518 8.92331C16.0042 8.92331 16.376 8.55151 16.376 8.0653Z",
] as const;

function ThumbIcon({ paths }: { paths: readonly string[] }) {
  return (
    <span className="chat__helpful-icon" aria-hidden>
      <svg
        className="chat__helpful-icon-svg"
        fill="none"
        viewBox="0 0 16.376 16.0008"
        preserveAspectRatio="none"
      >
        {paths.map((d) => (
          <path key={d.slice(0, 24)} d={d} fill="#012169" />
        ))}
      </svg>
    </span>
  );
}

/** Make `ComponentGseSystemMessage` / `ComponentInputButton` — thumbs Yes/No (wire no-op). */
function HelpfulStrip({ conversation }: { conversation?: boolean }) {
  return (
    <div
      className="chat__helpful"
      data-name="component.gse.system.message"
      data-studio-chat-helpful={conversation ? "conversation" : "reply"}
      hidden={conversation ? true : undefined}
    >
      <div
        className="chat__helpful-row"
        data-name="component.input.button"
      >
        <p className="chat__helpful-prompt">
          {conversation
            ? "Was this conversation helpful so far?"
            : "Was this reply helpful?"}
        </p>
        <button type="button" className="chat__helpful-choice">
          <ThumbIcon paths={THUMB_UP_PATHS} />
          Yes
        </button>
        <button type="button" className="chat__helpful-choice">
          <ThumbIcon paths={THUMB_DOWN_PATHS} />
          No
        </button>
      </div>
    </div>
  );
}

/**
 * Make `component.input.button` bubble pills — UXDS ButtonPrimary commerce
 * (same navy primary as PLP/PDP). Make runtime forced Figma `#003fcb` rest
 * fills back to `#012169`; no page-local CTA color/hover CSS.
 */
function AgentCta({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <ButtonPrimary
      className="chat__cta uxds-btn-primary--commerce"
      onClick={onClick}
    >
      {label}
    </ButtonPrimary>
  );
}

const QUERY_FRAME_CLASSES = ["chat__frame", "chat__frame--query"];

/**
 * Parent frames use `hidden` / `display:none` until revealed. On reveal the
 * motion.div enters with framer-motion's normal initial→animate tween.
 * `shouldAnimate` gates the pull-up to one-at-a-time reveals only.
 * Batch reveals skip to final position (no initial offset).
 */
function useChatPullUpLive(
  revealed: boolean,
  shouldAnimate: boolean
): boolean {
  const [live, setLive] = useState(false);
  useLayoutEffect(() => {
    if (!revealed) {
      setLive(false);
      return;
    }
    if (!shouldAnimate) {
      setLive(true);
      return;
    }
    // One rAF: parent `hidden` removal commits before Motion measures.
    setLive(false);
    const raf = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(raf);
  }, [revealed, shouldAnimate]);
  return live;
}

/** Mount → animate-start → rAF frames → animate-end for chat-bubble-motion. */
function useChatBubbleMotionDiag(
  bubbleRef: RefObject<HTMLElement | null>,
  options: {
    id: string;
    revealed: boolean;
    shouldAnimate: boolean;
    pullLive: boolean;
    visibleCount?: number;
  }
): void {
  const sampleCancelRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!options.revealed || !options.shouldAnimate) {
      sampleCancelRef.current?.();
      sampleCancelRef.current = null;
      return;
    }
    logChatBubbleMotion({
      id: options.id,
      phase: "mount",
      y: CHAT_PULL_UP.initial.y,
      opacity: CHAT_PULL_UP.initial.opacity,
      layoutY: bubbleRef.current
        ? Math.round(bubbleRef.current.getBoundingClientRect().top * 100) / 100
        : null,
      deltaY: 0,
      shouldAnimate: true,
      visibleCount: options.visibleCount ?? null,
    });
  }, [options.revealed, options.shouldAnimate, options.id, options.visibleCount, bubbleRef]);

  useEffect(() => {
    if (!options.revealed || !options.shouldAnimate || !options.pullLive) {
      return;
    }
    logChatBubbleMotion({
      id: options.id,
      phase: "animate-start",
      y: CHAT_PULL_UP.initial.y,
      opacity: 0,
      layoutY: bubbleRef.current
        ? Math.round(bubbleRef.current.getBoundingClientRect().top * 100) / 100
        : null,
      deltaY: 0,
      shouldAnimate: true,
      visibleCount: options.visibleCount ?? null,
    });
    sampleCancelRef.current?.();
    let cancelled = false;
    const armSample = () => {
      if (cancelled) return;
      const el = bubbleRef.current;
      if (!el) {
        requestAnimationFrame(armSample);
        return;
      }
      sampleCancelRef.current = startChatBubbleMotionSample({
        id: options.id,
        el,
        shouldAnimate: true,
        visibleCount: options.visibleCount,
        durationMs: CHAT_PULL_UP_MS + 80,
      });
    };
    armSample();
    const endTimer = window.setTimeout(() => {
      sampleCancelRef.current?.();
      sampleCancelRef.current = null;
      logChatBubbleMotion({
        id: options.id,
        phase: "animate-end",
        y: 0,
        opacity: 1,
        layoutY: bubbleRef.current
          ? Math.round(bubbleRef.current.getBoundingClientRect().top * 100) / 100
          : null,
        deltaY: 0,
        shouldAnimate: true,
        visibleCount: options.visibleCount ?? null,
      });
    }, CHAT_PULL_UP_MS + 40);
    return () => {
      cancelled = true;
      window.clearTimeout(endTimer);
      sampleCancelRef.current?.();
      sampleCancelRef.current = null;
    };
  }, [
    options.revealed,
    options.shouldAnimate,
    options.pullLive,
    options.id,
    options.visibleCount,
    bubbleRef,
  ]);
}

function QueryFrame({
  frame,
  revealed,
  shouldAnimate,
  visibleCount,
}: {
  frame: Extract<ChatThreadFrame, { kind: "query" }>;
  revealed: boolean;
  shouldAnimate: boolean;
  visibleCount?: number;
}) {
  const ref = useStaticFrameClasses(QUERY_FRAME_CLASSES);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  useChatFrameRevealPaint(ref, revealed);
  const pullLive = useChatPullUpLive(revealed, shouldAnimate);
  useChatBubbleMotionDiag(bubbleRef, {
    id: frame.id,
    revealed,
    shouldAnimate,
    pullLive,
    visibleCount,
  });
  const bubble = (
    <>
      <div data-name="Subtotal">
        <p>{frame.text}</p>
      </div>
    </>
  );

  // Same CHAT_PULL_UP as agent (opacity+y ease) — no height 0→auto stepping.
  return (
    <div
      ref={ref}
      data-name="query"
      data-studio-chat-frame={frame.id}
      data-studio-chat-revealed={revealed ? "true" : "false"}
      hidden={!revealed}
      aria-hidden={!revealed}
    >
      {revealed ? (
        <motion.div
          ref={bubbleRef}
          className="chat__bubble chat__bubble--user"
          data-name="component.co.order.summary"
          data-studio-chat-user-slot={frame.id}
          data-studio-chat-pull-up={pullLive ? "up" : "start"}
          initial={shouldAnimate ? CHAT_PULL_UP.initial : false}
          animate={
            pullLive
              ? CHAT_PULL_UP.animate
              : shouldAnimate
                ? CHAT_PULL_UP.initial
                : CHAT_PULL_UP.animate
          }
          transition={CHAT_PULL_UP.transition}
        >
          {bubble}
        </motion.div>
      ) : (
        <div
          className="chat__bubble chat__bubble--user"
          data-name="component.co.order.summary"
        >
          {bubble}
        </div>
      )}
    </div>
  );
}

const REPLY_FRAME_CLASSES = ["chat__frame", "chat__frame--reply"];

/**
 * Agent turn slot — thinking LEFT then reply in the same slot (Make).
 * AnimatePresence mode=sync: thinking opacity-exits while reply pull-ups —
 * no sibling unmount collapse, no opacity-only flash swap.
 */
function ReplyFrame({
  frame,
  revealed,
  showThinking,
  shouldAnimate,
  thinkingGeneration,
  onAgentCta,
  onProductLink,
  visibleCount,
}: {
  frame: Extract<ChatThreadFrame, { kind: "reply" }>;
  revealed: boolean;
  showThinking: boolean;
  shouldAnimate: boolean;
  thinkingGeneration: number;
  onAgentCta?: (label: string) => void;
  onProductLink?: (label: string) => void;
  visibleCount?: number;
}) {
  const ref = useStaticFrameClasses(REPLY_FRAME_CLASSES);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const paint = revealed || showThinking;
  const replyActive = revealed && !showThinking;
  useChatFrameRevealPaint(ref, paint);
  const pullLive = useChatPullUpLive(replyActive, shouldAnimate);
  useChatBubbleMotionDiag(bubbleRef, {
    id: frame.id,
    revealed: replyActive,
    shouldAnimate,
    pullLive,
    visibleCount,
  });

  const loggedHandoffRef = useRef(false);
  useEffect(() => {
    if (!replyActive || !shouldAnimate || loggedHandoffRef.current) return;
    loggedHandoffRef.current = true;
    logChatBubbleMotion({
      id: frame.id,
      phase: "thinking-handoff",
      y: CHAT_PULL_UP.initial.y,
      opacity: 0,
      layoutY: bubbleRef.current
        ? Math.round(bubbleRef.current.getBoundingClientRect().top * 100) / 100
        : null,
      deltaY: 0,
      shouldAnimate: true,
      visibleCount: visibleCount ?? null,
      note: "sync: thinking opacity-exit + reply pull-up in-slot",
    });
  }, [replyActive, shouldAnimate, frame.id, visibleCount]);

  const onBodyClick = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    const link = t?.closest?.(".uxds-link, .chat__link");
    if (!link) return;
    const label = (link.textContent ?? "").replace(/\s+/g, " ").trim();
    if (label) onProductLink?.(label);
  };

  const bubbleBody = (
    <>
      {frame.thoughtLabel ? (
        <p className="chat__thought">{frame.thoughtLabel}</p>
      ) : null}
      <div data-name="Subtotal" onClick={onBodyClick}>
        {frame.body}
      </div>
      {frame.ctas.length > 0 ? (
        <div className="chat__cta-row">
          {frame.ctas.map((cta) => (
            <AgentCta
              key={cta.label}
              label={cta.label}
              onClick={() => onAgentCta?.(cta.label)}
            />
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      ref={ref}
      data-name="reply"
      data-studio-chat-frame={frame.id}
      data-studio-chat-revealed={revealed ? "true" : "false"}
      data-studio-chat-thinking-slot={showThinking ? "true" : undefined}
      hidden={!paint}
      aria-hidden={!paint}
    >
      <motion.div
        className="chat__agent-slot"
        data-studio-chat-agent-slot={frame.id}
        // Disable layout projection while thinking — layout="size" + opacity:0
        // enter hid the LEFT dots before r0 (regression after user-slot Motion).
        layout={showThinking ? false : "size"}
        transition={CHAT_PULL_UP.transition}
      >
        <AnimatePresence mode="sync" initial={false}>
          {showThinking ? (
            <ChatThinkingBubble
              key={`think-${frame.id}-${thinkingGeneration}`}
              mode="playback"
              generation={thinkingGeneration}
            />
          ) : replyActive ? (
            <motion.div
              key={`reply-${frame.id}`}
              ref={bubbleRef}
              className="chat__bubble chat__bubble--agent"
              data-name="component.co.order.summary"
              data-studio-chat-pull-up={pullLive ? "up" : "start"}
              initial={shouldAnimate ? CHAT_PULL_UP.initial : false}
              animate={
                pullLive
                  ? CHAT_PULL_UP.animate
                  : shouldAnimate
                    ? CHAT_PULL_UP.initial
                    : CHAT_PULL_UP.animate
              }
              transition={CHAT_PULL_UP.transition}
            >
              {bubbleBody}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
      {frame.helpful && replyActive ? <HelpfulStrip /> : null}
    </div>
  );
}

function useComposerSuppressed(): boolean {
  const [suppressed, setSuppressed] = useState(() =>
    document.body.hasAttribute("data-studio-chat-composer-suppressed")
  );
  useEffect(() => {
    const sync = () =>
      setSuppressed(
        document.body.hasAttribute("data-studio-chat-composer-suppressed")
      );
    const mo = new MutationObserver(sync);
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-studio-chat-composer-suppressed"],
    });
    sync();
    return () => mo.disconnect();
  }, []);
  return suppressed;
}

const CHAT_COMPOSER_PAD_VAR = "--studio-chat-composer-h";

/**
 * Measure overlay composer dock → CSS var on `.chat__column` so
 * padding-bottom / scroll-padding-bottom track Motion wrap height.
 * Near-bottom scroll adjusts when pad grows (Make syncInPlaceGeometry).
 */
function useChatComposerScrollPad(
  columnRef: RefObject<HTMLDivElement | null>,
  dockRef: RefObject<HTMLFooterElement | null>,
  suppressed: boolean
): void {
  useLayoutEffect(() => {
    const column = columnRef.current;
    const dock = dockRef.current;
    if (!column) return;

    const apply = () => {
      const nextPad =
        suppressed || !dock || dock.hidden
          ? 0
          : Math.ceil(dock.getBoundingClientRect().height);
      const prevPad = parseFloat(
        column.style.getPropertyValue(CHAT_COMPOSER_PAD_VAR) || "0"
      );
      const prevMax = Math.max(0, column.scrollHeight - column.clientHeight);
      const prevTop = column.scrollTop;
      const nearBottom = prevMax - prevTop < 120;

      column.style.setProperty(CHAT_COMPOSER_PAD_VAR, `${nextPad}px`);

      if (prevPad === nextPad || !nearBottom) return;
      // Skip pad scroll adjust while a bubble is mid pull-up — pad deltas
      // cancel Motion transform (sitePilotChat: snap only before/after tween).
      if (column.querySelector('[data-studio-chat-pull-up="start"]')) return;
      requestAnimationFrame(() => {
        if (column.querySelector('[data-studio-chat-pull-up="start"]')) return;
        const newMax = Math.max(0, column.scrollHeight - column.clientHeight);
        const maxDelta = newMax - prevMax;
        if (maxDelta !== 0) {
          // LAYOUT SYNC (composer pad height) — not journey camera SSoT.
          // Keeps near-bottom position when dock pad grows; do not route via scrollCamera*.
          column.scrollTop = Math.max(0, prevTop + maxDelta);
        }
      });
    };

    apply();
    if (!dock) return;

    const ro = new ResizeObserver(apply);
    ro.observe(dock);
    return () => {
      ro.disconnect();
      column.style.removeProperty(CHAT_COMPOSER_PAD_VAR);
    };
  }, [columnRef, dockRef, suppressed]);
}

export function ChatScreen({
  onSend,
  onChip,
  onAgentCta,
  onProductLink,
}: ChatScreenProps) {
  const [query, setQuery] = useState("");
  const [sendThinking, setSendThinking] = useState(false);
  const composerSuppressed = useComposerSuppressed();
  const columnRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLFooterElement | null>(null);
  useChatComposerScrollPad(columnRef, dockRef, composerSuppressed);

  /** Thin-track reserve only when overflowing — center X stays put; no empty Home-like gutter. */
  useLayoutEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    const apply = () => syncStudioScrollOverflowGutter(column);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(column);
    const mo = new MutationObserver(apply);
    mo.observe(column, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      column.classList.remove(STUDIO_SCROLL_OVERFLOW_CLASS);
      column.removeAttribute(STUDIO_SCROLL_OVERFLOW_ATTR);
      column.style.removeProperty("--studio-scrollbar-size");
    };
  }, []);

  const thinking = useSyncExternalStore(
    subscribeChatThinkingBridge,
    getChatThinkingBridgeState,
    getChatThinkingBridgeState
  );

  const scenarioReveal = useSyncExternalStore(
    subscribeChatScenarioReveal,
    getChatScenarioRevealState,
    getChatScenarioRevealState
  );

  /**
   * Engine visibleCount — progressive paint; default min until publish lands.
   * Cold / cleared bridge (active=false, count=0) → paint q0 only — never dump
   * the full thread (PO flash of r0 on chat open). Explicit idle full-thread
   * publish keeps visibleCount > 0 while inactive (overlay / browse).
   */
  const revealedFrameCount = resolveChatRevealedFrameCount(
    scenarioReveal.active
      ? scenarioReveal.visibleCount
      : scenarioReveal.visibleCount > 0
        ? scenarioReveal.visibleCount
        : 1,
    CHAT_THREAD_FRAMES.length,
    1
  );

  /**
   * FIX-2: Only pull-up-animate frames that newly become revealed one-at-a-time.
   * Batch reveals skip to final position. Thinking→reply release (count delta
   * 0) still animates via previous-id set — see resolveChatPullUpAnimateIds.
   */
  const prevRevealedIdsRef = useRef<Set<string>>(new Set());
  const pullUpAnimateIds = useMemo(
    () =>
      resolveChatPullUpAnimateIds(
        CHAT_THREAD_FRAMES.map((f) => f.id),
        revealedFrameCount,
        thinking,
        prevRevealedIdsRef.current,
        scenarioReveal.active
      ),
    [scenarioReveal.active, revealedFrameCount, thinking]
  );

  useEffect(() => {
    if (!scenarioReveal.active) {
      prevRevealedIdsRef.current = new Set();
      return;
    }
    const next = new Set<string>();
    CHAT_THREAD_FRAMES.forEach((frame, frameIndex) => {
      if (
        resolveChatFrameRevealed(
          frameIndex,
          revealedFrameCount,
          frame.id,
          thinking
        )
      ) {
        next.add(frame.id);
      }
    });
    prevRevealedIdsRef.current = next;
  }, [scenarioReveal.active, revealedFrameCount, thinking]);

  const shouldAnimateFrame = (
    frameId: string,
    frameRevealed: boolean
  ): boolean => frameRevealed && pullUpAnimateIds.has(frameId);

  /**
   * Scroll: snap on count/user reveals; on thinking→reply release defer to
   * post pull-up settle only (sitePilotChat — mid-handoff snap = 200–300px jank).
   */
  const prevThinkingModeRef = useRef(thinking.mode);
  useLayoutEffect(() => {
    const column = columnRef.current;
    if (!column || !scenarioReveal.active) return;
    const releasingThink =
      prevThinkingModeRef.current === "playback" && thinking.mode === "none";
    prevThinkingModeRef.current = thinking.mode;
    if (releasingThink) {
      console.info("[PLAYBACK_DIAG] chat-reveal-y-delta", {
        tag: "handoff-defer-snap",
        delta: 0,
        visibleCount: revealedFrameCount,
        scrollTop: column.scrollTop,
        scrollMax: Math.max(0, column.scrollHeight - column.clientHeight),
      });
      return;
    }
    const max = Math.max(0, column.scrollHeight - column.clientHeight);
    if (column.scrollTop < max) {
      const scrollBefore = column.scrollTop;
      // Camera SSoT — target last revealed frame / thinking (not raw max pin).
      scrollChatCamera(column, { instant: true, align: "end" });
      const delta = column.scrollTop - scrollBefore;
      if (delta !== 0) {
        console.info("[PLAYBACK_DIAG] chat-reveal-y-delta", {
          tag: "reveal-snap",
          delta,
          visibleCount: revealedFrameCount,
          scrollTop: column.scrollTop,
          scrollMax: max,
        });
      }
    }
  }, [
    scenarioReveal.active,
    revealedFrameCount,
    thinking.mode,
    thinking.generation,
  ]);

  useEffect(() => {
    const column = columnRef.current;
    if (!column || !scenarioReveal.active) return;
    const tSettle = window.setTimeout(() => {
      const settleMax = Math.max(0, column.scrollHeight - column.clientHeight);
      const before = column.scrollTop;
      scrollChatCamera(column, { instant: true, align: "end" });
      const delta = column.scrollTop - before;
      if (delta !== 0) {
        console.info("[PLAYBACK_DIAG] chat-reveal-y-delta", {
          tag: "pull-up-settle",
          delta,
          visibleCount: revealedFrameCount,
          scrollTop: column.scrollTop,
          scrollMax: settleMax,
        });
      }
    }, CHAT_PULL_UP_MS + 60);
    return () => window.clearTimeout(tSettle);
  }, [
    scenarioReveal.active,
    revealedFrameCount,
    thinking.mode,
    thinking.generation,
  ]);

  // Bridge owns send/playback thinking end (Play fade-out). Clear local stop latch.
  useEffect(() => {
    if (thinking.mode !== "send") setSendThinking(false);
  }, [thinking.mode]);

  // Console truth: one chat-reveal line per user|thinking|agent paint + DOM order.
  const loggedRevealIdsRef = useRef<Set<string>>(new Set());
  const loggedThinkGenRef = useRef(-1);
  useEffect(() => {
    if (!scenarioReveal.active) {
      loggedRevealIdsRef.current.clear();
      loggedThinkGenRef.current = -1;
      return;
    }

    if (
      thinking.mode === "playback" &&
      thinking.anchorFrameId &&
      loggedThinkGenRef.current !== thinking.generation
    ) {
      loggedThinkGenRef.current = thinking.generation;
      const idx = CHAT_THREAD_FRAMES.findIndex(
        (f) => f.id === thinking.anchorFrameId
      );
      logChatReveal({
        kind: "thinking",
        index: idx >= 0 ? idx : revealedFrameCount,
        visibleCount: revealedFrameCount,
        frameId: thinking.anchorFrameId,
      });
    }

    CHAT_THREAD_FRAMES.forEach((frame, frameIndex) => {
      const revealed = resolveChatFrameRevealed(
        frameIndex,
        revealedFrameCount,
        frame.id,
        thinking
      );
      if (!revealed || loggedRevealIdsRef.current.has(frame.id)) return;
      loggedRevealIdsRef.current.add(frame.id);
      logChatReveal({
        kind: frame.kind === "query" ? "user" : "agent",
        index: frameIndex,
        visibleCount: revealedFrameCount,
        frameId: frame.id,
      });
    });

    dumpChatThreadDomOrder(revealedFrameCount);
  }, [
    scenarioReveal.active,
    revealedFrameCount,
    thinking.mode,
    thinking.generation,
    thinking.anchorFrameId,
  ]);

  const chips = useMemo(
    () =>
      CHAT_CHIP_LABELS.map((label) => ({
        label,
        slug: chatChipSlug(label),
        actionId: chatChipActionId(label),
      })),
    []
  );

  useEffect(() => {
    const onScenarioDeckClick = (e: Event) => {
      if (!isSitePilotChatSendThinking() && thinking.mode !== "send") return;
      const t = e.target as Element | null;
      if (!t?.closest(".studio-nav-scenario")) return;
      endSitePilotChatThinking();
      // React SitePilotComposer owns stop/send glyph via sendThinking — no DOM glyph swap.
      setSendThinking(false);
    };
    document.addEventListener("click", onScenarioDeckClick, true);
    return () => document.removeEventListener("click", onScenarioDeckClick, true);
  }, [thinking.mode]);

  const handleSend = () => {
    // Stop glyph only clears residual send-thinking (legacy / abort).
    if (sendThinking || isSitePilotChatSendThinking()) {
      endSitePilotChatThinking();
      setSendThinking(false);
      return;
    }

    // PO / Make player: thinking bubble ONLY before agent reply — never on
    // Sarah send. Playback owns thinking via beforeReveal on reply frames.
    // Composer click during CJM type-in must not latch send-thinking.
    setSendThinking(false);
    onSend?.(query);
  };

  const handleChip = (label: string) => {
    if (/^show available slots for today$/i.test(label)) {
      onChip?.(label as ChatChipLabel);
      return;
    }
    setQuery(label);
    onChip?.(label as ChatChipLabel);
  };

  const threadNodes: ReactNode[] = [];
  CHAT_THREAD_FRAMES.forEach((frame, frameIndex) => {
    // Make: thinking bubble before agent reply — never paint reply while held.
    const revealed = resolveChatFrameRevealed(
      frameIndex,
      revealedFrameCount,
      frame.id,
      thinking
    );

    const animate = shouldAnimateFrame(frame.id, revealed);
    // Playback thinking lives IN the reply slot (same frame) — no sibling
    // unmount height collapse when thinking→reply handoff fires.
    const showThinking =
      frame.kind === "reply" &&
      isChatReplyHeldForPlaybackThinking(frame.id, thinking);

    if (frame.kind === "query") {
      threadNodes.push(
        <QueryFrame
          key={frame.id}
          frame={frame}
          revealed={revealed}
          shouldAnimate={animate}
          visibleCount={revealedFrameCount}
        />
      );
    } else {
      threadNodes.push(
        <ReplyFrame
          key={frame.id}
          frame={frame}
          revealed={revealed}
          showThinking={showThinking}
          shouldAnimate={animate}
          thinkingGeneration={thinking.generation}
          onAgentCta={onAgentCta}
          onProductLink={onProductLink}
          visibleCount={revealedFrameCount}
        />
      );
    }

    // Hint = idle "awaiting agent" after first user bubble only (not on send).
    // Suppressed while scenario progressive reveal is driving (CJM owns steps).
    if (
      !scenarioReveal.active &&
      thinking.mode === "hint" &&
      (thinking.anchorFrameId === frame.id ||
        (!thinking.anchorFrameId && frame.id === "q0"))
    ) {
      threadNodes.push(
        <ChatThinkingBubble
          key={`think-${thinking.generation}`}
          mode="hint"
          generation={thinking.generation}
        />
      );
    }
  });

  // Never paint send-thinking during progressive CJM — user send ≠ thinking.
  // (Legacy wire may still latch send mode; ignore while scenario is active.)
  if (thinking.mode === "send" && !scenarioReveal.active) {
    threadNodes.push(
      <ChatThinkingBubble
        key={`think-${thinking.generation}`}
        mode="send"
        generation={thinking.generation}
      />
    );
  }

  return (
    <main
      className="chat"
      data-studio-react-screen={CHAT_REACT_SCREEN_ID}
      data-name="body"
      aria-label="Agentic Site Pilot chat"
    >
      <ChatSitePilotBar />
      <div className="chat__column" ref={columnRef}>
        <div
          className="chat__summary"
          data-name="component.appointment.summary"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>{threadNodes}</AnimatePresence>
          <HelpfulStrip conversation />
        </div>
      </div>

      <footer
        ref={dockRef}
        className="chat__composer-dock"
        aria-label="Message composer"
        hidden={composerSuppressed}
      >
        <div
          className="chat__composer-card proto-site-pilot-composer"
          data-name="component.co.order.summary"
          data-studio-chat-composer="true"
        >
          <SitePilotComposer
            surface="chat"
            query={query}
            onQueryChange={setQuery}
            onSend={handleSend}
            showSuggested
            suggestedLabel={CHAT_SUGGESTED_LABEL}
            suggestedLabelId={CHAT_SUGGESTED_LABEL_ID}
            chips={chips}
            onChip={handleChip}
            sendThinking={
              !scenarioReveal.active &&
              (sendThinking || thinking.mode === "send")
            }
          />
        </div>
        <p className="chat__disclaimer">
          SitePilot can make mistakes.{" "}
          <span className="uxds-link chat__disclaimer-link">
            Contact our support team
          </span>{" "}
          if you need further advice or fact-checking.
        </p>
      </footer>
    </main>
  );
}
