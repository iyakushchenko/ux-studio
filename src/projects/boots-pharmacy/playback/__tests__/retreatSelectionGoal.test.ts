import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { checkRetreatSelectionGoal } from "@/projects/boots-pharmacy/playback/retreatSelectionGoal";
import { AGENTIC_CJM_JOURNEY } from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";
import type { JourneyBeat } from "@/app/orchestra/types";

function beat(id: string): JourneyBeat {
  return AGENTIC_CJM_JOURNEY.beats.find((entry) => entry.id === id)!;
}

type MockElement = {
  tagName: string;
  className: string;
  textContent: string;
  dataset: Record<string, string>;
  parentElement: MockElement | null;
  children: MockElement[];
  classList: {
    contains: (token: string) => boolean;
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
  };
  querySelector: (selector: string) => MockElement | null;
  querySelectorAll: (selector: string) => MockElement[];
};

function createElement(
  tag: string,
  options?: {
    className?: string;
    text?: string;
    dataset?: Record<string, string>;
  }
): MockElement {
  const el: MockElement = {
    tagName: tag.toUpperCase(),
    className: options?.className ?? "",
    textContent: options?.text ?? "",
    dataset: { ...(options?.dataset ?? {}) },
    parentElement: null,
    children: [],
    classList: {
      contains(token: string) {
        return el.className.split(/\s+/).includes(token);
      },
      add(...tokens: string[]) {
        const set = new Set(el.className.split(/\s+/).filter(Boolean));
        tokens.forEach((token) => set.add(token));
        el.className = Array.from(set).join(" ");
      },
      remove(...tokens: string[]) {
        const set = new Set(el.className.split(/\s+/).filter(Boolean));
        tokens.forEach((token) => set.delete(token));
        el.className = Array.from(set).join(" ");
      },
    },
    querySelector(selector: string) {
      return queryMock(el, selector, false) as MockElement | null;
    },
    querySelectorAll(selector: string) {
      return queryMock(el, selector, true) as MockElement[];
    },
  };
  return el;
}

function append(parent: MockElement, child: MockElement) {
  child.parentElement = parent;
  parent.children.push(child);
}

function matches(el: MockElement, selector: string): boolean {
  const parts = selector.trim().split(/\s+/);
  let current: MockElement | null = el;
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (!current) return false;
    const part = parts[i];
    if (part.startsWith(".")) {
      const cls = part.slice(1);
      if (!current.classList.contains(cls)) return false;
    } else if (part.includes("[data-studio-cal-kind=")) {
      const kind = part.match(/data-studio-cal-kind="([^"]+)"/)?.[1];
      const month = part.match(/data-studio-cal-month="([^"]+)"/)?.[1];
      const value = part.match(/data-studio-cal-value="([^"]+)"/)?.[1];
      const selected = part.match(/data-studio-cal-selected="([^"]+)"/)?.[1];
      if (kind && current.dataset.studioCalKind !== kind) return false;
      if (month && current.dataset.studioCalMonth !== month) return false;
      if (value && current.dataset.studioCalValue !== value) return false;
      if (selected && current.dataset.studioCalSelected !== selected) return false;
    } else if (part.includes(":not(")) {
      const cls = part.match(/\.([\w-]+)/)?.[1];
      if (cls && current.classList.contains(cls)) return false;
    }
    current = current.parentElement;
  }
  return true;
}

function queryMock(
  root: MockElement,
  selector: string,
  all: boolean
): MockElement | MockElement[] | null {
  const results: MockElement[] = [];
  const visit = (node: MockElement) => {
    if (selector.includes("nth-child(")) {
      const parent = node.parentElement;
      if (parent) {
        const n = Number(selector.match(/nth-child\((\d+)\)/)?.[1]);
        const child = parent.children[n - 1];
        if (child && node === child && matches(node, selector.replace(/:nth-child\(\d+\)/, ""))) {
          results.push(node);
        }
      }
    } else if (matches(node, selector)) {
      results.push(node);
    }
    node.children.forEach(visit);
  };
  visit(root);
  if (selector.startsWith(".studio-viewport")) {
    const viewport = root.classList.contains("studio-viewport")
      ? root
      : root.querySelector(".studio-viewport");
    if (viewport) {
      const direct = selector.match(/div:nth-child\((\d+)\)/);
      if (direct) {
        const n = Number(direct[1]);
        const chain = selector.includes("> div > div:nth-child")
          ? viewport.children[0]?.children[n - 1]
          : null;
        return all ? (chain ? [chain] : []) : chain ?? null;
      }
    }
  }
  return all ? results : results[0] ?? null;
}

function mountBookStep2Dom(options: {
  month: string;
  day: number;
  time?: string;
  timeSelected?: boolean;
}) {
  const screen = createElement("div");
  const dateCell = createElement("div", {
    dataset: {
      studioCalKind: "date",
      studioCalMonth: options.month,
      studioCalValue: String(options.day),
      studioCalSelected: "true",
    },
  });
  append(screen, dateCell);
  const timeValue = options.time ?? "16:30";
  const timeCell = createElement("div", {
    dataset: {
      studioCalKind: "time",
      studioCalValue: timeValue,
      ...(options.timeSelected ? { studioCalSelected: "true" } : {}),
    },
  });
  append(screen, timeCell);

  screen.querySelector = (sel: string) => {
    if (
      sel.includes('[data-studio-cal-kind="date"]') &&
      sel.includes(`data-studio-cal-month="${options.month}"`) &&
      sel.includes(`data-studio-cal-value="${options.day}"`) &&
      sel.includes('data-studio-cal-selected="true"')
    ) {
      return dateCell;
    }
    if (
      sel.includes('[data-studio-cal-kind="time"]') &&
      sel.includes(`data-studio-cal-value="${timeValue}"`) &&
      sel.includes('data-studio-cal-selected="true"')
    ) {
      return options.timeSelected ? timeCell : null;
    }
    if (
      sel.includes('[data-studio-cal-kind="time"]') &&
      sel.includes('data-studio-cal-selected="true"') &&
      !sel.includes("data-studio-cal-value=")
    ) {
      return options.timeSelected ? timeCell : null;
    }
    return null;
  };

  vi.stubGlobal("document", {
    querySelector(sel: string) {
      if (sel === ".studio-viewport > div > div:nth-child(4)") return screen;
      if (
        sel.includes('[data-studio-cal-kind="date"]') &&
        sel.includes(`data-studio-cal-month="${options.month}"`) &&
        sel.includes(`data-studio-cal-value="${options.day}"`) &&
        sel.includes('data-studio-cal-selected="true"')
      ) {
        return dateCell;
      }
      if (
        sel.includes('[data-studio-cal-kind="time"]') &&
        sel.includes(`data-studio-cal-value="${timeValue}"`) &&
        sel.includes('data-studio-cal-selected="true"')
      ) {
        return options.timeSelected ? timeCell : null;
      }
      if (
        sel.includes('[data-studio-cal-kind="time"]') &&
        sel.includes(`data-studio-cal-value="15:30"`)
      ) {
        return timeValue === "15:30" && options.timeSelected ? timeCell : null;
      }
      if (
        sel.includes('[data-studio-cal-kind="time"]') &&
        sel.includes(`data-studio-cal-value="16:30"`)
      ) {
        return timeValue === "16:30" && options.timeSelected ? timeCell : null;
      }
      if (sel.includes('[data-studio-cal-selected="true"]') && sel.includes("time")) {
        return options.timeSelected ? timeCell : null;
      }
      return null;
    },
    body: { innerHTML: "" },
  });
}

function mountAvailDom(options: {
  dateDay?: number;
  time?: string;
  dateStep?: boolean;
}) {
  const dateCells = [24, 25, 21].map((day) => ({
    textContent: String(day),
    classList: {
      contains: (token: string) =>
        token === "proto-avail-cal-cell--selected" && options.dateDay === day,
    },
  }));
  const timeCell = {
    textContent: options.time ?? "15:30",
    classList: {
      contains: (token: string) =>
        token === "proto-avail-cal-cell--selected" && Boolean(options.time),
    },
  };
  const calendarEl = { textContent: "" };
  const card = {
    querySelector(selector: string) {
      if (selector === ".proto-avail-calendars") {
        return options.dateStep ? calendarEl : null;
      }
      if (selector.includes("proto-avail-cal-cell--time.proto-avail-cal-cell--selected")) {
        return options.time ? timeCell : null;
      }
      return null;
    },
    querySelectorAll(selector: string) {
      if (selector.includes("proto-avail-cal-cell:not")) {
        return dateCells;
      }
      if (selector.includes("proto-avail-cal-cell--time")) {
        return [timeCell];
      }
      return [];
    },
  };

  vi.stubGlobal("document", {
    querySelector(sel: string) {
      if (sel === ".proto-avail-card") return card;
      return null;
    },
    body: { innerHTML: "" },
  });
}

describe("checkRetreatSelectionGoal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("expects June 24 + 16:30 default on book-step2-date retreat", () => {
    mountBookStep2Dom({ month: "June", day: 24, time: "16:30", timeSelected: true });
    const goal = checkRetreatSelectionGoal(beat("book-step2-date"));
    expect(goal?.domGoalMet).toBe(true);
  });

  it("fails when playback June 21 remains after book-step2-date retreat", () => {
    mountBookStep2Dom({ month: "June", day: 21, time: "15:30", timeSelected: true });
    const goal = checkRetreatSelectionGoal(beat("book-step2-date"));
    expect(goal?.domGoalMet).toBe(false);
    expect(goal?.actual).not.toContain("June 24 + 16:30");
  });

  it("fails when playback time remains on select-book-time retreat", () => {
    mountBookStep2Dom({ month: "June", day: 24, time: "15:30", timeSelected: true });
    const goal = checkRetreatSelectionGoal(beat("book-step2-time"));
    expect(goal?.domGoalMet).toBe(false);
  });

  it("expects playback June 21 + 15:30 on reserve retreat", () => {
    mountBookStep2Dom({ month: "June", day: 21, time: "15:30", timeSelected: true });
    const goal = checkRetreatSelectionGoal(beat("book-step2-reserve"));
    expect(goal?.domGoalMet).toBe(true);
  });

  it("expects June 25 on avail-continue retreat", () => {
    mountAvailDom({ dateDay: 25, dateStep: true });
    const goal = checkRetreatSelectionGoal(beat("avail-continue"));
    expect(goal?.domGoalMet).toBe(true);
  });

  it("fails avail-continue when playback June 21 is still selected", () => {
    mountAvailDom({ dateDay: 21, dateStep: true });
    const goal = checkRetreatSelectionGoal(beat("avail-continue"));
    expect(goal?.domGoalMet).toBe(false);
  });

  it("expects June 21 with no time on avail-time retreat", () => {
    mountAvailDom({ dateDay: 21, dateStep: false });
    const goal = checkRetreatSelectionGoal(beat("avail-time"));
    expect(goal?.domGoalMet).toBe(true);
  });

  it("expects June 21 + 15:30 on avail-book retreat", () => {
    mountAvailDom({ dateDay: 21, time: "15:30" });
    const goal = checkRetreatSelectionGoal(beat("avail-book"));
    expect(goal?.domGoalMet).toBe(true);
  });
});
