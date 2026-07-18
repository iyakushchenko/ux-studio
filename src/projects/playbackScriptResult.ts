/** Result of a journey playback script — `step` pinpoints the failing action for diagnostics. */
export type PlaybackScriptResult =
  | { ok: true }
  | { ok: false; step: string };

export function scriptOk(): PlaybackScriptResult {
  return { ok: true };
}

export function scriptFail(step: string): PlaybackScriptResult {
  return { ok: false, step };
}

export function scriptAborted(): PlaybackScriptResult {
  return { ok: false, step: "playback aborted" };
}

export function isScriptOk(result: PlaybackScriptResult): boolean {
  return result.ok;
}

export function scriptFailureStep(result: PlaybackScriptResult): string | undefined {
  return result.ok ? undefined : result.step;
}

export function isPlaybackAbortFailure(step?: string): boolean {
  return (
    step === scriptAborted().step ||
    step === "playback aborted" ||
    (step != null && step.endsWith(" script aborted"))
  );
}

export function fromBool(ok: boolean, failStep: string): PlaybackScriptResult {
  return ok ? scriptOk() : scriptFail(failStep);
}
