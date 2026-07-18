export type AvailStore = {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: string;
  /** Demo: false → noSlots step */
  hasSlots: boolean;
};

/** London search results — matches “13 locations found” in the Availability Tool. */
export const AVAIL_STORES: AvailStore[] = [
  {
    id: "covent",
    name: "Covent Garden Long Acre",
    address: "107-115 Long Acre, WC2E 9NT, London, United Kingdom",
    phone: "02073795875",
    distance: "0.6 km",
    hasSlots: true,
  },
  {
    id: "strand",
    name: "Boots Strand",
    address: "426 Strand, London, Greater London WC2R 0QE",
    phone: "02078367225",
    distance: "1.0 km",
    hasSlots: false,
  },
  {
    id: "piccadilly",
    name: "Piccadilly Circus",
    address: "44–50 Regent Street, W1B 5RA, London, United Kingdom",
    phone: "02077346126",
    distance: "1.3 km",
    hasSlots: true,
  },
  {
    id: "oxford",
    name: "Oxford Street",
    address: "385 Oxford Street, W1C 2JS, London, United Kingdom",
    phone: "02074941931",
    distance: "1.6 km",
    hasSlots: true,
  },
  {
    id: "canary",
    name: "Canary Wharf",
    address: "15 Cabot Place, E14 4QT, London, United Kingdom",
    phone: "02075191400",
    distance: "5.1 km",
    hasSlots: true,
  },
  {
    id: "kings-cross",
    name: "King's Cross",
    address:
      "Unit 24, St Pancras International, N1C 4QL, London, United Kingdom",
    phone: "02078334512",
    distance: "2.9 km",
    hasSlots: true,
  },
  {
    id: "victoria",
    name: "Victoria Station",
    address: "111 Victoria Street, SW1E 6RA, London, United Kingdom",
    phone: "02078341422",
    distance: "1.9 km",
    hasSlots: true,
  },
  {
    id: "camden",
    name: "Camden High Street",
    address: "81 Camden High Street, NW1 7JL, London, United Kingdom",
    phone: "02074853621",
    distance: "4.0 km",
    hasSlots: true,
  },
  {
    id: "notting-hill",
    name: "Notting Hill Gate",
    address: "92 Notting Hill Gate, W11 3QA, London, United Kingdom",
    phone: "02072291641",
    distance: "4.5 km",
    hasSlots: true,
  },
  {
    id: "london-bridge",
    name: "London Bridge",
    address: "6–8 Tooley Street, SE1 2SY, London, United Kingdom",
    phone: "02074073366",
    distance: "2.6 km",
    hasSlots: true,
  },
  {
    id: "holborn",
    name: "Holborn",
    address: "151–153 High Holborn, WC1V 6LX, London, United Kingdom",
    phone: "02072421011",
    distance: "1.4 km",
    hasSlots: true,
  },
  {
    id: "westminster",
    name: "Westminster",
    address: "28 Broadway, SW1H 0DB, London, United Kingdom",
    phone: "02072227111",
    distance: "1.8 km",
    hasSlots: true,
  },
  {
    id: "shoreditch",
    name: "Shoreditch High Street",
    address: "145 Shoreditch High Street, E1 6JE, London, United Kingdom",
    phone: "02077393983",
    distance: "3.9 km",
    hasSlots: true,
  },
];

export const AVAIL_STORE_COUNT = AVAIL_STORES.length;

export function formatAvailLocationCount(count = AVAIL_STORE_COUNT): string {
  return `${count} locations found`;
}

export function findAvailStoreById(id: string): AvailStore | undefined {
  return AVAIL_STORES.find((s) => s.id === id);
}

export type DemoChosenLocation = {
  name: string;
  address: string;
  storeId: string;
};

/** Covent Garden — default demo pharmacy for CJM location emulation. */
export function getDemoChosenLocation(): DemoChosenLocation {
  const store = findAvailStoreById("covent") ?? AVAIL_STORES[0];
  return {
    name: store.name,
    address: store.address,
    storeId: store.id,
  };
}

/** Map booking / chosen-location state → Availability Tool store id. */
export function resolveAvailStoreId(chosen: {
  storeId?: string;
  name: string;
}): string {
  if (chosen.storeId && findAvailStoreById(chosen.storeId)) {
    return chosen.storeId;
  }
  const name = chosen.name.trim().toLowerCase();
  const byName = AVAIL_STORES.find((s) => s.name.toLowerCase() === name);
  if (byName) return byName.id;
  if (/covent|long acre/i.test(name)) return "covent";
  if (/strand/i.test(name)) return "strand";
  if (/piccadilly/i.test(name)) return "piccadilly";
  if (/oxford/i.test(name)) return "oxford";
  if (/canary/i.test(name)) return "canary";
  if (/king.?s cross|st pancras/i.test(name)) return "kings-cross";
  if (/victoria/i.test(name)) return "victoria";
  if (/camden/i.test(name)) return "camden";
  if (/notting/i.test(name)) return "notting-hill";
  if (/london bridge/i.test(name)) return "london-bridge";
  if (/holborn/i.test(name)) return "holborn";
  if (/westminster/i.test(name)) return "westminster";
  if (/shoreditch/i.test(name)) return "shoreditch";
  return "covent";
}
