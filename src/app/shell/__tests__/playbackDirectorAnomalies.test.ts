import { describe, expect, it } from "vitest";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  beatDirectorScriptLabel,
  beatExpectsViewportFollow,
  beatExpectsViewportFollowAfterScript,
  beatHasDirectorScript,
  isDwellLandingBeat,
  shouldChainManualDirectorStepOnAdvance,
  shouldAdvanceAfterChainedManualDirectorBeat,
  touchpointExpectsViewportFollow,
} from "@/app/orchestra/journeyBeatDirector";
import {
  detectDirectorHandoffSkippedAnomaly,
  detectDirectorOutcomeAnomaly,
  detectDirectorStepNoEffectAnomaly,
} from "@/app/shell/playbackDirectorAnomalies";
import { detectViewportStallAfterAdvance } from "@/app/shell/playbackViewportAnomalies";

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
  label: "Book — confirmed",
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
  label: "Book - Step 2",
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

const loginBeat: JourneyBeat = {
  id: "traditional-login",
  label: "Log in or register",
  kind: "tab-landing",
  protoTab: 4,
  tabScript: "login-sign-in",
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

  it("does not treat camera beats as director scripts (handoff watchdog)", () => {
    const cameraBeat: JourneyBeat = {
      id: "plp-book-now-camera",
      label: "Camera — Book Now",
      kind: "camera",
      protoTab: 3,
      camera: {
        dwellMs: 2030,
        selectorChain: ['[data-name="boots-pharmacy.service.tile"]'],
      },
    };
    expect(beatHasDirectorScript(cameraBeat)).toBe(false);
    expect(beatDirectorScriptLabel(cameraBeat)).toBeUndefined();
    expect(isDwellLandingBeat(cameraBeat)).toBe(false);
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
      shouldChainManualDirectorStepOnAdvance(loginBeat, chooseLocationBeat)
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

  it("advances a chained Reserve click to the Book Step 3 camera beat", () => {
    const confirmationCameraBeat: JourneyBeat = {
      id: "book-step3-camera",
      label: "Book Step 3 — show page",
      kind: "camera",
      protoTab: 7,
      camera: {
        selectorChain: ['[data-studio-open-appointment="true"]'],
      },
    };

    expect(
      shouldAdvanceAfterChainedManualDirectorBeat(
        bookReserveBeat,
        confirmationCameraBeat
      )
    ).toBe(true);
    expect(
      shouldAdvanceAfterChainedManualDirectorBeat(bookTimeBeat, bookReserveBeat)
    ).toBe(false);
  });

  it("advances a chained View Details click to the Appointment details beat (LESSONS 2026-07-22 beat-tab-mismatch)", () => {
    const appointmentDetailsBeat: JourneyBeat = {
      id: "appointment-details",
      label: "Appointment details",
      kind: "tab-landing",
      protoTab: 9,
    };

    expect(
      shouldAdvanceAfterChainedManualDirectorBeat(
        appointmentHistoryBeat,
        appointmentDetailsBeat
      )
    ).toBe(true);
    // Confirmation's own chained script does not navigate ahead — no auto-advance.
    expect(
      shouldAdvanceAfterChainedManualDirectorBeat(
        confirmationBeat,
        appointmentHistoryBeat
      )
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

describe("playbackDirectorAnomalies", () => {
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

describe("playbackViewportAnomalies", () => {
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
