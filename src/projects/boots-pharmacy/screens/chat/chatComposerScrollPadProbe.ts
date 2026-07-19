/**
 * Quinn probe assert — sticky composer scroll pad on React Chat.
 * Kept out of studioMcpPageProbe.ts (hygiene ceiling).
 */

export function assertChatComposerScrollPad(hostSel: string): true | string {
  const col = document.querySelector<HTMLElement>(`${hostSel} .chat__column`);
  const dock = document.querySelector<HTMLElement>(
    `${hostSel} .chat__composer-dock`
  );
  if (!col) return "missing .chat__column";
  if (!dock || dock.hidden) return "missing visible .chat__composer-dock";

  const padVar = col.style.getPropertyValue("--studio-chat-composer-h");
  const padPx = parseFloat(padVar || "0");
  if (!(padPx >= 120)) {
    return `--studio-chat-composer-h too small (${padVar || "empty"})`;
  }

  const scrollPad = parseFloat(getComputedStyle(col).scrollPaddingBottom);
  if (!(scrollPad >= 120)) {
    return `scroll-padding-bottom too small (${scrollPad})`;
  }

  const proto = document.querySelector<HTMLElement>(
    ".studio-scroll--prototype:not(.hidden)"
  );
  if (proto) {
    const protoMax = proto.scrollHeight - proto.clientHeight;
    if (protoMax > 2) {
      return `dual scrollbar — prototype still scrolls (max=${protoMax})`;
    }
  }

  col.scrollTop = col.scrollHeight;
  const ctas = col.querySelectorAll<HTMLElement>(
    ".chat__cta.uxds-btn-primary--commerce"
  );
  const lastCta = ctas[ctas.length - 1];
  if (!lastCta) return "missing reply CTA for pad prove";

  const ctaBottom = lastCta.getBoundingClientRect().bottom;
  const dockTop = dock.getBoundingClientRect().top;
  if (ctaBottom > dockTop + 1) {
    return `last CTA still under composer (ctaBottom=${ctaBottom.toFixed(1)} dockTop=${dockTop.toFixed(1)})`;
  }
  return true;
}
