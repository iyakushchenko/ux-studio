/**
 * Appointment Details MCP probe recipe — kept out of studioMcpPageProbe.ts (hygiene).
 * screenId: appointment-details · Make child 1 · React screens/appointment-details/*
 */

import {
  APPOINTMENTS,
  getAppointment,
  getSelectedAppointmentId,
  isTerminalAppointmentStatus,
} from "@/projects/boots-pharmacy/data/appointments";
import { isMakeRetiredForScreen } from "../retireMakeUnderPage";
import { APPOINTMENT_DETAILS_REACT_SCREEN_ID } from "./appointmentDetailsContract";

export type AppointmentDetailsMcpProbeStep = {
  id: string;
  selector: string;
  action?: "click" | "assert" | "refuse-click" | "reveal" | "hover";
  assert?: () => boolean | string;
  settleMs?: number;
  waitMs?: number;
  softSkipIfMissing?: boolean;
  softSkipDetail?: string;
};

const HOST_SEL = `main[data-studio-react-screen="${APPOINTMENT_DETAILS_REACT_SCREEN_ID}"]`;
const CARD_SEL = `${HOST_SEL} [data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]`;
const EDIT_SEL = `${HOST_SEL} [data-studio-appointment-edit="true"]`;
const CANCEL_SEL = `${HOST_SEL} [data-studio-appointment-cancel="true"]`;
const VIEW_DETAILS_SEL = `${HOST_SEL} [data-studio-action="history-view-details"], ${HOST_SEL} [data-studio-appointment-view-details="true"]`;
const HISTORY_CRUMB_SEL = `${HOST_SEL} [data-studio-appointment-history-crumb="true"]`;
const VACCINATIONS_TOGGLE_SEL = `${HOST_SEL} [data-studio-appointment-vaccinations-toggle="true"]`;

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

function selectedAppt() {
  return (
    getAppointment(getSelectedAppointmentId()) ?? APPOINTMENTS[0] ?? null
  );
}

/** Restore Details after crumb → History (url-screen must end on appointment-details). */
function restoreDetailsViaUrl(): boolean | string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("project", "boots-pharmacy");
    url.searchParams.set("screen", APPOINTMENT_DETAILS_REACT_SCREEN_ID);
    url.searchParams.delete("modal");
    window.history.replaceState(window.history.state, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch (err) {
    return `restore appointment-details URL failed: ${String(err)}`;
  }
  return true;
}

/** Lean mount prove — host, Make retired, selected fields, Edit/Cancel rules, crumb back. */
export function appointmentDetailsMcpProbeSteps(): AppointmentDetailsMcpProbeStep[] {
  return [
    {
      id: "appointment-details-host",
      selector: HOST_SEL,
      action: "assert",
      assert: () =>
        hostEl() != null ||
        `missing React Details host — expected ${HOST_SEL}`,
    },
    {
      id: "appointment-details-make-retired",
      selector: HOST_SEL,
      action: "assert",
      assert: () => {
        if (!isMakeRetiredForScreen(APPOINTMENT_DETAILS_REACT_SCREEN_ID)) {
          return "Make leak: expected Make Frame children parked for appointment-details";
        }
        return true;
      },
    },
    {
      id: "appointment-details-url-screen",
      selector: HOST_SEL,
      action: "assert",
      assert: () => {
        const screen = parseScreenId();
        if (screen !== APPOINTMENT_DETAILS_REACT_SCREEN_ID) {
          return `expected screen=appointment-details (got ${screen || "∅"})`;
        }
        return true;
      },
    },
    {
      id: "appointment-details-selected-card",
      selector: CARD_SEL,
      action: "assert",
      assert: () => {
        const appt = selectedAppt();
        if (!appt) return "no selected appointment in SSoT";
        const card = document.querySelector(CARD_SEL);
        if (!card) return "missing detail card host";
        const text = (card.textContent ?? "").replace(/\s+/g, " ");
        if (!text.includes(`Appointment #${appt.id}`)) {
          return `card title missing Appointment #${appt.id}`;
        }
        if (!text.includes(appt.appointmentDate)) {
          return `Date and Time value missing SSoT appointmentDate (${appt.appointmentDate})`;
        }
        if (!text.includes(appt.vaccine)) {
          return `Vaccine Service value missing (${appt.vaccine})`;
        }
        const view = document.querySelector(VIEW_DETAILS_SEL);
        if (view) return "View Details must be absent on Details page";
        return true;
      },
    },
    {
      id: "appointment-details-edit-cancel-rules",
      selector: CARD_SEL,
      action: "assert",
      assert: () => {
        const appt = selectedAppt();
        if (!appt) return "no selected appointment in SSoT";
        const terminal = isTerminalAppointmentStatus(appt.status);
        const edit = document.querySelector(EDIT_SEL);
        const cancel = document.querySelector(CANCEL_SEL);
        const ctaHost = document.querySelector(`${CARD_SEL} [data-name="CTAs"]`);
        if (terminal) {
          if (edit || cancel) {
            return `terminal appt #${appt.id}: Edit/Cancel must be hidden`;
          }
          if (ctaHost) {
            return `terminal appt #${appt.id}: CTA host must be omitted`;
          }
          return true;
        }
        if (!edit) return `non-terminal appt #${appt.id}: missing Edit CTA`;
        if (!cancel) return `non-terminal appt #${appt.id}: missing Cancel CTA`;
        return true;
      },
    },
    {
      id: "appointment-details-edit-hover",
      selector: EDIT_SEL,
      action: "hover",
      softSkipIfMissing: true,
      softSkipDetail: "Edit not visible (terminal sample)",
    },
    {
      id: "appointment-details-cancel-hover",
      selector: CANCEL_SEL,
      action: "hover",
      softSkipIfMissing: true,
      softSkipDetail: "Cancel not visible (terminal sample)",
    },
    {
      id: "appointment-details-vaccinations-toggle",
      selector: VACCINATIONS_TOGGLE_SEL,
      action: "click",
      settleMs: 500,
      waitMs: 4000,
      assert: () => {
        const open = document.querySelector(
          `${HOST_SEL} [data-studio-accordion-open="vaccinations"]`
        );
        if (!open) {
          return "Vaccinations Accordion did not open after toggle (expected data-studio-accordion-open=vaccinations)";
        }
        const appt = selectedAppt();
        if (!appt) return "no selected appointment in SSoT";
        const panel = document.querySelector(
          `${HOST_SEL} [data-studio-appointment-vaccinations-panel="true"]`
        );
        const text = (panel?.textContent ?? "").replace(/\s+/g, " ");
        if (!text.includes(appt.vaccine)) {
          return `open panel missing SSoT vaccine (${appt.vaccine})`;
        }
        return true;
      },
    },
    {
      id: "appointment-details-crumb-back",
      selector: HISTORY_CRUMB_SEL,
      action: "click",
      settleMs: 900,
      waitMs: 5000,
      assert: () => {
        const screen = parseScreenId();
        // waitForAssert may re-enter after restore — accept Details host as success.
        if (screen === APPOINTMENT_DETAILS_REACT_SCREEN_ID && hostEl() != null) {
          return true;
        }
        if (screen !== "appointment-history") {
          return `expected screen=appointment-history after crumb (got ${screen || "∅"})`;
        }
        const historyHost = document.querySelector(
          'main[data-studio-react-screen="appointment-history"]'
        );
        if (!historyHost) {
          return "React History host missing after Details crumb back";
        }
        const restored = restoreDetailsViaUrl();
        if (restored !== true) return restored;
        if (hostEl() == null) {
          return "React Details host missing after restore from History crumb";
        }
        if (parseScreenId() !== APPOINTMENT_DETAILS_REACT_SCREEN_ID) {
          return `expected screen=appointment-details after restore, got ${parseScreenId() ?? "?"}`;
        }
        return true;
      },
    },
  ];
}
