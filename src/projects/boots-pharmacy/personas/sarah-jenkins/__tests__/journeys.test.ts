import { describe, expect, it } from "vitest";
import type {
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  JourneyBeat,
  JourneyBeatActionId,
  TabScriptId,
} from "@/app/orchestra/types";
import { BOOTS_PHARMACY_SCENARIO_SCREENS } from "@/projects/boots-pharmacy/screens/scenarios";
import {
  AGENTIC_CJM_JOURNEY,
  shouldSkipTraditionalLoginBeat,
  TRADITIONAL_CJM_JOURNEY,
  TRADITIONAL_LOGIN_BEAT_ID,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

const HOME_SCRIPTS = new Set<HomeScriptId>(["sarah-query-submit"]);
const AVAIL_SCRIPTS = new Set<AvailabilityScriptId>([
  "continue-from-date",
  "select-time-slot",
  "book-now",
]);
const BOOK_SCRIPTS = new Set<BookScriptId>([
  "select-book-date",
  "select-book-time",
  "reserve-appointment",
]);
const TAB_SCRIPTS = new Set<TabScriptId>([
  "plp-open-pdp",
  "pdp-book-now",
  "login-sign-in",
  "book-location-pick",
  "confirmation-open-appointments",
  "history-view-details",
]);
const ON_ENTER_ACTIONS = new Set<JourneyBeatActionId>([
  "open-availability-start",
  "open-availability-date-chat",
  "close-availability",
  "apply-demo-location",
]);

const SCENARIO_IDS = new Set(BOOTS_PHARMACY_SCENARIO_SCREENS.map((s) => s.id));

function validateJourney(journey: typeof AGENTIC_CJM_JOURNEY) {
  const ids = new Set<string>();

  for (const beat of journey.beats) {
    expect(ids.has(beat.id), `duplicate beat id: ${beat.id}`).toBe(false);
    ids.add(beat.id);

    if (beat.protoTab != null) {
      expect(beat.protoTab, `${beat.id} protoTab`).toBeGreaterThanOrEqual(1);
      expect(beat.protoTab, `${beat.id} protoTab`).toBeLessThanOrEqual(9);
    }

    if (beat.homeScript) {
      expect(HOME_SCRIPTS.has(beat.homeScript), `${beat.id} homeScript`).toBe(true);
    }
    if (beat.availScript) {
      expect(AVAIL_SCRIPTS.has(beat.availScript), `${beat.id} availScript`).toBe(true);
    }
    if (beat.bookScript) {
      expect(BOOK_SCRIPTS.has(beat.bookScript), `${beat.id} bookScript`).toBe(true);
    }
    if (beat.tabScript) {
      expect(TAB_SCRIPTS.has(beat.tabScript), `${beat.id} tabScript`).toBe(true);
    }
    if (beat.onEnter) {
      expect(ON_ENTER_ACTIONS.has(beat.onEnter), `${beat.id} onEnter`).toBe(true);
    }
    if (beat.kind === "screen-frames") {
      expect(beat.scenarioId, `${beat.id} scenarioId`).toBeTruthy();
      expect(SCENARIO_IDS.has(beat.scenarioId!), `${beat.id} scenarioId`).toBe(true);
    }
  }
}

describe("Sarah Jenkins journeys — integrity", () => {
  it("validates Agentic CJM beats", () => {
    validateJourney(AGENTIC_CJM_JOURNEY);
    expect(AGENTIC_CJM_JOURNEY.beats.length).toBeGreaterThan(5);
  });

  it("validates Traditional CJM beats", () => {
    validateJourney(TRADITIONAL_CJM_JOURNEY);
    expect(
      TRADITIONAL_CJM_JOURNEY.beats.some((b) => b.id === TRADITIONAL_LOGIN_BEAT_ID)
    ).toBe(true);
  });
});

describe("shouldSkipTraditionalLoginBeat", () => {
  const loginBeat: JourneyBeat = {
    id: TRADITIONAL_LOGIN_BEAT_ID,
    label: "Log in",
    kind: "tab-landing",
    protoTab: 4,
  };

  it("skips login beat when header is logged in", () => {
    expect(shouldSkipTraditionalLoginBeat(loginBeat, true)).toBe(true);
  });

  it("does not skip login beat when logged out", () => {
    expect(shouldSkipTraditionalLoginBeat(loginBeat, false)).toBe(false);
  });

  it("does not skip unrelated beats", () => {
    const other: JourneyBeat = { id: "other", label: "Other", kind: "tab-landing" };
    expect(shouldSkipTraditionalLoginBeat(other, true)).toBe(false);
  });
});
