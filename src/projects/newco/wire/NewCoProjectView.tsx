import { NewCoHomeScreen } from "@/projects/newco/screens/home/NewCoHomeScreen";
import NewCoHubViewport from "@/projects/newco/hub/HubViewport";
import type { ProjectShellBridge, ProjectWireApi } from "@/projects/types";
import type { MutableRefObject } from "react";

/**
 * NewCo — dry-run replica of one Figma page (fileKey 63KkJOcSTcbK7pgcSlcmiP,
 * node 12409:622533). Single static screen, no journeys/popups/CJM wiring —
 * intentionally out of scope for this test. Hub is NewCo's own basic wiki
 * (UXBP report content), not shared with Boots (PO, 2026-07-24).
 */
export function NewCoProjectView({
  bridge,
}: {
  bridge: ProjectShellBridge;
  apiRef?: MutableRefObject<ProjectWireApi | null>;
}) {
  const { hubOpen, go, prototypeScrollElRef, hubScrollElRef, appContentRef } =
    bridge;

  return (
    <div
      ref={appContentRef}
      className="studio-app-content flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-white"
      style={{ isolation: "isolate" }}
    >
      <div
        ref={hubScrollElRef}
        className={`proto-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full${
          hubOpen ? "" : " hidden"
        }`}
      >
        <NewCoHubViewport onGoToTab={go} />
      </div>
      <div
        ref={prototypeScrollElRef}
        className={`proto-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full${
          hubOpen ? " hidden" : ""
        }`}
      >
        <NewCoHomeScreen />
      </div>
    </div>
  );
}
