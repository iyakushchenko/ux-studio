import { describe, expect, it } from "vitest";
import {
  findTopmostBlockingModal,
  isElementBlockedByModal,
  normalizeStudioModalId,
  resolveClickTargetRespectingModal,
  STUDIO_MODAL,
} from "@/app/shell/studioModalGuard";

type FakeNode = {
  classList: { contains: (token: string) => boolean };
  getAttribute: (name: string) => string | null;
  closest: (sel: string) => FakeNode | null;
  contains: (other: FakeNode) => boolean;
  querySelector: (sel: string) => FakeNode | null;
  querySelectorAll: (sel: string) => FakeNode[];
  _classes: string[];
  _attrs: Record<string, string>;
  _children: FakeNode[];
  _parent: FakeNode | null;
};

function fakeEl(
  attrs: Record<string, string> = {},
  children: FakeNode[] = [],
  classes: string[] = []
): FakeNode {
  const classSet = new Set(classes);
  const node: FakeNode = {
    _classes: classes,
    _attrs: attrs,
    _children: children,
    _parent: null,
    classList: {
      contains: (token) => classSet.has(token),
    },
    getAttribute: (name) => attrs[name] ?? null,
    closest: (sel) => {
      let cur: FakeNode | null = node;
      while (cur) {
        if (matches(cur, sel)) return cur;
        cur = cur._parent;
      }
      return null;
    },
    contains: (other) => {
      if (other === node) return true;
      const walk = (n: FakeNode): boolean =>
        n._children.some((c) => c === other || walk(c));
      return walk(node);
    },
    querySelector: (sel) => {
      const all = collect(node);
      const parts = sel.split(",").map((s) => s.trim());
      return all.find((n) => parts.some((p) => matches(n, p))) ?? null;
    },
    querySelectorAll: (sel) => {
      const parts = sel.split(",").map((s) => s.trim());
      return collect(node).filter((n) => parts.some((p) => matches(n, p)));
    },
  };
  for (const child of children) child._parent = node;
  return node;
}

function collect(root: FakeNode): FakeNode[] {
  const out: FakeNode[] = [];
  const walk = (n: FakeNode) => {
    out.push(n);
    n._children.forEach(walk);
  };
  walk(root);
  return out;
}

function matches(n: FakeNode, sel: string): boolean {
  if (sel.startsWith("#")) {
    return n.getAttribute("id") === sel.slice(1);
  }
  if (sel.includes("studio-agent-testing-overlay")) {
    return n.classList.contains("studio-agent-testing-overlay");
  }
  if (sel.includes('data-studio-modal="choose-pharmacy"')) {
    return n.getAttribute("data-studio-modal") === "choose-pharmacy";
  }
  if (sel.includes("studio-avail-scrim")) {
    if (!n.classList.contains("studio-avail-scrim")) return false;
    if (sel.includes(":not(") && n.classList.contains("studio-avail-scrim--closing")) {
      return false;
    }
    return true;
  }
  if (sel.includes('[role="dialog"]')) {
    return (
      n.getAttribute("role") === "dialog" &&
      (!sel.includes("aria-modal") || n.getAttribute("aria-modal") === "true")
    );
  }
  if (sel.includes('aria-modal="true"')) {
    return n.getAttribute("aria-modal") === "true";
  }
  return false;
}

describe("studioModalGuard", () => {
  it("normalizes choose-pharmacy aliases", () => {
    expect(normalizeStudioModalId("choose-pharmacy")).toBe(
      STUDIO_MODAL.choosePharmacy
    );
    expect(normalizeStudioModalId("availability")).toBe(
      STUDIO_MODAL.choosePharmacy
    );
    expect(normalizeStudioModalId("AVAIL")).toBe(STUDIO_MODAL.choosePharmacy);
  });

  it("finds topmost avail scrim / dialog", () => {
    const inside = fakeEl({ id: "inside" });
    const dialog = fakeEl(
      { role: "dialog", "aria-modal": "true" },
      [inside]
    );
    const scrim = fakeEl(
      { "data-studio-modal": "choose-pharmacy" },
      [dialog],
      ["studio-avail-scrim"]
    );
    const under = fakeEl({ id: "under" });
    const root = fakeEl({}, [under, scrim]);

    const modal = findTopmostBlockingModal(root as unknown as ParentNode);
    expect(modal).toBe(scrim as unknown as HTMLElement);
    expect(
      isElementBlockedByModal(
        under as unknown as Element,
        root as unknown as ParentNode
      )
    ).toBe(true);
    expect(
      isElementBlockedByModal(
        inside as unknown as Element,
        root as unknown as ParentNode
      )
    ).toBe(false);
  });

  it("resolveClickTargetRespectingModal blocks under-scrim targets", () => {
    const inside = fakeEl({ id: "inside" });
    const scrim = fakeEl(
      { "data-studio-modal": "choose-pharmacy" },
      [inside],
      ["studio-avail-scrim"]
    );
    const under = fakeEl({ id: "under" });
    const root = fakeEl({}, [under, scrim]);

    expect(
      resolveClickTargetRespectingModal(under as unknown as HTMLElement, {
        root: root as unknown as ParentNode,
      })
    ).toBeNull();
    expect(
      resolveClickTargetRespectingModal(inside as unknown as HTMLElement, {
        root: root as unknown as ParentNode,
      })
    ).toBe(inside);
    expect(
      resolveClickTargetRespectingModal(under as unknown as HTMLElement, {
        root: root as unknown as ParentNode,
        resolveInModal: (modal) =>
          (modal as unknown as FakeNode).querySelector(
            "#inside"
          ) as unknown as HTMLElement,
      })
    ).toBe(inside);
  });
});
