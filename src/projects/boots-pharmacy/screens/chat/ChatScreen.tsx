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
import { AnimatePresence, motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";
import {
  beginSitePilotChatThinking,
  endSitePilotChatThinking,
  isSitePilotChatSendThinking,
  setSitePilotChatSendThinkingMode,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import { SitePilotComposer } from "../shared/SitePilotComposer";
import { CHAT_REACT_SCREEN_ID } from "./chatContract";
import {
  getChatThinkingBridgeState,
  subscribeChatThinkingBridge,
} from "./chatThinkingBridge";
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

/** Apply BEM once — do not set React `className` (scenario engine owns `proto-scenario-frame*`). */
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

function AgentCta({
  label,
  tone = "navy",
  onClick,
}: {
  label: string;
  tone?: "navy" | "bright";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`chat__cta${tone === "bright" ? " chat__cta--bright" : ""}`}
      data-name="component.input.button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const QUERY_FRAME_CLASSES = ["chat__frame", "chat__frame--query"];

function QueryFrame({ frame }: { frame: Extract<ChatThreadFrame, { kind: "query" }> }) {
  const ref = useStaticFrameClasses(QUERY_FRAME_CLASSES);
  return (
    <motion.div
      ref={ref}
      data-name="query"
      data-studio-chat-frame={frame.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: MOTION_EASE_IN_OUT }}
    >
      <div
        className="chat__bubble chat__bubble--user"
        data-name="component.co.order.summary"
      >
        <div data-name="Subtotal">
          <p>{frame.text}</p>
        </div>
      </div>
    </motion.div>
  );
}

const REPLY_FRAME_CLASSES = ["chat__frame", "chat__frame--reply"];

function ReplyFrame({
  frame,
  onAgentCta,
  onProductLink,
}: {
  frame: Extract<ChatThreadFrame, { kind: "reply" }>;
  onAgentCta?: (label: string) => void;
  onProductLink?: (label: string) => void;
}) {
  const ref = useStaticFrameClasses(REPLY_FRAME_CLASSES);
  const onBodyClick = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    const link = t?.closest?.(".chat__link");
    if (!link) return;
    const label = (link.textContent ?? "").replace(/\s+/g, " ").trim();
    if (label) onProductLink?.(label);
  };

  return (
    <motion.div
      ref={ref}
      data-name="reply"
      data-studio-chat-frame={frame.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: MOTION_EASE_IN_OUT }}
    >
      <div
        className="chat__bubble chat__bubble--agent"
        data-name="component.co.order.summary"
      >
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
                tone={cta.tone}
                onClick={() => onAgentCta?.(cta.label)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {frame.helpful ? <HelpfulStrip /> : null}
    </motion.div>
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

export function ChatScreen({
  onSend,
  onChip,
  onAgentCta,
  onProductLink,
}: ChatScreenProps) {
  const [query, setQuery] = useState("");
  const [sendThinking, setSendThinking] = useState(false);
  const composerSuppressed = useComposerSuppressed();
  const thinking = useSyncExternalStore(
    subscribeChatThinkingBridge,
    getChatThinkingBridgeState,
    getChatThinkingBridgeState
  );

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
      setSendThinking(false);
      const sendBtn = document.querySelector<HTMLElement>(
        '[data-studio-react-screen="chat"] .proto-agentic-send, [data-studio-react-screen="chat"] .site-pilot-composer__send'
      );
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
    };
    document.addEventListener("click", onScenarioDeckClick, true);
    return () => document.removeEventListener("click", onScenarioDeckClick, true);
  }, [thinking.mode]);

  const handleSend = () => {
    if (sendThinking || isSitePilotChatSendThinking()) {
      endSitePilotChatThinking();
      setSendThinking(false);
      const sendBtn = document.querySelector<HTMLElement>(
        '[data-studio-react-screen="chat"] .proto-agentic-send'
      );
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
      return;
    }

    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(10)"
    );
    if (screen) beginSitePilotChatThinking(screen);
    setSendThinking(true);
    const sendBtn = document.querySelector<HTMLElement>(
      '[data-studio-react-screen="chat"] .proto-agentic-send'
    );
    if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, true);
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
  for (const frame of CHAT_THREAD_FRAMES) {
    if (
      thinking.mode === "playback" &&
      thinking.anchorFrameId === frame.id
    ) {
      threadNodes.push(
        <ChatThinkingBubble
          key={`think-${thinking.generation}`}
          mode="playback"
          generation={thinking.generation}
        />
      );
    }

    if (frame.kind === "query") {
      threadNodes.push(<QueryFrame key={frame.id} frame={frame} />);
    } else {
      threadNodes.push(
        <ReplyFrame
          key={frame.id}
          frame={frame}
          onAgentCta={onAgentCta}
          onProductLink={onProductLink}
        />
      );
    }

    if (
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
  }

  if (thinking.mode === "send") {
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
      <div className="chat__column">
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
            sendThinking={sendThinking || thinking.mode === "send"}
          />
        </div>
        <p className="chat__disclaimer">
          SitePilot can make mistakes.{" "}
          <span className="chat__disclaimer-link">Contact our support team</span>{" "}
          if you need further advice or fact-checking.
        </p>
      </footer>
    </main>
  );
}
