/** Sarah's saved pharmacy locations — persisted like vaccine wishlist. */
import { AVAIL_STORES } from "@/projects/boots-pharmacy/data/availStores";

const SAVED_LOCATIONS_KEY = "proto-saved-locations";

export const SAVED_LOCATIONS_CHANGE_EVENT = "proto-saved-locations-change";

/** Demo default — Covent Garden in Sarah's Locations List. */
export const DEFAULT_SAVED_LOCATION_ID = "covent";

let savedLocationsSet: Set<string> = new Set();

function loadSavedLocations(): void {
  try {
    const raw = localStorage.getItem(SAVED_LOCATIONS_KEY);
    if (raw) savedLocationsSet = new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
}

function saveSavedLocations(): void {
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify([...savedLocationsSet]));
}

function notifySavedLocationsChange(): void {
  document.dispatchEvent(new CustomEvent(SAVED_LOCATIONS_CHANGE_EVENT));
}

export function getSavedLocationsCount(): number {
  return savedLocationsSet.size;
}

/** Account location may bypass booking Step 1 only while it is still a valid store. */
export function hasUsableSavedLocation(): boolean {
  return AVAIL_STORES.some(
    (store) => store.hasSlots && savedLocationsSet.has(store.id)
  );
}

export function isInSavedLocations(id: string): boolean {
  return savedLocationsSet.has(id);
}

export function toggleSavedLocation(id: string): boolean {
  const adding = !savedLocationsSet.has(id);
  if (adding) savedLocationsSet.add(id);
  else savedLocationsSet.delete(id);
  saveSavedLocations();
  notifySavedLocationsChange();
  return savedLocationsSet.has(id);
}

loadSavedLocations();
if (savedLocationsSet.size === 0) {
  savedLocationsSet.add(DEFAULT_SAVED_LOCATION_ID);
  saveSavedLocations();
}
