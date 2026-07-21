/**
 * Site Pilot (Agentic Home) MCP probe recipe — kept out of studioMcpPageProbe.ts (hygiene).
 * screenId: site-pilot · Make child 11 · React screens/home/*
 */

import { isMakeParkedForScreen } from "../retireMakeUnderPage";

export type SitePilotMcpProbeStep = {
  id: string;
  selector: string;
  action?: "click" | "assert" | "refuse-click" | "reveal" | "hover";
  assert?: () => boolean | string;
  settleMs?: number;
  waitMs?: number;
  softSkipIfMissing?: boolean;
  softSkipDetail?: string;
};

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

function normalizeText(el: Element | null | undefined): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function parseScreenId(): string | null {
  try {
    return new URL(window.location.href).searchParams.get("screen");
  } catch {
    return null;
  }
}

/** Restore site-pilot after send/chip navigates to chat (url-screen must end on site-pilot). */
function restoreSitePilotViaUrl(): boolean | string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("project", "boots-pharmacy");
    url.searchParams.set("screen", "site-pilot");
    url.searchParams.delete("modal");
    window.history.replaceState(window.history.state, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch (err) {
    return `restore site-pilot URL failed: ${String(err)}`;
  }
  return true;
}

const HOST = 'main.home[data-studio-react-screen="site-pilot"], main.site-pilot[data-studio-react-screen="site-pilot"]';
const HOST_FALLBACK = '[data-studio-react-screen="site-pilot"]';

function hostEl(): Element | null {
  return (
    document.querySelector(HOST) ?? document.querySelector(HOST_FALLBACK)
  );
}

export function sitePilotMcpProbeSteps(): SitePilotMcpProbeStep[] {
  return [
    {
      id: "site-pilot-host",
      selector: HOST_FALLBACK,
      action: "assert",
      assert: () =>
        hostEl() != null ||
        'missing React Site Pilot host — expected [data-studio-react-screen="site-pilot"]',
    },
    {
      id: "site-pilot-make-retired",
      selector: HOST_FALLBACK,
      action: "assert",
      assert: () => {
        if (!isMakeParkedForScreen("site-pilot")) {
          return "Make leak: expected Make Frame children parked for site-pilot";
        }
        const liveBodies = Array.from(
          document.querySelectorAll('[data-name="body"]')
        ).filter((el) => !el.closest("[data-studio-make-retired]"));
        // React main.home has data-name=body; Make body must be retired.
        if (liveBodies.length < 1) {
          return "expected live React body (data-name=body)";
        }
        return true;
      },
    },
    {
      id: "site-pilot-landmarks",
      selector: HOST_FALLBACK,
      action: "assert",
      assert: () => {
        const host = hostEl();
        if (!host || host.tagName.toLowerCase() !== "main") {
          return "expected <main> landmark root";
        }
        if (!host.querySelector("[data-studio-agentic-home-heading]")) {
          return "missing hero heading [data-studio-agentic-home-heading]";
        }
        if (!host.querySelector('[data-name="boots.ai assistant 3"]')) {
          return "missing Site Pilot logo (boots.ai assistant 3)";
        }
        if (
          !host.querySelector(
            '.home__card[data-name="component.co.order.summary"], .site-pilot__card[data-name="component.co.order.summary"]'
          )
        ) {
          return "missing query card (component.co.order.summary)";
        }
        // Make Home has no crumbs/footer — invent would FAIL
        if (host.querySelector("footer") || host.querySelector(".home__footer")) {
          return "invented footer on Site Pilot (Make has none)";
        }
        return true;
      },
    },
    {
      id: "site-pilot-heading-logged-out",
      selector: `${HOST_FALLBACK} [data-studio-agentic-home-heading]`,
      action: "assert",
      assert: () => {
        window.__studioSetLoggedIn?.(false);
        const h = document.querySelector(
          `${HOST_FALLBACK} [data-studio-agentic-home-heading]`
        );
        const text = normalizeText(h);
        if (text !== "What health services are you focusing on today?") {
          return `logged-out heading mismatch: "${text}"`;
        }
        return true;
      },
      settleMs: 200,
    },
    {
      id: "site-pilot-heading-logged-in",
      selector: `${HOST_FALLBACK} [data-studio-agentic-home-heading]`,
      action: "assert",
      waitMs: 800,
      settleMs: 200,
      assert: () => {
        window.__studioSetLoggedIn?.(true);
        const h = document.querySelector(
          `${HOST_FALLBACK} [data-studio-agentic-home-heading]`
        );
        const text = normalizeText(h);
        // React may need remount/prop tick — allow brief mismatch then re-read
        if (text !== "Sarah, what health services are you focusing on today?") {
          return `logged-in heading mismatch: "${text}" (auth SSoT isStudioLoggedIn)`;
        }
        window.__studioSetLoggedIn?.(false);
        return true;
      },
    },
    {
      id: "site-pilot-query",
      selector: `${HOST_FALLBACK} textarea[data-studio-action="agentic-home-query"]`,
      action: "assert",
      assert: () => {
        const ta = document.querySelector<HTMLTextAreaElement>(
          `${HOST_FALLBACK} textarea[data-studio-action="agentic-home-query"]`
        );
        if (!ta) return "missing textarea agentic-home-query";
        if (!ta.classList.contains("site-pilot-composer__query")) {
          return "textarea missing site-pilot-composer__query";
        }
        ta.focus();
        if (document.activeElement !== ta) {
          return "textarea did not take focus";
        }
        return true;
      },
    },
    {
      id: "site-pilot-ds-hover-send",
      selector: `${HOST_FALLBACK} button.site-pilot-composer__send`,
      action: "hover",
      assert: () => {
        if (!stylesheetHasRule(".site-pilot-composer__send:hover")) {
          return "missing .site-pilot-composer__send:hover CSS (Make #01318f)";
        }
        if (!stylesheetHasRule(".site-pilot-composer__send:active")) {
          return "missing .site-pilot-composer__send:active CSS";
        }
        return true;
      },
    },
    {
      id: "site-pilot-ds-hover-mic",
      selector: `${HOST_FALLBACK} button.site-pilot-composer__mic`,
      action: "hover",
      assert: () => {
        if (!stylesheetHasRule(".site-pilot-composer__mic:hover")) {
          return "missing .site-pilot-composer__mic:hover CSS";
        }
        return true;
      },
    },
    {
      id: "site-pilot-ds-hover-chip",
      selector: `${HOST_FALLBACK} button.site-pilot-composer__chip`,
      action: "hover",
      assert: () => {
        if (!stylesheetHasRule(".site-pilot-composer__chip:hover")) {
          return "missing .site-pilot-composer__chip:hover CSS";
        }
        return true;
      },
    },
    {
      id: "site-pilot-send-to-chat",
      selector: `${HOST_FALLBACK} button.site-pilot-composer__send`,
      action: "click",
      settleMs: 700,
      waitMs: 4000,
      assert: () => {
        const screen = parseScreenId();
        if (screen !== "chat") {
          return `expected screen=chat after send, got ${screen ?? "?"}`;
        }
        return true;
      },
    },
    {
      id: "site-pilot-return-after-send",
      selector: "body",
      action: "assert",
      settleMs: 900,
      waitMs: 5000,
      assert: () => {
        const restored = restoreSitePilotViaUrl();
        if (restored !== true) return restored;
        if (hostEl() == null) {
          return "React Site Pilot host missing after restore from chat";
        }
        if (parseScreenId() !== "site-pilot") {
          return `expected screen=site-pilot after restore, got ${parseScreenId() ?? "?"}`;
        }
        return true;
      },
    },
    {
      id: "site-pilot-chip-to-chat",
      selector: `${HOST_FALLBACK} button.site-pilot-composer__chip`,
      action: "click",
      settleMs: 700,
      waitMs: 4000,
      assert: () => {
        const screen = parseScreenId();
        if (screen !== "chat") {
          return `expected screen=chat after chip, got ${screen ?? "?"}`;
        }
        return true;
      },
    },
    {
      id: "site-pilot-return-after-chip",
      selector: "body",
      action: "assert",
      settleMs: 900,
      waitMs: 5000,
      assert: () => {
        const restored = restoreSitePilotViaUrl();
        if (restored !== true) return restored;
        if (hostEl() == null) {
          return "React Site Pilot host missing after chip restore";
        }
        return true;
      },
    },
  ];
}
