import type { JourneyBeatActionId, JourneyRuntime } from "@/app/orchestra/types";

export function runJourneyBeatAction(
  actionId: JourneyBeatActionId,
  runtime: JourneyRuntime
): void {
  switch (actionId) {
    case "open-availability-start":
      runtime.openAvailability();
      break;
    case "close-availability":
      runtime.closeAvailability();
      break;
    default:
      break;
  }
}
