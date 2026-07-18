import type { StudioTouchpointEntry } from "@/projects/types";

/** Popup touchpoints inserted after specific beats — Boots Pharmacy journeys. */
export const BOOTS_PHARMACY_POPUP_TOUCHPOINTS: Record<
  string,
  Record<string, StudioTouchpointEntry[]>
> = {
  "traditional-cjm": {
    "choose-location": [
      { key: "popup:availability:list", label: "Choose pharmacy" },
    ],
  },
};
