import type { AgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingTypes";
import {
  getControlPanelSnapshot,
  type ControlPanelSnapshot,
} from "@/app/shell/controlPanelLog";

function pickString(
  snap: ControlPanelSnapshot | null | undefined,
  keys: string[]
): string | undefined {
  if (!snap) return undefined;
  for (const key of keys) {
    const v = snap[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

/** Pull useful control-panel / playback snapshot into one sitrep line. */
export function readAgentTestingSitrep(): AgentTestingSitrep {
  let snap: ControlPanelSnapshot | null = null;
  try {
    snap = getControlPanelSnapshot();
  } catch {
    snap = null;
  }

  const mode =
    pickString(snap, ["orchestraModeId", "mode", "playbackMode"]) ?? undefined;
  const cjm =
    pickString(snap, ["journeyId", "cjm", "journeyMode"]) ??
    (snap?.hubOpen === true ? "hub" : undefined);
  const experience =
    pickString(snap, ["personaId", "experience", "orchestraModeId"]) ??
    undefined;
  const screenId = pickString(snap, ["screenId", "screen"]) ?? undefined;
  const beatId = pickString(snap, ["beatId", "beatLabel"]) ?? undefined;
  const touchpointKey =
    pickString(snap, ["touchpointKey", "touchpointLabel"]) ?? undefined;

  let counter: string | undefined;
  const beatIndex = snap?.beatIndex;
  const beatCount = snap?.beatCount;
  if (
    typeof beatIndex === "number" &&
    typeof beatCount === "number" &&
    Number.isFinite(beatIndex) &&
    Number.isFinite(beatCount)
  ) {
    counter = `${beatIndex + 1}/${beatCount}`;
  } else {
    counter = pickString(snap, ["scenarioProgress", "counter"]);
  }

  const parts = [
    mode ? `mode ${mode}` : null,
    cjm ? `cjm ${cjm}` : null,
    experience && experience !== mode ? `exp ${experience}` : null,
    screenId ? `screen ${screenId}` : null,
    counter ? `beat ${counter}` : null,
    beatId ? beatId : null,
    touchpointKey ? `tp ${touchpointKey}` : null,
  ].filter(Boolean);

  return {
    mode,
    cjm,
    experience,
    screenId,
    beat: beatId,
    counter,
    touchpointKey,
    line: parts.length > 0 ? parts.join(" · ") : "sitrep — waiting for control panel",
  };
}
