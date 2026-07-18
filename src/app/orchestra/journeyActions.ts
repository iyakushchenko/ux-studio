import type { AvailabilityScriptId, BookScriptId, HomeScriptId, JourneyRuntime, TabScriptId } from "@/app/orchestra/types";
import { runAvailabilityScript } from "@/app/proto/protoAvailabilityPlayback";
import { runBookScript } from "@/app/proto/protoBookPlayback";
import { runSitePilotHomeScript } from "@/app/proto/protoSitePilotHomePlayback";
import { runTraditionalScript } from "@/app/proto/protoTraditionalPlayback";

export function runJourneyBeatAction(
  actionId: JourneyBeatActionId,
  runtime: JourneyRuntime
): void {
  switch (actionId) {
    case "open-availability-start":
    case "open-availability-date-chat":
      runtime.openAvailability(
        actionId === "open-availability-date-chat"
          ? { step: "date", storeId: "covent", selectedDate: { month: "June", day: 25 } }
          : undefined
      );
      break;
    case "close-availability":
      runtime.closeAvailability();
      break;
    case "apply-demo-location":
      runtime.applyDemoLocation();
      break;
    default:
      break;
  }
}

export async function runJourneyHomeScript(
  scriptId: HomeScriptId,
  options?: { skip?: boolean }
): Promise<void> {
  await runSitePilotHomeScript(scriptId, options);
}

export async function runJourneyAvailScript(
  scriptId: AvailabilityScriptId,
  options?: { skip?: boolean }
): Promise<boolean> {
  return runAvailabilityScript(scriptId, options);
}

export async function runJourneyBookScript(
  scriptId: BookScriptId,
  options?: { skip?: boolean }
): Promise<boolean> {
  return runBookScript(scriptId, options);
}

export async function runJourneyTabScript(
  scriptId: TabScriptId,
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  return runTraditionalScript(scriptId, runtime, options);
}
