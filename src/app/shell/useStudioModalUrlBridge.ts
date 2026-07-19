import { useCallback, useEffect, type MutableRefObject } from "react";
import {
  applyStudioModalFromUrl,
  resolveStudioModalIdFromFlags,
  type StudioModalOpenFlags,
} from "@/app/shell/studioModalRegistry";
import { parseStudioUrl } from "@/app/shell/studioUrl";
import type { ProjectWireApi } from "@/projects/types";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";

export function studioModalFlagsFromWire(
  wire: Pick<
    ProjectWireApi,
    | "availabilityOpen"
    | "quickViewOpen"
    | "loginPopupOpen"
    | "vaccinePickerOpen"
    | "recipientPickerOpen"
  > | null | undefined
): StudioModalOpenFlags {
  return {
    availabilityOpen: wire?.availabilityOpen,
    quickViewOpen: wire?.quickViewOpen,
    loginPopupOpen: wire?.loginPopupOpen,
    vaccinePickerOpen: wire?.vaccinePickerOpen,
    recipientPickerOpen: wire?.recipientPickerOpen,
  };
}

type Options = {
  wireTick: number;
  wireApiRef: MutableRefObject<ProjectWireApi | null>;
  openAvailabilityToolRef: MutableRefObject<(intent?: AvailOpenIntent) => void>;
  closeAvailabilityToolRef: MutableRefObject<() => void>;
  /** Default intent when pre-wire fallback opens Choose Pharmacy. */
  pickListIntent: AvailOpenIntent;
};

/**
 * Derives `&modal=` from wire flags + apply helper for URL / popstate / deep-link.
 */
export function useStudioModalUrlBridge(options: Options): {
  studioModalId: string | undefined;
  applyModalFromUrl: (modalId: string | undefined) => void;
} {
  const {
    wireTick,
    wireApiRef,
    openAvailabilityToolRef,
    closeAvailabilityToolRef,
    pickListIntent,
  } = options;

  const wireForModal = wireTick >= 0 ? wireApiRef.current : null;
  const studioModalId = resolveStudioModalIdFromFlags(
    studioModalFlagsFromWire(wireForModal)
  );

  const applyModalFromUrl = useCallback(
    (modalId: string | undefined) => {
      const wire = wireApiRef.current;
      if (wire?.applyStudioModal) {
        wire.applyStudioModal(modalId);
        return;
      }
      applyStudioModalFromUrl(modalId, {
        openAvailabilityTool: (intent) =>
          openAvailabilityToolRef.current(
            (intent as AvailOpenIntent | undefined) ?? pickListIntent
          ),
        closeAvailabilityTool: () => closeAvailabilityToolRef.current(),
        openQuickView: () => undefined,
        closeQuickView: () => undefined,
        openLoginPopup: () => undefined,
        closeLoginPopup: () => undefined,
        openVaccinePicker: () => undefined,
        closeVaccinePicker: () => undefined,
        openRecipientPicker: () => undefined,
        closeRecipientPicker: () => undefined,
        closeAllPopups: () => {
          closeAvailabilityToolRef.current();
          wireApiRef.current?.closeAllPopups();
        },
      });
    },
    [
      wireApiRef,
      openAvailabilityToolRef,
      closeAvailabilityToolRef,
      pickListIntent,
    ]
  );

  // Deep-link / boot may apply modal before Boots wire mounts — re-open when ready.
  // Only open from URL → live (never close here: that races open→URL write).
  useEffect(() => {
    const wire = wireApiRef.current;
    if (!wire) return;
    const modalId = parseStudioUrl().modalId;
    if (!modalId) return;
    const live = resolveStudioModalIdFromFlags(studioModalFlagsFromWire(wire));
    if (modalId !== live) {
      applyModalFromUrl(modalId);
    }
  }, [wireTick, applyModalFromUrl, wireApiRef]);

  return { studioModalId, applyModalFromUrl };
}
