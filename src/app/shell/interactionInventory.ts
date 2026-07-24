export type InteractionReadiness =
  | "ready-target"
  | "semantic-ready"
  | "visual-candidate"
  | "disabled"
  | "invalid";

export type InteractionInventoryItem = {
  targetId: string;
  selector: string | null;
  tag: string;
  role: string | null;
  type: string | null;
  name: string;
  source: "native" | "aria" | "studio-hook" | "css-candidate";
  readiness: InteractionReadiness;
  issues: string[];
  enabled: boolean;
  focusable: boolean;
  href: string | null;
  rect: { x: number; y: number; width: number; height: number };
};

export type InteractionSurfaceResult = {
  surfaceId: string;
  label: string;
  kind: "hub" | "screen";
  totals: Record<InteractionReadiness, number>;
  items: InteractionInventoryItem[];
  issues: Array<{ code: string; targetId: string }>;
};

export type InteractionInventoryReport = {
  kind: "studio-interaction-inventory";
  schemaVersion: 1;
  generatedAt: string;
  projectId: string;
  scope: "current" | "all-project-surfaces";
  pass: boolean;
  readinessPass: boolean;
  totals: Record<InteractionReadiness, number>;
  surfaces: InteractionSurfaceResult[];
  errors: string[];
};

export type InteractionSurface = {
  id: string;
  label: string;
  kind: "hub" | "screen";
  index?: number;
};

const NATIVE_SELECTOR = "button,a[href],input,select,textarea,summary";
const ROLE_SELECTOR =
  '[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="menuitem"],[role="option"],[role="slider"]';
const DECLARED_SELECTOR =
  '[data-studio-action],[data-studio-target],[contenteditable="true"],[tabindex]';
const EXCLUDED_SELECTOR =
  '.studio-nav-root,.studio-nav,.agent-testing-overlay,.studio-demo-cursor,.studio-playback-diagnostic,[data-studio-qa-overlay]';

function emptyTotals(): Record<InteractionReadiness, number> {
  return {
    "ready-target": 0,
    "semantic-ready": 0,
    "visual-candidate": 0,
    disabled: 0,
    invalid: 0,
  };
}

function visible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return (
    !el.hidden &&
    el.getAttribute("aria-hidden") !== "true" &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity || "1") > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function accessibleName(el: HTMLElement): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  const labelled = labelledBy
    ? labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
    : "";
  const input = el as HTMLInputElement;
  return (
    el.getAttribute("aria-label") ||
    labelled ||
    el.getAttribute("title") ||
    (input.labels ? [...input.labels].map((label) => label.textContent?.trim()).filter(Boolean).join(" ") : "") ||
    el.textContent?.replace(/\s+/g, " ").trim() ||
    input.placeholder ||
    input.name ||
    ""
  ).slice(0, 240);
}

function cssEscape(value: string): string {
  return globalThis.CSS?.escape ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&");
}

type StableSelectorResult = {
  selector: string | null;
  /** A candidate identity attribute existed but matched >1 element on the
   * page — e.g. three "Change" buttons all sharing one data-name (PP-49).
   * REC/replay resolve this kind of collision to *some* element, not
   * necessarily the intended one — silent wrong-target risk, not just
   * missing coverage. */
  ambiguous: boolean;
};

function stableSelector(el: HTMLElement): StableSelectorResult {
  let ambiguous = false;
  for (const attr of ["data-studio-action", "data-studio-target", "data-name", "id", "aria-label"] as const) {
    const value = attr === "id" ? el.id : el.getAttribute(attr);
    if (!value) continue;
    const selector = attr === "id" ? `#${cssEscape(value)}` : `[${attr}="${cssEscape(value)}"]`;
    const count = document.querySelectorAll(selector).length;
    if (count === 1) return { selector, ambiguous: false };
    if (count > 1) ambiguous = true;
  }
  const href = el.getAttribute("href");
  if (el.tagName === "A" && href && href !== "#") {
    const selector = `a[href="${cssEscape(href)}"]`;
    const count = document.querySelectorAll(selector).length;
    if (count === 1) return { selector, ambiguous: false };
    if (count > 1) ambiguous = true;
  }
  return { selector: null, ambiguous };
}

function inventoryItem(el: HTMLElement, ordinal: number): InteractionInventoryItem {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  const action = el.getAttribute("data-studio-action") || el.getAttribute("data-studio-target");
  const stable = stableSelector(el);
  const selector = stable.selector;
  const name = accessibleName(el);
  const native = el.matches(NATIVE_SELECTOR);
  const aria = el.matches(ROLE_SELECTOR);
  const disabled =
    ("disabled" in el && Boolean((el as HTMLButtonElement).disabled)) ||
    el.getAttribute("aria-disabled") === "true";
  const rect = el.getBoundingClientRect();
  const focusable =
    !disabled &&
    (native || aria || el.tabIndex >= 0 || el.getAttribute("contenteditable") === "true");
  const issues: string[] = [];
  if (!name && !disabled) issues.push("missing-accessible-name");
  if (!selector && !disabled) issues.push("missing-stable-target");
  if (stable.ambiguous && !disabled) issues.push("ambiguous-target");
  if (el.parentElement?.closest(`${NATIVE_SELECTOR},${ROLE_SELECTOR}`)) issues.push("nested-interactive");
  const targetId = action || selector || `${tag}-${ordinal}`;
  let readiness: InteractionReadiness;
  if (disabled) readiness = "disabled";
  else if (
    issues.includes("missing-accessible-name") ||
    issues.includes("nested-interactive") ||
    issues.includes("ambiguous-target")
  ) readiness = "invalid";
  else if (selector) readiness = "ready-target";
  else if (native || aria) readiness = "semantic-ready";
  else readiness = "visual-candidate";
  return {
    targetId,
    selector,
    tag,
    role,
    type: el.getAttribute("type"),
    name,
    source: action ? "studio-hook" : native ? "native" : aria ? "aria" : "css-candidate",
    readiness,
    issues,
    enabled: !disabled,
    focusable,
    href: el.getAttribute("href"),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  };
}

export function inventorySurface(root: HTMLElement, surface: InteractionSurface): InteractionSurfaceResult {
  const declared = [...root.querySelectorAll<HTMLElement>(`${NATIVE_SELECTOR},${ROLE_SELECTOR},${DECLARED_SELECTOR}`)];
  const visual = [...root.querySelectorAll<HTMLElement>("[class]")].filter((el) => {
    if (
      declared.includes(el) ||
      el.closest(`${NATIVE_SELECTOR},${ROLE_SELECTOR},${DECLARED_SELECTOR}`) ||
      !visible(el)
    ) return false;
    return getComputedStyle(el).cursor === "pointer";
  });
  const candidates = [...new Set([...declared, ...visual])].filter(
    (el) => visible(el) && !el.closest(EXCLUDED_SELECTOR)
  );
  const items = candidates.map(inventoryItem);
  const totals = emptyTotals();
  const issues: Array<{ code: string; targetId: string }> = [];
  for (const item of items) {
    totals[item.readiness] += 1;
    item.issues.forEach((code) => issues.push({ code, targetId: item.targetId }));
  }
  return { surfaceId: surface.id, label: surface.label, kind: surface.kind, totals, items, issues };
}

type RegistrationOptions = {
  projectId: string;
  surfaces: InteractionSurface[];
  getActiveSurface: () => InteractionSurface;
  getActiveRoot: () => HTMLElement | null;
  navigate: (surface: InteractionSurface) => void;
  prepare?: () => void | Promise<void>;
};

function mergeTotals(surfaces: InteractionSurfaceResult[]) {
  const totals = emptyTotals();
  surfaces.forEach((surface) =>
    (Object.keys(totals) as InteractionReadiness[]).forEach((key) => {
      totals[key] += surface.totals[key];
    })
  );
  return totals;
}

async function waitForSurface(options: RegistrationOptions, id: string): Promise<HTMLElement> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const root = options.getActiveRoot();
    if (options.getActiveSurface().id === id && root) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return root;
    }
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  throw new Error(`Surface did not become ready: ${id}`);
}

function report(options: RegistrationOptions, scope: InteractionInventoryReport["scope"], surfaces: InteractionSurfaceResult[], errors: string[]): InteractionInventoryReport {
  const totals = mergeTotals(surfaces);
  return {
    kind: "studio-interaction-inventory",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    projectId: options.projectId,
    scope,
    pass: errors.length === 0,
    readinessPass: errors.length === 0 && totals.invalid === 0,
    totals,
    surfaces,
    errors,
  };
}

export function registerInteractionInventory(options: RegistrationOptions): () => void {
  let lastReport: InteractionInventoryReport | null = null;
  window.__studioMapCurrentInteractions = async () => {
    const surface = options.getActiveSurface();
    const root = options.getActiveRoot();
    lastReport = !root
      ? report(options, "current", [], [`Active surface root unavailable: ${surface.id}`])
      : report(options, "current", [inventorySurface(root, surface)], []);
    return lastReport;
  };
  window.__studioMapAllInteractions = async () => {
    const original = options.getActiveSurface();
    const results: InteractionSurfaceResult[] = [];
    const errors: string[] = [];
    await options.prepare?.();
    try {
      for (const surface of options.surfaces) {
        options.navigate(surface);
        try {
          results.push(inventorySurface(await waitForSurface(options, surface.id), surface));
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
    } finally {
      options.navigate(original);
    }
    lastReport = report(options, "all-project-surfaces", results, errors);
    return lastReport;
  };
  window.__studioGetLastInteractionInventory = () => lastReport;
  window.__studioDownloadInteractionInventory = () => {
    if (!lastReport) return false;
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `interaction-inventory-${options.projectId}-${Date.now()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
    return true;
  };
  return () => {
    delete window.__studioMapCurrentInteractions;
    delete window.__studioMapAllInteractions;
    delete window.__studioGetLastInteractionInventory;
    delete window.__studioDownloadInteractionInventory;
  };
}

declare global {
  interface Window {
    __studioMapCurrentInteractions?: () => Promise<InteractionInventoryReport>;
    __studioMapAllInteractions?: () => Promise<InteractionInventoryReport>;
    __studioGetLastInteractionInventory?: () => InteractionInventoryReport | null;
    __studioDownloadInteractionInventory?: () => boolean;
  }
}
