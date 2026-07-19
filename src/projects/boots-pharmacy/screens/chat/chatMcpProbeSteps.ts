/**
 * Chat (Agentic) MCP probe recipe — kept out of studioMcpPageProbe.ts (hygiene).
 * Expanded recipe may PASS host/composer rows; does **not** stamp Chat PAGE FINAL PASS.
 */

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
      id: "chat-make-retired",
      selector: hostSel,
      action: "assert",
      assert: () => {
        if (
          document.querySelector('[data-studio-make-retired="chat"]') == null
        ) {
          return "Make leak: expected data-studio-make-retired=chat on retired children";
        }
        const liveSummaries = Array.from(
          document.querySelectorAll(
            `${hostSel} [data-name="component.appointment.summary"]`
          )
        ).filter((el) => !el.closest("[data-studio-make-retired]"));
        if (liveSummaries.length !== 1) {
          return `expected exactly 1 live chat summary (got ${liveSummaries.length})`;
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
        if (ta.closest("[data-studio-make-retired]")) {
          return "chat textarea under make-retired";
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
