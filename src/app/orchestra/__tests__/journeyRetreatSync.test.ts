import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  beatHasRetreatableState,
  beatRetreatScriptChannel,
  syncBeatRetreatState,
} from "@/app/orchestra/journeyRetreatSync";
import type { JourneyBeat, JourneyRuntime } from "@/app/orchestra/types";
import type { ProjectPlayback } from "@/projects/types";

const runtime = {} as JourneyRuntime;

function beat(partial: Partial<JourneyBeat> & Pick<JourneyBeat, "id">): JourneyBeat {
  return {
    label: partial.id,
    kind: "tab-landing",
    ...partial,
  };
}

describe("journeyRetreatSync", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal("document", {
      querySelector: vi.fn(() => null),
    });
  });

  it("routes book scripts through runBookScript with syncState", async () => {
    const runBookScript = vi.fn().mockResolvedValue({ ok: true });
    const playback = {
      runBookScript,
    } as unknown as ProjectPlayback;

    const target = beat({
      id: "book-step2-date",
      bookScript: "select-book-date",
      protoTab: 6,
    });

    expect(beatRetreatScriptChannel(target)).toBe("book");
    await syncBeatRetreatState(playback, target, runtime, { instant: true });

    expect(runBookScript).toHaveBeenCalledWith("select-book-date", {
      skip: true,
      syncState: true,
      instant: true,
    });
  });

  it("routes dwell beats through syncDwellRetreat", async () => {
    const syncDwellRetreat = vi.fn().mockResolvedValue(undefined);
    const playback = { syncDwellRetreat } as unknown as ProjectPlayback;
    const target = beat({ id: "book-step2", protoTab: 6 });

    expect(beatRetreatScriptChannel(target)).toBeNull();
    expect(beatHasRetreatableState(target)).toBe(true);

    await syncBeatRetreatState(playback, target, runtime);
    expect(syncDwellRetreat).toHaveBeenCalledWith(target, undefined);
  });

  it("routes tab scripts with runtime and syncState restores tab", async () => {
    const goToTab = vi.fn();
    const closeAllPopups = vi.fn();
    const closeAvailability = vi.fn();
    const runTabScript = vi.fn().mockImplementation(async (_id, runtime, options) => {
      if (options?.syncState) {
        runtime.goToTab(0, { instant: true });
        return { ok: true };
      }
      return { ok: true };
    });
    const playback = {
      runTabScript,
    } as unknown as ProjectPlayback;
    const runtime = {
      goToTab,
      closeAllPopups,
      closeAvailability,
    } as unknown as JourneyRuntime;
    const target = beat({
      id: "traditional-pdp",
      tabScript: "pdp-book-now",
      protoTab: 3,
    });

    await syncBeatRetreatState(playback, target, runtime);
    expect(runTabScript).toHaveBeenCalledWith("pdp-book-now", runtime, {
      skip: true,
      syncState: true,
      instant: true,
    });
  });
});
