/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import {
  buildAgentTestingDump,
  buildAgentTestingDumpFilename,
  downloadAgentTestingDump,
} from "@/app/shell/agent-testing/agentTestingDump";

describe("buildAgentTestingDump lean-rich", () => {
  it("includes sessionKind, code, agentPrompt, compact log for agent parse", () => {
    const dump = buildAgentTestingDump({
      reason: "alarm",
      title: "AGENT TESTING",
      elapsedMs: 1234,
      gateMode: "agent",
      capturePaused: true,
      code: "ALARM_SEQUENCE_MISMATCH",
      agentPrompt: "Investigate sequence mismatch — check diagSnapshot.",
      log: [
        {
          atMs: 1,
          timeLabel: "12:00:00",
          label: "Agent prompt: Does Book look right?",
          outcome: "ok",
          kind: "agent-prompt",
        },
        {
          atMs: 2,
          timeLabel: "12:00:01",
          label: "Reply: yes",
          outcome: "ok",
          kind: "user-message",
        },
      ],
      timeline: [{ key: "book-now", outcome: "fail" }],
      poSignal: {
        type: "alarm",
        code: "ALARM_SEQUENCE_MISMATCH",
        at: Date.now(),
        beat: "b1",
        screen: "pdp",
        atIso: "2026-07-20T12:00:00.000Z",
        note: "bubbles",
      },
    });

    expect(dump.sessionKind).toBe("agent");
    expect(dump.gateMode).toBe("agent");
    expect(dump.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(dump.agentPrompt).toMatch(/Investigate/);
    expect(dump.capturePaused).toBe(true);
    expect(dump.elapsedMs).toBe(1234);
    expect(dump.log).toHaveLength(2);
    expect(dump.log[0]).toMatchObject({
      kind: "agent-prompt",
      label: expect.stringContaining("Book"),
      outcome: "ok",
    });
    expect(dump.poSignal?.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(dump.timeline?.[0]?.key).toBe("book-now");
    // Compact JSON stays lean (no pretty indent when downloaded — structure only here)
    const json = JSON.stringify(dump);
    expect(json.length).toBeLessThan(50_000);
    expect(json).toContain('"sessionKind":"agent"');
    expect(json).toContain('"agentPrompt"');
  });

  it("defaults code from reason and aliases sessionKind", () => {
    const dump = buildAgentTestingDump({
      reason: "manual",
      title: "MANUAL TEST",
      elapsedMs: 0,
      gateMode: "manual",
      log: [],
    });
    expect(dump.sessionKind).toBe("manual");
    expect(dump.code).toBeUndefined();
    expect(dump.poSignal).toBeNull();
  });

  it("names Save Log files by session kind (not reason=manual)", () => {
    expect(
      buildAgentTestingDumpFilename({
        reason: "manual",
        sessionKind: "manual",
        atIso: "2026-07-21T04:32:49.874Z",
      })
    ).toBe("qa-manual-2026-07-21T04-32-49-874Z.json");
    expect(
      buildAgentTestingDumpFilename({
        reason: "manual",
        sessionKind: "agent",
        atIso: "2026-07-21T04:32:49.874Z",
      })
    ).toBe("qa-agent-2026-07-21T04-32-49-874Z.json");
    expect(
      buildAgentTestingDumpFilename({
        reason: "alarm",
        sessionKind: "manual",
        atIso: "2026-07-21T04:32:49.874Z",
      })
    ).toBe("qa-manual-alarm-2026-07-21T04-32-49-874Z.json");
  });

  it("marks ephemeral download anchor as capture-ignore", () => {
    const appended: Element[] = [];
    const orig = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
      if (node instanceof Element) appended.push(node);
      return orig(node);
    });
    const dump = buildAgentTestingDump({
      reason: "manual",
      title: "MANUAL TEST",
      elapsedMs: 0,
      gateMode: "manual",
      log: [],
    });
    expect(downloadAgentTestingDump(dump)).toBe(true);
    const a = appended.find((el) => el.tagName === "A");
    expect(a?.getAttribute("data-studio-agent-testing-ignore")).toBe("true");
    vi.restoreAllMocks();
  });
});
