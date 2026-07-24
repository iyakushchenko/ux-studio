/**
 * Appointment History MCP probe recipe — kept out of studioMcpPageProbe.ts (hygiene).
 * screenId: appointment-history · Legacy child 2 · React screens/appointment-history/*
 */

import { APPOINTMENT_COUNT } from "@/projects/boots-pharmacy/data/appointments";
import { isLegacyRetiredForScreen } from "../retireLegacyUnderPage";
import { APPOINTMENT_HISTORY_REACT_SCREEN_ID } from "./appointmentHistoryContract";

export type AppointmentHistoryMcpProbeStep = {
  id: string;
  selector: string;
  action?: "click" | "assert" | "refuse-click" | "reveal" | "hover";
  assert?: () => boolean | string;
  settleMs?: number;
  waitMs?: number;
  softSkipIfMissing?: boolean;
  softSkipDetail?: string;
};

/** Prefer body landmark; fall back if class rename mid-wave. */
const HOST_SEL = `main[data-studio-react-screen="${APPOINTMENT_HISTORY_REACT_SCREEN_ID}"]`;
const VIEW_DETAILS_SEL =
  '[data-studio-action="history-view-details"], [data-studio-appointment-view-details="true"]';

function parseScreenId(): string | null {
  try {
    return new URL(window.location.href).searchParams.get("screen");
  } catch {
    return null;
  }
}

function hostEl(): Element | null {
  return document.querySelector(HOST_SEL);
}

/** Restore History after View Details → Details (url-screen must end on appointment-history). */
function restoreHistoryViaUrl(): boolean | string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("project", "boots-pharmacy");
    url.searchParams.set("screen", APPOINTMENT_HISTORY_REACT_SCREEN_ID);
    url.searchParams.delete("modal");
    window.history.replaceState(window.history.state, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch (err) {
    return `restore appointment-history URL failed: ${String(err)}`;
  }
  return true;
}

/** Lean mount prove — host, Legacy retired, View Details, Details handoff + restore. */
export function appointmentHistoryMcpProbeSteps(): AppointmentHistoryMcpProbeStep[] {
  return [
    {
      id: "appointment-history-host",
      selector: HOST_SEL,
      action: "assert",
      assert: () =>
        hostEl() != null ||
        `missing React History host — expected ${HOST_SEL}`,
    },
    {
      id: "appointment-history-legacy-retired",
      selector: HOST_SEL,
      action: "assert",
      assert: () => {
        if (!isLegacyRetiredForScreen(APPOINTMENT_HISTORY_REACT_SCREEN_ID)) {
          return "Legacy leak: expected Legacy Frame children parked for appointment-history";
        }
        return true;
      },
    },
    {
      id: "appointment-history-view-details-count",
      selector: `${HOST_SEL} ${VIEW_DETAILS_SEL}`,
      action: "assert",
      assert: () => {
        const btns = document.querySelectorAll(
          `${HOST_SEL} ${VIEW_DETAILS_SEL}`
        );
        if (btns.length !== APPOINTMENT_COUNT) {
          return `expected ${APPOINTMENT_COUNT} View Details CTAs (got ${btns.length})`;
        }
        return true;
      },
    },
    {
      id: "appointment-history-view-details-hover",
      selector: `${HOST_SEL} ${VIEW_DETAILS_SEL}`,
      action: "hover",
      softSkipIfMissing: true,
      softSkipDetail: "View Details not visible",
    },
    {
      id: "appointment-history-view-details-click",
      selector: `${HOST_SEL} ${VIEW_DETAILS_SEL}`,
      action: "click",
      settleMs: 400,
      waitMs: 2500,
      assert: () => {
        const screen = parseScreenId();
        if (screen !== "appointment-details") {
          return `expected screen=appointment-details after View Details (got ${screen || "∅"})`;
        }
        return true;
      },
    },
    {
      id: "appointment-history-return-after-details",
      selector: "body",
      action: "assert",
      settleMs: 900,
      waitMs: 5000,
      assert: () => {
        const restored = restoreHistoryViaUrl();
        if (restored !== true) return restored;
        if (hostEl() == null) {
          return "React History host missing after restore from Details";
        }
        if (parseScreenId() !== APPOINTMENT_HISTORY_REACT_SCREEN_ID) {
          return `expected screen=appointment-history after restore, got ${parseScreenId() ?? "?"}`;
        }
        return true;
      },
    },
  ];
}
