import { createRoot, type Root } from "react-dom/client";
import Footer, {
  type FooterNavHandlers,
  type FooterProps,
} from "@/projects/boots-pharmacy/chrome/Footer";
import {
  FOOTER_BY_CHILD,
  FOOTER_CHILD_INDICES,
  FOOTER_HIDE_SELECTORS,
  SITE_PILOT_CHILD_INDICES,
} from "@/projects/boots-pharmacy/chrome/footerConfig";

const FOOTER_MOUNT_CLASS = "proto-footer-mount";
const roots = new WeakMap<HTMLElement, Root>();

function mountProtoFooterOnPage(
  page: HTMLElement,
  props: FooterProps,
  hideSelectors: readonly string[],
): void {
  for (const selector of hideSelectors) {
    page.querySelectorAll<HTMLElement>(selector).forEach((footer) => {
      if (footer.classList.contains(FOOTER_MOUNT_CLASS)) return;
      footer.style.display = "none";
      footer.dataset.studioFooterHidden = "true";
    });
  }

  let host = page.querySelector<HTMLElement>(`:scope > .${FOOTER_MOUNT_CLASS}`);
  if (!host) {
    host = document.createElement("div");
    host.className = FOOTER_MOUNT_CLASS;
    page.appendChild(host);
  }

  let root = roots.get(host);
  if (!root) {
    root = createRoot(host);
    roots.set(host, root);
  }
  root.render(<Footer {...props} />);
}

function stripProtoFooterFromPage(page: HTMLElement): void {
  page.querySelectorAll<HTMLElement>(`:scope > .${FOOTER_MOUNT_CLASS}`).forEach((host) => {
    const root = roots.get(host);
    root?.unmount();
    roots.delete(host);
    host.remove();
  });
}

/** Mount Footer on every prototype screen that has a static Figma footer. */
export function setupFooters(handlers: FooterNavHandlers = {}): void {
  for (const childIdx of SITE_PILOT_CHILD_INDICES) {
    const page = document.querySelector(
      `.studio-viewport > div > div:nth-child(${childIdx})`,
    ) as HTMLElement | null;
    if (page) stripProtoFooterFromPage(page);
  }

  for (const childIdx of FOOTER_CHILD_INDICES) {
    const page = document.querySelector(
      `.studio-viewport > div > div:nth-child(${childIdx})`,
    ) as HTMLElement | null;
    if (!page) continue;

    const config = FOOTER_BY_CHILD[childIdx];
    if (!config) continue;

    mountProtoFooterOnPage(
      page,
      { ...config, ...handlers },
      FOOTER_HIDE_SELECTORS,
    );
  }
}
