/**
 * Chat (Agentic) MCP probe recipe — kept out of studioMcpPageProbe.ts (hygiene).
 * Expanded Final Pass matrix (layout / helpful / footer / CTA sweep).
 */

import { isLegacyRetiredForScreen } from "../retireLegacyUnderPage";
import { assertChatComposerScrollPad } from "./chatComposerScrollPadProbe";

export type ChatMcpProbeStep = {
  id: string;
  selector: string;
  action?: "click" | "assert" | "refuse-click" | "reveal" | "hover";
  assert?: () => boolean | string;
  settleMs?: number;
  waitMs?: number;
  softSkipIfMissing?: boolean;
  softSkipDetail?: string;
};

function normalizeText(el: Element | null | undefined): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function stylesheetHasRule(selectorFrag: string): boolean {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      const selectorText = (rule as CSSStyleRule).selectorText;
      if (typeof selectorText === "string" && selectorText.includes(selectorFrag)) {
        return true;
      }
    }
  }
  return false;
}

/** Chat probe steps — React host + composer pad + DS hover (no Final Pass stamp). */
export function chatMcpProbeSteps(): ChatMcpProbeStep[] {
  const hostSel = 'main.chat[data-studio-react-screen="chat"]';
  return [
    {
      id: "chat-host",
      selector: hostSel,
      action: "assert",
      assert: () =>
        document.querySelector(hostSel) != null ||
        'missing React Chat host — expected main.chat[data-studio-react-screen="chat"]',
    },
    {
      id: "chat-legacy-retired",
      selector: hostSel,
      action: "assert",
      assert: () => {
        if (!isLegacyRetiredForScreen("chat")) {
          return "Legacy leak: expected Legacy Frame children parked for chat";
        }
        const liveSummaries = Array.from(
          document.querySelectorAll(
            `${hostSel} [data-name="component.appointment.summary"]`
          )
        ).filter((el) => !el.closest("[data-studio-legacy-retired]"));
        if (liveSummaries.length !== 1) {
          return `expected exactly 1 live chat summary (got ${liveSummaries.length})`;
        }
        return true;
      },
    },
    {
      id: "chat-site-pilot-bar",
      selector: `${hostSel} [data-studio-chat-site-pilot-bar="true"]`,
      action: "assert",
      assert: () => {
        const bar = document.querySelector(
          `${hostSel} [data-studio-chat-site-pilot-bar="true"]`
        );
        if (!bar) return "missing Site Pilot bar (Legacy Frame337)";
        if (!bar.querySelector('[data-name="boots.ai assistant 3"]')) {
          return "Site Pilot bar missing compact logo (boots.ai assistant 3)";
        }
        const text = normalizeText(bar);
        if (!/Contact Support/i.test(text)) {
          return "Site Pilot bar missing Contact Support";
        }
        if (!/Rate your experience/i.test(text)) {
          return "Site Pilot bar missing Rate your experience";
        }
        return true;
      },
    },
    {
      id: "chat-landmarks",
      selector: `${hostSel} .chat__summary`,
      action: "assert",
      assert: () => {
        const summary = document.querySelector(
          `${hostSel} .chat__summary[data-name="component.appointment.summary"]`
        );
        if (!summary) return "missing .chat__summary appointment region";
        const queries = document.querySelectorAll(
          `${hostSel} [data-name="query"]`
        );
        const replies = document.querySelectorAll(
          `${hostSel} [data-name="reply"]`
        );
        if (queries.length < 1) return "expected ≥1 query frame";
        if (replies.length < 1) return "expected ≥1 reply frame";
        const bubbleLink = document.querySelector(
          `${hostSel} .chat__bubble .uxds-link.chat__link`
        );
        if (!bubbleLink) {
          return "missing bubble UXDS link (.uxds-link.chat__link)";
        }
        const linkCs = getComputedStyle(bubbleLink);
        if (linkCs.textDecorationLine === "underline") {
          return "bubble link rest must not underline (uxds-link contract)";
        }
        return true;
      },
    },
    {
      id: "chat-composer-dock",
      selector: `${hostSel} [data-studio-chat-composer="true"]`,
      action: "assert",
      assert: () => {
        const card = document.querySelector(
          `${hostSel} [data-studio-chat-composer="true"]`
        );
        if (!card) return "missing [data-studio-chat-composer=true]";
        if (!card.classList.contains("proto-site-pilot-composer")) {
          return "composer card missing proto-site-pilot-composer (shared kit identity)";
        }
        const dock = card.closest(".chat__composer-dock");
        if (!dock) return "composer not inside .chat__composer-dock";
        return true;
      },
    },
    {
      id: "chat-composer-textarea",
      selector: `${hostSel} textarea[data-studio-action="agentic-chat-query"]`,
      action: "assert",
      assert: () => {
        const ta = document.querySelector<HTMLTextAreaElement>(
          `${hostSel} textarea[data-studio-action="agentic-chat-query"]`
        );
        if (!ta) return "missing chat query textarea";
        if (ta.closest("[data-studio-legacy-retired]")) {
          return "chat textarea under legacy-retired";
        }
        if (!ta.classList.contains("site-pilot-composer__query")) {
          return "textarea missing shared site-pilot-composer__query class";
        }
        const ph = (ta.getAttribute("placeholder") ?? "").trim();
        if (ph !== "Ask Boots SitePilot") {
          return `expected Chat placeholder "Ask Boots SitePilot" (got "${ph}")`;
        }
        return true;
      },
    },
    {
      id: "chat-composer-send",
      selector: `${hostSel} button[data-studio-action="agentic-chat-send"]`,
      action: "assert",
      assert: () => {
        const send = document.querySelector(
          `${hostSel} button[data-studio-action="agentic-chat-send"]`
        );
        if (!send) return "missing agentic-chat-send";
        if (
          !send.classList.contains("site-pilot-composer__send") ||
          !send.classList.contains("proto-agentic-send")
        ) {
          return "send missing shared dual-class (site-pilot-composer__send + proto-agentic-send)";
        }
        if (!stylesheetHasRule(".site-pilot-composer__send:hover")) {
          return "missing shared composer send :hover CSS";
        }
        return true;
      },
    },
    {
      id: "chat-composer-mic-hover",
      selector: `${hostSel} button[data-studio-action="agentic-chat-mic"]`,
      action: "hover",
      settleMs: 420,
      assert: () => {
        if (!stylesheetHasRule(".site-pilot-composer__mic:hover")) {
          return "missing shared composer mic :hover CSS (Home↔Chat identity)";
        }
        return true;
      },
    },
    {
      id: "chat-chip-hover",
      selector: `${hostSel} .site-pilot-composer__chip`,
      action: "hover",
      settleMs: 420,
      assert: () => {
        if (!stylesheetHasRule(".site-pilot-composer__chip:hover")) {
          return "missing composer chip :hover CSS";
        }
        const label = document.querySelector(
          `${hostSel} .site-pilot-composer__suggested-label`
        );
        const text = normalizeText(label);
        if (text !== "Next dialog options:") {
          return `Chat chip label must be "Next dialog options:" (got "${text}") — not Home "Suggested…"`;
        }
        return true;
      },
    },
    {
      id: "chat-cta-hover",
      selector: `${hostSel} .chat__cta.uxds-btn-primary--commerce`,
      action: "hover",
      settleMs: 420,
      assert: () => {
        if (
          !document.querySelector(
            `${hostSel} .chat__cta.uxds-btn-primary--commerce`
          )
        ) {
          return "missing UXDS commerce reply CTA";
        }
        if (
          !stylesheetHasRule(".uxds-btn-primary--commerce:hover:not(:disabled)")
        ) {
          return "missing UXDS ButtonPrimary commerce :hover CSS";
        }
        return true;
      },
    },
    {
      // Conversation strip stays `hidden` (Legacy end-of-thread residual) — hover reply strip.
      id: "chat-helpful-hover",
      selector: `${hostSel} [data-studio-chat-helpful="reply"] .chat__helpful-choice`,
      action: "hover",
      settleMs: 420,
      assert: () => {
        if (
          !document.querySelector(
            `${hostSel} [data-studio-chat-helpful="reply"] .chat__helpful-choice`
          )
        ) {
          return "missing per-reply feedback Yes/No";
        }
        if (!stylesheetHasRule(".chat__helpful-choice:hover")) {
          return "missing .chat__helpful-choice:hover CSS";
        }
        const replyPrompt = normalizeText(
          document.querySelector(
            `${hostSel} [data-studio-chat-helpful="reply"] .chat__helpful-prompt`
          )
        );
        if (!/Was this reply helpful\?/i.test(replyPrompt)) {
          return `per-reply helpful prompt mismatch (got "${replyPrompt}")`;
        }
        const conv = document.querySelector(
          `${hostSel} [data-studio-chat-helpful="conversation"]`
        );
        if (!conv) return "missing conversation helpful strip (Legacy residual; may stay hidden)";
        const convPrompt = normalizeText(
          conv.querySelector(".chat__helpful-prompt")
        );
        if (!/Was this conversation helpful so far\?/i.test(convPrompt)) {
          return `conversation helpful prompt mismatch (got "${convPrompt}")`;
        }
        return true;
      },
    },
    {
      id: "chat-layout-rhythm",
      selector: `${hostSel} .chat__summary`,
      action: "assert",
      assert: () => {
        const summary = document.querySelector(
          `${hostSel} .chat__summary`
        ) as HTMLElement | null;
        const column = document.querySelector(
          `${hostSel} .chat__column`
        ) as HTMLElement | null;
        const queryBubble = document.querySelector(
          `${hostSel} [data-name="query"] .chat__bubble`
        ) as HTMLElement | null;
        if (!summary || !column || !queryBubble) {
          return "layout rhythm: missing summary/column/query bubble";
        }
        const sCs = getComputedStyle(summary);
        const cCs = getComputedStyle(column);
        const qCs = getComputedStyle(queryBubble);
        const gap = sCs.rowGap || sCs.gap;
        if (gap !== "40px") return `summary gap must be 40px (got ${gap})`;
        if (sCs.maxWidth !== "864px") {
          return `summary max-width must be 864px (got ${sCs.maxWidth})`;
        }
        if (cCs.paddingTop !== "64px") {
          return `column padding-top must be 64px (got ${cCs.paddingTop})`;
        }
        const qW = Math.round(queryBubble.getBoundingClientRect().width);
        if (qW !== 438 && qCs.width !== "438px") {
          return `query bubble width must be 438px (got ${qW} / ${qCs.width})`;
        }
        if (qCs.borderRadius !== "16px") {
          return `query radius must be 16px (got ${qCs.borderRadius})`;
        }
        const host = document.querySelector(hostSel) as HTMLElement | null;
        const bg = host ? getComputedStyle(host).backgroundColor : "";
        if (bg !== "rgb(219, 235, 245)") {
          return `chat host bg must be #dbebf5 (got ${bg})`;
        }
        return true;
      },
    },
    {
      id: "chat-disclaimer",
      selector: `${hostSel} .chat__disclaimer`,
      action: "assert",
      assert: () => {
        const disc = document.querySelector(`${hostSel} .chat__disclaimer`);
        if (!disc) return "missing .chat__disclaimer";
        const text = normalizeText(disc);
        if (!/SitePilot can make mistakes/i.test(text)) {
          return `disclaimer copy mismatch (got "${text.slice(0, 80)}")`;
        }
        const link = disc.querySelector(".uxds-link.chat__disclaimer-link");
        if (!link) return "disclaimer missing uxds-link support CTA";
        return true;
      },
    },
    {
      id: "chat-footer-hidden",
      selector: hostSel,
      action: "assert",
      assert: () => {
        const mount = document.querySelector(".proto-footer-mount");
        if (!mount) return true;
        const h = Math.round(mount.getBoundingClientRect().height);
        if (h > 1) {
          return `chat must hide footer mount (height ${h}px — Legacy child-10 hide rule)`;
        }
        return true;
      },
    },
    {
      id: "chat-cta-frame-sweep",
      selector: hostSel,
      action: "assert",
      assert: () => {
        const replyFrames = Array.from(
          document.querySelectorAll(
            `${hostSel} [data-studio-chat-frame^="r"]`
          )
        );
        if (replyFrames.length < 2) {
          return `expected ≥2 reply frames for CTA sweep (got ${replyFrames.length}) — prove with cjm=off`;
        }
        let withCta = 0;
        for (const frame of replyFrames) {
          const ctas = frame.querySelectorAll(
            ".chat__cta.uxds-btn-primary--commerce"
          );
          if (ctas.length > 0) withCta += 1;
        }
        if (withCta < 2) {
          return `CTA frame sweep: expected ≥2 reply frames with commerce CTAs (got ${withCta})`;
        }
        return true;
      },
    },
    {
      // r1 CTA below-fold at scrollTop=0 — proves `.chat__column` scroll host.
      id: "chat-below-fold-reveal",
      selector: `${hostSel} [data-studio-chat-frame="r1"] .chat__cta.uxds-btn-primary--commerce`,
      action: "reveal",
    },
    {
      // Overlay composer + scroll pad — last CTA clears above dock at max scroll.
      id: "chat-composer-scroll-pad",
      selector: `${hostSel} .chat__column`,
      action: "assert",
      assert: () => assertChatComposerScrollPad(hostSel),
    },
    {
      id: "chat-motion-owner",
      selector: hostSel,
      action: "assert",
      assert: () => {
        const frames = document.querySelectorAll(
          `${hostSel} [data-studio-chat-frame]`
        );
        if (frames.length < 2) {
          return `expected ≥2 Motion chat frames (got ${frames.length})`;
        }
        return true;
      },
    },
  ];
}
