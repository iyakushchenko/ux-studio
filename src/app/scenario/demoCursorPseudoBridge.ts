/**
 * Synthetic pointer events do not flip CSS `:hover` / `:active`.
 * Bridge those selectors onto demo classes used by the robo-cursor path:
 *   :hover  → .proto-chat-cta--hover
 *   :active → .proto-chat-cta--pressed
 *
 * Installed once (idempotent). Skips negative :not(:hover/:active) compounds.
 */

export const DEMO_HOVER_CLASS = "proto-chat-cta--hover";
export const DEMO_PRESSED_CLASS = "proto-chat-cta--pressed";

const BRIDGE_STYLE_ID = "studio-demo-pseudo-bridge";

/** Pure selector transform — exported for unit tests. */
export function bridgeDemoPseudoSelector(selectorText: string): string | null {
  const extras: string[] = [];
  for (const part of selectorText.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (
      /:hover\b/.test(part) &&
      !part.includes(DEMO_HOVER_CLASS) &&
      !/:not\(\s*:hover\b/.test(part)
    ) {
      extras.push(part.replace(/:hover\b/g, `.${DEMO_HOVER_CLASS}`));
    }
    if (
      /:active\b/.test(part) &&
      !part.includes(DEMO_PRESSED_CLASS) &&
      !/:not\(\s*:active\b/.test(part)
    ) {
      extras.push(part.replace(/:active\b/g, `.${DEMO_PRESSED_CLASS}`));
    }
  }
  if (extras.length === 0) return null;
  return extras.join(", ");
}

function collectBridgedCssText(ruleList: CSSRuleList, out: string[]): void {
  for (let i = 0; i < ruleList.length; i++) {
    const rule = ruleList[i];
    if (rule instanceof CSSStyleRule) {
      const bridged = bridgeDemoPseudoSelector(rule.selectorText);
      if (bridged) {
        out.push(`${bridged}{${rule.style.cssText}}`);
      }
      continue;
    }
    if (rule instanceof CSSMediaRule) {
      const nested: string[] = [];
      collectBridgedCssText(rule.cssRules, nested);
      if (nested.length > 0) {
        out.push(`@media ${rule.conditionText}{${nested.join("")}}`);
      }
      continue;
    }
    if (rule instanceof CSSSupportsRule) {
      const nested: string[] = [];
      collectBridgedCssText(rule.cssRules, nested);
      if (nested.length > 0) {
        out.push(`@supports ${rule.conditionText}{${nested.join("")}}`);
      }
    }
  }
}

/** Build + inject the bridge stylesheet. Safe to call repeatedly. */
export function ensureDemoPseudoBridge(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(BRIDGE_STYLE_ID)) return;

  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if ((sheet.ownerNode as HTMLElement | null)?.id === BRIDGE_STYLE_ID) continue;
    try {
      collectBridgedCssText(sheet.cssRules, chunks);
    } catch {
      // Cross-origin / unreadable sheets — skip.
    }
  }

  const style = document.createElement("style");
  style.id = BRIDGE_STYLE_ID;
  style.setAttribute("data-studio", "demo-pseudo-bridge");
  style.textContent = chunks.join("\n");
  document.head.appendChild(style);
}

/** Test / teardown helper. */
export function removeDemoPseudoBridge(): void {
  document.getElementById(BRIDGE_STYLE_ID)?.remove();
}
