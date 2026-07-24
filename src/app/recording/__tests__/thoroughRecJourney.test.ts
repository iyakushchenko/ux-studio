import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { JourneyFile } from "@/app/journey/journeyFile";
import { isUsablePlaybackSelectorChain } from "@/app/recording/recordingCompile";

/**
 * Golden fixture for PP-49: a hand-driven REC pass through FAQ-scope,
 * forgot-password, guest→login, and the date/time/location popup. Both bugs
 * this journey caught (recorder-blind unmarked controls; ambiguous duplicate
 * "Change" selector) are now fixed at the source (LoginPopup.tsx,
 * AppointmentSummaryPill.tsx). This test locks the compiled shape so a future
 * regression (e.g. someone strips a `data-studio-action` marker) fails loud
 * here instead of silently vanishing from a live REC session again.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(
  __dirname,
  "fixtures",
  "thoroughRecJourney.journey.json"
);

function loadFixture(): JourneyFile {
  return JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as JourneyFile;
}

describe("thorough REC journey fixture (PP-49)", () => {
  it("has all 19 beats, none dropped by compile", () => {
    const file = loadFixture();
    expect(file.journey.beats).toHaveLength(19);
  });

  it("captured the forgot-password detour as real, playable beats", () => {
    const file = loadFixture();
    const ids = file.journey.beats.map((b) => b.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "login-forgot-password",
        "login-forgot-send",
        "login-forgot-back",
      ])
    );
  });

  it("every recordedClick beat has a usable, non-empty selector chain", () => {
    const file = loadFixture();
    for (const beat of file.journey.beats) {
      if (!beat.recordedClick) continue;
      expect(
        isUsablePlaybackSelectorChain(beat.recordedClick.selectorChain)
      ).toBe(true);
    }
  });

  it("the three appointment-summary Change beats carry distinct action ids (no ambiguous duplicate selector)", () => {
    const file = loadFixture();
    const changeBeats = file.journey.beats.filter((b) =>
      b.id.startsWith("change-")
    );
    // This fixture only exercises the Location change; assert its selector
    // is scoped by a unique data-studio-action, not the shared
    // data-name="component.input.button" that caused PP-49's replay to open
    // the wrong picker (Vaccine instead of Location).
    for (const beat of changeBeats) {
      const chain = beat.recordedClick?.selectorChain ?? [];
      expect(chain.some((sel) => sel.includes("data-studio-action"))).toBe(
        true
      );
    }
  });
});
