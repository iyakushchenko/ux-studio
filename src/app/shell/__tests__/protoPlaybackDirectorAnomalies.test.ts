import { describe, expect, it } from "vitest";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  beatExpectsViewportFollow,
  beatExpectsViewportFollowAfterScript,
  beatHasDirectorScript,
  isDwellLandingBeat,
  shouldChainManualDirectorStepOnAdvance,
  touchpointExpectsViewportFollow,
} from "@/app/orchestra/journeyBeatDirector";
import {
  detectDirectorHandoffSkippedAnomaly,
  detectDirectorOutcomeAnomaly,
  detectDirectorStepNoEffectAnomaly,
} from "@/app/shell/protoPlaybackDirectorAnomalies";
import { detectViewportStallAfterAdvance } from "@/app/shell/protoPlaybackViewportAnomalies";

const bookDateBeat: JourneyBeat = {
  id: "book-step2-date",
  label: "Book — date",
  kind: "tab-landing",
  protoTab: 6,
  bookScript: "select-book-date",
};

const bookTimeBeat: JourneyBeat = {
  id: "book-step2-time",
  label: "Book — time",
  kind: "tab-landing",
  protoTab: 6,
  bookScript: "select-book-time",
};

const bookReserveBeat: JourneyBeat = {
  id: "book-step2-reserve",
  label: "Book — reserve",
  kind: "tab-landing",
  protoTab: 6,
  bookScript: "reserve-appointment",
};

const confirmationBeat: JourneyBeat = {
  id: "confirmation",
  label: "Confirmation",
  kind: "tab-landing",
  protoTab: 7,
  tabScript: "confirmation-open-appointments",
};

const appointmentHistoryBeat: JourneyBeat = {
  id: "appointment-history",
  label: "Appointment history",
  kind: "tab-landing",
  protoTab: 8,
  tabScript: "history-view-details",
};

const bookLandingBeat: JourneyBeat = {
  id: "book-step2",
  label: "Book — date and time",
  kind: "tab-landing",
  protoTab: 6,
  dwellMs: 2800,
};

const chooseLocationBeat: JourneyBeat = {
  id: "choose-location",
  label: "Choose location",
  kind: "tab-landing",
  protoTab: 5,
  tabScript: "book-location-pick",
};

describe("journeyBeatDirector", () => {
  it("identifies dwell landing beats", () => {
    expect(isDwellLandingBeat(bookLandingBeat)).toBe(true);
    expect(isDwellLandingBeat(bookDateBeat)).toBe(false);
  });

  it("detects director scripts from beat metadata", () => {
    expect(beatHasDirectorScript(bookDateBeat)).toBe(true);
    expect(beatHasDirectorScript(bookLandingBeat)).toBe(false);
  });

  it("expects viewport follow for chained scroll steps on the same tab", () => {
    expect(beatExpectsViewportFollow(bookTimeBeat, bookReserveBeat)).toBe(true);
    expect(beatExpectsViewportFollow(bookLandingBeat, bookDateBeat)).toBe(false);
    expect(beatExpectsViewportFollow(chooseLocationBeat, bookLandingBeat)).toBe(
      false
    );
  });

  it("does not expect viewport follow on date to time beat advance", () => {
    expect(beatExpectsViewportFollow(bookDateBeat, bookTimeBeat)).toBe(false);
    expect(beatExpectsViewportFollowAfterScript(bookDateBeat)).toBe(false);
    expect(beatExpectsViewportFollowAfterScript(bookTimeBeat)).toBe(true);
  });

  it("chains manual book date advance into time director script", () => {
    expect(
      shouldChainManualDirectorStepOnAdvance(bookDateBeat, bookTimeBeat)
    ).toBe(true);
    expect(
      shouldChainManualDirectorStepOnAdvance(bookTimeBeat, bookReserveBeat)
    ).toBe(true);
    expect(
      shouldChainManualDirectorStepOnAdvance(bookReserveBeat, confirmationBeat)
    ).toBe(true);
    expect(
      shouldChainManualDirectorStepOnAdvance(
        confirmationBeat,
        appointmentHistoryBeat
      )
    ).toBe(true);
    expect(
      shouldChainManualDirectorStepOnAdvance(bookDateBeat, bookReserveBeat)
    ).toBe(false);
  });

  it("does not expect viewport follow when touchpoint is a popup", () => {
    expect(
      touchpointExpectsViewportFollow(
        "beat:traditional-pdp",
        "popup:login",
        true
      )
    ).toBe(false);
    expect(
      touchpointExpectsViewportFollow("popup:login", "popup:login", true)
    ).toBe(false);
    expect(
      touchpointExpectsViewportFollow(
        "beat:book-step2-date",
        "beat:book-step2-time",
        true
      )
    ).toBe(true);
  });
});

describe("protoPlaybackDirectorAnomalies", () => {
  it("flags sync that applied a director-only outcome", () => {
    const anomaly = detectDirectorOutcomeAnomaly("select-book-time", {
      mode: "sync",
      usedDemoCursor: false,
      usedSkipClick: true,
      cursorRequired: true,
      outcomeAppliedThisRun: true,
    });
    expect(anomaly?.kind).toBe("selection-without-director");
  });

  it("flags director step without demo cursor", () => {
    const anomaly = detectDirectorOutcomeAnomaly("select-book-time", {
      mode: "director",
      usedDemoCursor: false,
      usedSkipClick: false,
      cursorRequired: true,
      outcomeAppliedThisRun: true,
    });
    expect(anomaly?.kind).toBe("selection-without-director");
  });

  it("allows idempotent director step when this run did not apply selection", () => {
    expect(
      detectDirectorOutcomeAnomaly("select-book-date", {
        mode: "director",
        usedDemoCursor: false,
        usedSkipClick: false,
        cursorRequired: true,
        outcomeAppliedThisRun: false,
      })
    ).toBeNull();
  });

  it("flags dwell handoff when director script never started", () => {
    const anomaly = detectDirectorHandoffSkippedAnomaly({
      fromBeatId: "book-step2",
      toBeatId: "book-step2-date",
      scriptLabel: "select-book-date",
      scriptStarted: false,
      scriptSucceeded: false,
    });
    expect(anomaly?.kind).toBe("director-step-skipped");
  });

  it("flags manual director step with no DOM effect on select-book-time", () => {
    const anomaly = detectDirectorStepNoEffectAnomaly({
      scriptLabel: "select-book-time",
      report: {
        mode: "director",
        usedDemoCursor: false,
        usedSkipClick: false,
        cursorRequired: true,
        outcomeAppliedThisRun: false,
        domGoalMet: false,
      },
      beatId: "book-step2-time",
      scrollDeltaPx: 0,
    });
    expect(anomaly?.kind).toBe("director-step-no-effect");
  });

  it("allows select-book-time manual step when scroll moved without cursor", () => {
    expect(
      detectDirectorStepNoEffectAnomaly({
        scriptLabel: "select-book-time",
        report: {
          mode: "director",
          usedDemoCursor: false,
          usedSkipClick: false,
          cursorRequired: true,
          outcomeAppliedThisRun: false,
          domGoalMet: false,
        },
        scrollDeltaPx: 64,
      })
    ).toBeNull();
  });
});

describe("protoPlaybackViewportAnomalies", () => {
  it("reports viewport stall when follow expected but scroll did not move", () => {
    const anomaly = detectViewportStallAfterAdvance({
      scrollTop: 0,
      baselineScrollTop: 0,
      childIndex: 4,
      baselineChildIndex: 4,
      beatId: "book-step2-time",
      baselineBeatId: "book-step2-date",
      isScripting: false,
      isPausingBeforeReveal: false,
      screenFramesBeat: false,
      anchorInView: false,
      anchorProminent: false,
      expectsViewportFollow: true,
    });
    expect(anomaly?.kind).toBe("viewport-stall");
  });

  it("ignores viewport stall when follow is not expected", () => {
    expect(
      detectViewportStallAfterAdvance({
        scrollTop: 0,
        baselineScrollTop: 0,
        childIndex: 4,
        baselineChildIndex: 4,
        beatId: "book-step2",
        baselineBeatId: "choose-location",
        isScripting: false,
        isPausingBeforeReveal: false,
        screenFramesBeat: false,
        anchorInView: false,
        anchorProminent: false,
        expectsViewportFollow: false,
      })
    ).toBeNull();
  });
});
