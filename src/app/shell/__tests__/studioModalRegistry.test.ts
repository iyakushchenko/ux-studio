import { describe, expect, it, vi } from "vitest";
import { STUDIO_MODAL } from "@/app/shell/studioModalGuard";
import {
  STUDIO_MODAL_REGISTRY,
  assertStudioModalRegistryComplete,
  applyStudioModalFromUrl,
  getStudioModalRegistryEntry,
  resolveStudioModalIdFromFlags,
} from "@/app/shell/studioModalRegistry";
import { parseStudioUrl, serializeStudioUrl } from "@/app/shell/studioUrl";

function mockWire() {
  return {
    openAvailabilityTool: vi.fn(),
    closeAvailabilityTool: vi.fn(),
    openQuickView: vi.fn(),
    closeQuickView: vi.fn(),
    openLoginPopup: vi.fn(),
    closeLoginPopup: vi.fn(),
    openVaccinePicker: vi.fn(),
    closeVaccinePicker: vi.fn(),
    openRecipientPicker: vi.fn(),
    closeRecipientPicker: vi.fn(),
    closeAllPopups: vi.fn(),
  };
}

describe("studioModalRegistry", () => {
  it("lists every Boots/Studio dialog with urlSync + helpers", () => {
    assertStudioModalRegistryComplete();
    const ids = STUDIO_MODAL_REGISTRY.map((e) => e.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        STUDIO_MODAL.choosePharmacy,
        STUDIO_MODAL.quickView,
        STUDIO_MODAL.login,
        STUDIO_MODAL.vaccinePicker,
        STUDIO_MODAL.recipientPicker,
      ])
    );
    for (const entry of STUDIO_MODAL_REGISTRY) {
      expect(entry.urlSync).toBe(true);
      expect(entry.openHelper.length).toBeGreaterThan(0);
      expect(entry.closeHelper.length).toBeGreaterThan(0);
      expect(entry.mountRel).toMatch(/boots-pharmacy/);
      expect(getStudioModalRegistryEntry(entry.id)?.id).toBe(entry.id);
    }
  });

  it("resolves topmost modal for URL (login over quick-view)", () => {
    expect(
      resolveStudioModalIdFromFlags({
        quickViewOpen: true,
        loginPopupOpen: true,
      })
    ).toBe(STUDIO_MODAL.login);
    expect(
      resolveStudioModalIdFromFlags({
        quickViewOpen: true,
        availabilityOpen: true,
      })
    ).toBe(STUDIO_MODAL.quickView);
    expect(
      resolveStudioModalIdFromFlags({ availabilityOpen: true })
    ).toBe(STUDIO_MODAL.choosePharmacy);
    expect(resolveStudioModalIdFromFlags({})).toBeUndefined();
  });

  it("serializes Quick View modal into studio URL", () => {
    const search = serializeStudioUrl({
      projectId: "boots-pharmacy",
      screenId: "plp",
      modalId: STUDIO_MODAL.quickView,
    });
    expect(search).toBe(
      "?project=boots-pharmacy&screen=plp&modal=quick-view"
    );
    expect(parseStudioUrl(search).modalId).toBe(STUDIO_MODAL.quickView);
    expect(parseStudioUrl("?modal=quickview").modalId).toBe(
      STUDIO_MODAL.quickView
    );
  });

  it("applyStudioModalFromUrl opens Quick View and clears others", () => {
    const wire = mockWire();
    applyStudioModalFromUrl(STUDIO_MODAL.quickView, wire);
    expect(wire.openQuickView).toHaveBeenCalledOnce();
    expect(wire.closeAvailabilityTool).toHaveBeenCalledOnce();
    expect(wire.closeLoginPopup).toHaveBeenCalledOnce();
  });

  it("applyStudioModalFromUrl(undefined) closes all popups", () => {
    const wire = mockWire();
    applyStudioModalFromUrl(undefined, wire);
    expect(wire.closeAllPopups).toHaveBeenCalledOnce();
    expect(wire.openQuickView).not.toHaveBeenCalled();
  });
});
