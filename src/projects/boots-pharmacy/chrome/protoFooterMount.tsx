import { createRoot, type Root } from "react-dom/client";
import ProtoFooter, {
  type ProtoFooterNavHandlers,
  type ProtoFooterProps,
} from "@/projects/boots-pharmacy/chrome/ProtoFooter";
import {
  PROTO_FOOTER_BY_CHILD,
  PROTO_FOOTER_CHILD_INDICES,
  PROTO_FOOTER_HIDE_SELECTORS,
  PROTO_SITE_PILOT_CHILD_INDICES,
} from "@/projects/boots-pharmacy/chrome/protoFooterConfig";

const FOOTER_MOUNT_CLASS = "proto-footer-mount";
const roots = new WeakMap<HTMLElement, Root>();

function mountProtoFooterOnPage(
  page: HTMLElement,
  props: ProtoFooterProps,
  hideSelectors: readonly string[],
): void {
  for (const selector of hideSelectors) {
    page.querySelectorAll<HTMLElement>(selector).forEach((footer) => {
      if (footer.classList.contains(FOOTER_MOUNT_CLASS)) return;
      footer.style.display = "none";
      footer.dataset.protoFooterHidden = "true";
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
  root.render(<ProtoFooter {...props} />);
}

function stripProtoFooterFromPage(page: HTMLElement): void {
  page.querySelectorAll<HTMLElement>(`:scope > .${FOOTER_MOUNT_CLASS}`).forEach((host) => {
    const root = roots.get(host);
    root?.unmount();
    roots.delete(host);
    host.remove();
  });
}

/** Mount ProtoFooter on every prototype screen that has a static Figma footer. */
export function setupProtoFooters(handlers: ProtoFooterNavHandlers = {}): void {
  for (const childIdx of PROTO_SITE_PILOT_CHILD_INDICES) {
    const page = document.querySelector(
      `.proto-viewport > div > div:nth-child(${childIdx})`,
    ) as HTMLElement | null;
    if (page) stripProtoFooterFromPage(page);
  }

  for (const childIdx of PROTO_FOOTER_CHILD_INDICES) {
    const page = document.querySelector(
      `.proto-viewport > div > div:nth-child(${childIdx})`,
    ) as HTMLElement | null;
    if (!page) continue;

    const config = PROTO_FOOTER_BY_CHILD[childIdx];
    if (!config) continue;

    mountProtoFooterOnPage(
      page,
      { ...config, ...handlers },
      PROTO_FOOTER_HIDE_SELECTORS,
    );
  }
}
