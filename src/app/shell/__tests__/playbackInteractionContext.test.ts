import { describe, expect, it, beforeEach } from "vitest";
import { attachPlaybackInteractionToDiagnostic } from "@/app/shell/playbackStudioSnapshot";
import {
  describePlaybackElement,
  formatPlaybackInteraction,
  getLastPlaybackInteraction,
  notePlaybackDemoClick,
  notePlaybackTransport,
  resetPlaybackInteractionContext,
} from "@/app/shell/playbackInteractionContext";
import { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";
import { buildPlaybackDiagnosticReport } from "@/app/shell/diagnosticReport";

function mockElement(
  attrs: Record<string, string | null | undefined>,
  text = ""
): HTMLElement {
  return {
    tagName: "BUTTON",
    getAttribute: (name: string) => attrs[name] ?? null,
    textContent: text,
    closest: () => null,
  } as unknown as HTMLElement;
}

describe("playbackInteractionContext", () => {
  beforeEach(() => {
    resetPlaybackInteractionContext();
  });

  it("describes demo-click targets with data-name and text", () => {
    const el = mockElement({ "data-name": "Continue" }, "Continue booking");

    expect(describePlaybackElement(el)).toContain('data-name="Continue"');
    expect(describePlaybackElement(el)).toContain('text="Continue booking"');
  });

  it("formats transport and demo-click interactions", () => {
    notePlaybackTransport("step-forward");
    expect(formatPlaybackInteraction(getLastPlaybackInteraction())).toBe(
      "Studio nav — Step forward"
    );

    const btn = mockElement({ "aria-label": "Book appointment" });
    notePlaybackDemoClick(btn);
    expect(formatPlaybackInteraction(getLastPlaybackInteraction())).toContain(
      "Robo-cursor click"
    );
    expect(formatPlaybackInteraction(getLastPlaybackInteraction())).toContain(
      "Book appointment"
    );
    expect(formatPlaybackInteraction(getLastPlaybackInteraction())).not.toMatch(
      /aria-label=/
    );
  });

  it("attaches last interaction to diagnostics and reports", () => {
    notePlaybackTransport("step-forward");

    const error = attachPlaybackInteractionToDiagnostic(
      new PlaybackDiagnosticError({
        phase: "scroll-anomaly",
        message: "Unexpected scroll jump",
        detail: "from=0 to=750",
      })
    );

    expect(error.context.triggerInteraction).toBe("Studio nav — Step forward");
    expect(error.context.triggerKind).toBe("transport");

    const report = buildPlaybackDiagnosticReport(error);
    expect(report).toContain("trigger: Studio nav — Step forward");
    expect(report).toContain("triggerKind: transport");
    expect(report).toContain("scrollFromPx: 0");
    expect(report).toContain("scrollToPx: 750");
  });
});
