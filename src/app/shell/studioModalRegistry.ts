/**
 * Central Boots / Studio blocking-dialog registry.
 *
 * Every lightbox must:
 *  1. Appear here with a modal id + URL sync helpers
 *  2. Stamp `data-studio-modal="<id>"` on the mount
 *  3. Open/close only via registered helpers (URL sync via useStudioUrlSync)
 *
 * Felony / parity ratchet: npm test fails if a known modal is missing,
 * lacks urlSync / helpers, or App syncs only choose-pharmacy.
 */

import {
  REGISTERED_OVERLAY_MODAL_IDS,
  STUDIO_MODAL,
  type StudioModalId,
} from "@/app/shell/studioModalGuard";

/** Wire flags that drive `&modal=` (topmost wins). */
export type StudioModalOpenFlags = {
  availabilityOpen?: boolean;
  quickViewOpen?: boolean;
  loginPopupOpen?: boolean;
  vaccinePickerOpen?: boolean;
  recipientPickerOpen?: boolean;
};

export type StudioModalRegistryEntry = {
  id: StudioModalId;
  /** Address-bar sync required — felony if false/missing. */
  urlSync: true;
  /** Registered open helper symbol (wire / App must call this). */
  openHelper: string;
  /** Registered close helper symbol. */
  closeHelper: string;
  /** ProjectWireApi boolean that means this modal is open. */
  openFlag: keyof StudioModalOpenFlags;
  /** Source mount that must stamp data-studio-modal. */
  mountRel: string;
  /** Human label for docs / sitrep. */
  label: string;
};

/**
 * Literal modal ids for gates / docs (must match STUDIO_MODAL + REGISTERED_OVERLAY_MODAL_IDS).
 * Quoted strings are intentional — `check:felonies` / ratchet scan this list.
 */
export const STUDIO_MODAL_REGISTRY_IDS = [
  "choose-pharmacy",
  "quick-view",
  "login",
  "vaccine-picker",
  "recipient-picker",
] as const satisfies readonly StudioModalId[];

/**
 * Canonical registry — keep in sync with STUDIO_MODAL + DOM mounts.
 * URL priority: later list order = lower priority; see STUDIO_MODAL_URL_PRIORITY.
 */
export const STUDIO_MODAL_REGISTRY: readonly StudioModalRegistryEntry[] = [
  {
    id: STUDIO_MODAL.choosePharmacy,
    urlSync: true,
    openHelper: "openAvailabilityTool",
    closeHelper: "closeAvailabilityTool",
    openFlag: "availabilityOpen",
    mountRel: "src/projects/boots-pharmacy/overlays/AvailabilityTool.tsx",
    label: "Choose Pharmacy",
  },
  {
    id: STUDIO_MODAL.quickView,
    urlSync: true,
    openHelper: "openQuickView",
    closeHelper: "closeQuickView",
    openFlag: "quickViewOpen",
    mountRel: "src/projects/boots-pharmacy/popups/QuickViewPopup.tsx",
    label: "Quick View",
  },
  {
    id: STUDIO_MODAL.login,
    urlSync: true,
    openHelper: "openLoginPopup",
    closeHelper: "closeLoginPopup",
    openFlag: "loginPopupOpen",
    mountRel: "src/projects/boots-pharmacy/popups/LoginPopup.tsx",
    label: "Login",
  },
  {
    id: STUDIO_MODAL.vaccinePicker,
    urlSync: true,
    openHelper: "openVaccinePicker",
    closeHelper: "closeVaccinePicker",
    openFlag: "vaccinePickerOpen",
    mountRel: "src/projects/boots-pharmacy/popups/VaccinePickerPopup.tsx",
    label: "Vaccine picker",
  },
  {
    id: STUDIO_MODAL.recipientPicker,
    urlSync: true,
    openHelper: "openRecipientPicker",
    closeHelper: "closeRecipientPicker",
    openFlag: "recipientPickerOpen",
    mountRel: "src/projects/boots-pharmacy/popups/RecipientPickerPopup.tsx",
    label: "Recipient picker",
  },
] as const;

/**
 * Topmost → URL when multiple dialogs are open (login over Quick View, etc.).
 */
export const STUDIO_MODAL_URL_PRIORITY: readonly StudioModalId[] = [
  STUDIO_MODAL.login,
  STUDIO_MODAL.quickView,
  STUDIO_MODAL.vaccinePicker,
  STUDIO_MODAL.recipientPicker,
  STUDIO_MODAL.choosePharmacy,
];

const ENTRY_BY_ID = new Map(
  STUDIO_MODAL_REGISTRY.map((entry) => [entry.id, entry])
);

export function getStudioModalRegistryEntry(
  id: string | undefined
): StudioModalRegistryEntry | undefined {
  if (!id) return undefined;
  return ENTRY_BY_ID.get(id as StudioModalId);
}

/** Resolve `&modal=` id from live wire flags (topmost wins). */
export function resolveStudioModalIdFromFlags(
  flags: StudioModalOpenFlags | null | undefined
): StudioModalId | undefined {
  if (!flags) return undefined;
  for (const id of STUDIO_MODAL_URL_PRIORITY) {
    const entry = ENTRY_BY_ID.get(id);
    if (entry && flags[entry.openFlag]) return id;
  }
  return undefined;
}

/** Controllers the wire exposes for URL / replay apply. */
export type StudioModalWireControllers = {
  openAvailabilityTool: (intent?: unknown) => void;
  closeAvailabilityTool: () => void;
  openQuickView: () => void;
  closeQuickView: () => void;
  openLoginPopup: (tab?: "signin" | "create") => void;
  closeLoginPopup: () => void;
  openVaccinePicker: () => void;
  closeVaccinePicker: () => void;
  openRecipientPicker: () => void;
  closeRecipientPicker: () => void;
  closeAllPopups: () => void;
};

/**
 * Open/close concept lightboxes from URL / popstate / recording replay.
 * `undefined` / unknown → dismiss all registered modals.
 */
export function applyStudioModalFromUrl(
  modalId: string | undefined,
  wire: StudioModalWireControllers | null | undefined
): void {
  if (!wire) return;
  const id = modalId as StudioModalId | undefined;
  if (!id || !ENTRY_BY_ID.has(id)) {
    wire.closeAllPopups();
    return;
  }
  switch (id) {
    case STUDIO_MODAL.choosePharmacy:
      wire.closeQuickView();
      wire.closeLoginPopup();
      wire.closeVaccinePicker();
      wire.closeRecipientPicker();
      wire.openAvailabilityTool({ step: "list", query: "London", pickLocation: true });
      break;
    case STUDIO_MODAL.quickView:
      wire.closeAvailabilityTool();
      wire.closeLoginPopup();
      wire.closeVaccinePicker();
      wire.closeRecipientPicker();
      wire.openQuickView();
      break;
    case STUDIO_MODAL.login:
      wire.closeAvailabilityTool();
      wire.closeVaccinePicker();
      wire.closeRecipientPicker();
      // Keep Quick View under login when both were stacked; open login on top.
      wire.openLoginPopup("signin");
      break;
    case STUDIO_MODAL.vaccinePicker:
      wire.closeAvailabilityTool();
      wire.closeQuickView();
      wire.closeLoginPopup();
      wire.closeRecipientPicker();
      wire.openVaccinePicker();
      break;
    case STUDIO_MODAL.recipientPicker:
      wire.closeAvailabilityTool();
      wire.closeQuickView();
      wire.closeLoginPopup();
      wire.closeVaccinePicker();
      wire.openRecipientPicker();
      break;
    default:
      wire.closeAllPopups();
  }
}

/** Runtime assert: registry covers every registered overlay id. */
export function assertStudioModalRegistryComplete(): void {
  for (const id of REGISTERED_OVERLAY_MODAL_IDS) {
    const entry = ENTRY_BY_ID.get(id);
    if (!entry) {
      throw new Error(`STUDIO_MODAL_REGISTRY missing overlay id "${id}"`);
    }
    if (entry.urlSync !== true) {
      throw new Error(`STUDIO_MODAL_REGISTRY "${id}" must set urlSync: true`);
    }
    if (!entry.openHelper || !entry.closeHelper) {
      throw new Error(`STUDIO_MODAL_REGISTRY "${id}" missing open/close helpers`);
    }
  }
  for (const id of STUDIO_MODAL_REGISTRY_IDS) {
    if (!ENTRY_BY_ID.has(id)) {
      throw new Error(`STUDIO_MODAL_REGISTRY_IDS lists "${id}" but registry has no entry`);
    }
  }
  if (STUDIO_MODAL_REGISTRY_IDS.length !== STUDIO_MODAL_REGISTRY.length) {
    throw new Error(
      "STUDIO_MODAL_REGISTRY_IDS length must match STUDIO_MODAL_REGISTRY"
    );
  }
}
