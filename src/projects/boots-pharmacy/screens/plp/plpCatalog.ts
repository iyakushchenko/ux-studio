import {
  PLP_BUNDLE_ITEMS,
  getPlpCountryCandidates,
  type PlpBundleItem,
} from "@/projects/boots-pharmacy/data/plpListing";
import {
  STUDIO_CONTENT_LOAD_MS,
  STUDIO_ENTER_MS,
} from "@/uxds/motion";

/** Listing / refresh preloader — platform content-load interim (not a one-off). */
export const PLP_LISTING_LOAD_MS = STUDIO_CONTENT_LOAD_MS;

/**
 * Hold before an "Add to Bookmarks" click actually commits — the optimistic
 * hover/pressed state flips instantly on pointerdown; this only delays the
 * real store write so the user has time to register the state change.
 * Wrap with `playbackMs()` (@/app/shell/playbackTiming) at the call site so
 * `uxml play` / smoke fast-playback mode compresses it — never await the raw
 * constant directly.
 */
export const PLP_WISHLIST_ADD_DELAY_MS = 2000;

export type PlpListingKind = "jab" | "bundle";

export type PlpCatalogItem = {
  id: string;
  kind: PlpListingKind;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  priceNote: string;
  accent?: string;
  ages: string[];
  diseases: string[];
  regions: string[];
  countries: string[];
  searchTerms: string[];
};

export const PLP_AGE_OPTIONS = [
  "Infants under 1 year",
  "Children 2–12 years",
  "Teens & adults 13–64 years",
  "Adults 65+ years",
] as const;

export const PLP_REGION_OPTIONS = [
  "Europe",
  "South-East Asia",
  "Africa",
  "Americas",
  "Western Pacific",
  "Eastern Mediterranean",
] as const;

export const PLP_DISEASE_OPTIONS = [
  "Chickenpox",
  "COVID-19",
  "Typhoid",
  "Hepatitis A",
  "Hepatitis B",
  "Influenza",
  "Yellow Fever",
  "Rabies",
  "Meningitis",
  "Shingles",
] as const;

export const PLP_COUNTRY_OPTIONS = [
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Singapore",
  "India",
  "Kenya",
  "Tanzania",
  "France",
  "Spain",
  "Italy",
  "Germany",
  "South Africa",
] as const;

const ADULT_AGES = [
  "Children 2–12 years",
  "Teens & adults 13–64 years",
  "Adults 65+ years",
];

function jab(
  partial: Omit<PlpCatalogItem, "kind" | "priceNote"> & { priceNote?: string }
): PlpCatalogItem {
  return {
    kind: "jab",
    priceNote: partial.priceNote ?? "Price for 1 dose",
    ...partial,
  };
}

/** Concept-aligned jab catalog (React-owned; does not scrape Legacy DOM). */
export const PLP_JAB_ITEMS: PlpCatalogItem[] = [
  jab({
    id: "chickenpox",
    title: "Chickenpox",
    subtitle: "Varicella-zoster virus",
    description:
      "Chickenpox spreads easily and can cause fever, tiredness, and an itchy blister-like rash. It can be more serious in adults, pregnancy, and people with weaker immunity.",
    price: "75.00",
    accent: "Booster dose available",
    ages: ADULT_AGES,
    diseases: ["Chickenpox"],
    regions: ["Europe", "Americas"],
    countries: ["France", "Spain", "Italy", "Germany"],
    searchTerms: ["chickenpox", "varicella"],
  }),
  jab({
    id: "covid-19",
    title: "COVID-19",
    subtitle: "SARS-CoV-2 virus",
    description:
      "COVID-19 can cause respiratory illness and serious complications in higher-risk groups. Vaccination helps reduce the risk of severe disease and hospitalisation.",
    price: "99.00",
    accent: "Booster dose available",
    ages: [...ADULT_AGES, "Infants under 1 year"],
    diseases: ["COVID-19"],
    regions: ["Europe", "Americas", "Western Pacific"],
    countries: ["France", "Spain", "Italy", "Germany", "Singapore"],
    searchTerms: ["covid", "coronavirus"],
  }),
  jab({
    id: "typhoid",
    title: "Typhoid",
    subtitle: "Salmonella Typhi",
    description:
      "Typhoid is usually spread through contaminated food or water. It can cause high fever, stomach symptoms, weakness, and serious complications if untreated.",
    price: "35.00",
    accent: "Booster dose available",
    ages: ADULT_AGES,
    diseases: ["Typhoid"],
    regions: ["South-East Asia", "Africa", "Eastern Mediterranean"],
    countries: ["Thailand", "Malaysia", "Indonesia", "India", "Kenya"],
    searchTerms: ["typhoid", "travel"],
  }),
  jab({
    id: "hepatitis-a",
    title: "Hepatitis A",
    subtitle: "Hepatitis A virus",
    description:
      "Hepatitis A affects the liver and is usually spread through contaminated food or water. It is more common in some travel destinations.",
    price: "55.00",
    accent: "Course of 2 doses",
    ages: ADULT_AGES,
    diseases: ["Hepatitis A"],
    regions: ["South-East Asia", "Africa", "Americas"],
    countries: ["Thailand", "Indonesia", "Kenya", "South Africa"],
    searchTerms: ["hepatitis a", "hep a"],
  }),
  jab({
    id: "hepatitis-b",
    title: "Hepatitis B",
    subtitle: "Hepatitis B virus",
    description:
      "Hepatitis B is a viral infection of the liver. Vaccination is recommended for travellers and people at higher risk of exposure.",
    price: "45.00",
    accent: "Course of 3 doses",
    ages: [...ADULT_AGES, "Infants under 1 year"],
    diseases: ["Hepatitis B"],
    regions: ["South-East Asia", "Africa", "Eastern Mediterranean"],
    countries: ["Thailand", "Malaysia", "India", "Kenya"],
    searchTerms: ["hepatitis b", "hep b"],
  }),
  jab({
    id: "influenza",
    title: "Influenza",
    subtitle: "Seasonal flu",
    description:
      "Seasonal influenza can cause fever, cough, and severe illness in older adults and higher-risk groups. Annual vaccination is recommended.",
    price: "19.99",
    ages: [...ADULT_AGES, "Infants under 1 year", "Children 2–12 years"],
    diseases: ["Influenza"],
    regions: ["Europe", "Americas", "Western Pacific"],
    countries: ["France", "Spain", "Italy", "Germany", "Singapore"],
    searchTerms: ["flu", "influenza"],
  }),
  jab({
    id: "yellow-fever",
    title: "Yellow Fever",
    subtitle: "Yellow fever virus",
    description:
      "Yellow fever is a mosquito-borne infection. An International Certificate of Vaccination may be required for entry to some countries.",
    price: "82.00",
    accent: "Certificate eligible",
    ages: ADULT_AGES,
    diseases: ["Yellow Fever"],
    regions: ["Africa", "Americas"],
    countries: ["Kenya", "Tanzania", "South Africa"],
    searchTerms: ["yellow fever", "certificate"],
  }),
  jab({
    id: "rabies",
    title: "Rabies",
    subtitle: "Rabies virus",
    description:
      "Rabies is almost always fatal once symptoms appear. Pre-exposure vaccination is advised for travellers at risk of animal bites.",
    price: "75.00",
    accent: "Course of 3 doses",
    ages: ADULT_AGES,
    diseases: ["Rabies"],
    regions: ["South-East Asia", "Africa"],
    countries: ["Thailand", "Indonesia", "Vietnam", "Kenya", "Tanzania"],
    searchTerms: ["rabies", "animal"],
  }),
  jab({
    id: "meningitis",
    title: "Meningitis ACWY",
    subtitle: "Meningococcal disease",
    description:
      "Meningococcal ACWY vaccination is required for Hajj and Umrah and recommended for some travel and student settings.",
    price: "60.00",
    accent: "Certificate support",
    ages: ["Teens & adults 13–64 years", "Children 2–12 years"],
    diseases: ["Meningitis"],
    regions: ["Eastern Mediterranean", "Africa"],
    countries: ["Malaysia", "Indonesia", "India"],
    searchTerms: ["meningitis", "hajj", "umrah"],
  }),
  jab({
    id: "shingles",
    title: "Shingles",
    subtitle: "Herpes zoster",
    description:
      "Shingles can cause a painful rash and nerve pain. Vaccination is available for eligible adults in older age groups.",
    price: "220.00",
    ages: ["Adults 65+ years", "Teens & adults 13–64 years"],
    diseases: ["Shingles"],
    regions: ["Europe", "Americas"],
    countries: ["France", "Spain", "Italy", "Germany"],
    searchTerms: ["shingles", "zoster"],
  }),
];

function bundleToCatalog(item: PlpBundleItem, index: number): PlpCatalogItem {
  return {
    id: `bundle-${index}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    kind: "bundle",
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    price: item.price,
    priceNote: `${item.jabCount} jabs in pack`,
    accent: item.savings,
    ages: ADULT_AGES,
    diseases: [],
    regions: item.regions,
    countries: item.countries,
    searchTerms: item.searchTerms,
  };
}

export const PLP_BUNDLE_CATALOG: PlpCatalogItem[] = PLP_BUNDLE_ITEMS.map(
  bundleToCatalog
);

export type PlpFilterState = {
  showBundles: boolean;
  allAges: boolean;
  ages: string[];
  diseases: string[];
  regions: string[];
  countries: string[];
  diseaseQuery: string;
  countryQuery: string;
};

export const DEFAULT_PLP_FILTERS: PlpFilterState = {
  showBundles: false,
  allAges: true,
  ages: [],
  diseases: [],
  regions: [],
  countries: [],
  diseaseQuery: "",
  countryQuery: "",
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function togglePlpFilterValue(
  state: PlpFilterState,
  key: "ages" | "diseases" | "regions" | "countries",
  value: string
): PlpFilterState {
  const next = toggleInList(state[key], value);
  if (key === "ages") {
    return { ...state, allAges: false, ages: next };
  }
  // Legacy wire: region change rebuilds country labels and clears country checks.
  if (key === "regions") {
    return { ...state, regions: next, countries: [] };
  }
  return { ...state, [key]: next };
}


export function isPlpFiltersDirty(state: PlpFilterState): boolean {
  if (state.showBundles) return true;
  if (!state.allAges) return true;
  if (state.ages.length || state.diseases.length || state.regions.length) {
    return true;
  }
  if (state.countries.length) return true;
  if (state.diseaseQuery.trim() || state.countryQuery.trim()) return true;
  return false;
}

function matchesSelected(
  selected: string[],
  itemValues: string[],
  haystack: string
): boolean {
  if (!selected.length) return true;
  return selected.some(
    (label) =>
      itemValues.some((v) => v.toLowerCase() === label.toLowerCase()) ||
      haystack.toLowerCase().includes(label.toLowerCase())
  );
}

export function filterPlpCatalog(
  state: PlpFilterState,
  jabs: PlpCatalogItem[] = PLP_JAB_ITEMS,
  bundles: PlpCatalogItem[] = PLP_BUNDLE_CATALOG
): PlpCatalogItem[] {
  const pool = state.showBundles ? bundles : jabs;
  return pool.filter((item) => {
    const haystack = [
      item.title,
      item.subtitle,
      item.description,
      ...item.searchTerms,
      ...item.diseases,
      ...item.regions,
      ...item.countries,
    ].join(" ");

    if (!state.allAges) {
      const ageOk =
        state.ages.length === 0 ||
        state.ages.some((age) => item.ages.includes(age));
      if (!ageOk) return false;
    }

    if (!matchesSelected(state.diseases, item.diseases, haystack)) return false;
    if (!matchesSelected(state.regions, item.regions, haystack)) return false;
    if (!matchesSelected(state.countries, item.countries, haystack)) {
      return false;
    }
    return true;
  });
}

/** Legacy wire `PLP_FILTER_LIST_MAX` — disease/country typeahead cap before View all. */
export const PLP_FILTER_LIST_MAX = 10;

export function filterOptionList(
  options: readonly string[],
  query: string
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...options];
  return options.filter((label) => label.toLowerCase().includes(q));
}

/**
 * Cap filter option rows like Legacy wire (`slice(0, PLP_FILTER_LIST_MAX)`).
 * When `expanded` (View all) or searching, show the full filtered set.
 */
export function capPlpFilterOptionList(
  labels: readonly string[],
  opts: { expanded?: boolean; querying?: boolean } = {}
): string[] {
  if (opts.expanded || opts.querying) return [...labels];
  return labels.slice(0, PLP_FILTER_LIST_MAX);
}

type PlpCountFacet = "ages" | "diseases" | "regions" | "countries";

function filtersWithoutFacet(
  state: PlpFilterState,
  facet: PlpCountFacet | "type"
): PlpFilterState {
  switch (facet) {
    case "type":
      return { ...state, showBundles: false };
    case "ages":
      return { ...state, allAges: true, ages: [] };
    case "diseases":
      return { ...state, diseases: [] };
    case "regions":
      return { ...state, regions: [] };
    case "countries":
      return { ...state, countries: [] };
  }
}

function itemMatchesFacet(
  item: PlpCatalogItem,
  facet: PlpCountFacet,
  value: string
): boolean {
  const haystack = [
    item.title,
    item.subtitle,
    item.description,
    ...item.searchTerms,
    ...item.diseases,
    ...item.regions,
    ...item.countries,
  ]
    .join(" ")
    .toLowerCase();
  const key = value.toLowerCase();

  switch (facet) {
    case "ages":
      return item.ages.some((a) => a.toLowerCase() === key);
    case "diseases":
      return (
        item.diseases.some((d) => d.toLowerCase() === key) ||
        haystack.includes(key)
      );
    case "regions":
      return item.regions.some((r) => r.toLowerCase() === key);
    case "countries":
      return item.countries.some((c) => c.toLowerCase() === key);
  }
}

/**
 * Legacy filter option counters — how many listing results would match if this
 * facet value alone were applied (other facets kept; this facet cleared first).
 */
export function countPlpFacetOption(
  state: PlpFilterState,
  facet: PlpCountFacet,
  value: string,
  jabs: PlpCatalogItem[] = PLP_JAB_ITEMS,
  bundles: PlpCatalogItem[] = PLP_BUNDLE_CATALOG
): number {
  const base = filtersWithoutFacet(state, facet);
  const pool = filterPlpCatalog(base, jabs, bundles);
  return pool.filter((item) => itemMatchesFacet(item, facet, value)).length;
}

const FACET_KEYS: PlpCountFacet[] = ["ages", "diseases", "regions", "countries"];

/**
 * Legacy wire truth (`setFilterCheckboxItemState` L746–765, PLP_LEGACY_PARITY_REGISTER
 * I3c): a facet value whose leave-one-out count drops to 0 is dropped from
 * state (auto-uncheck), not just visually disabled. Caller re-runs this after
 * every filter change until it reports no change (mirrors Legacy's
 * "re-apply after clear" double-pass) — bounded, since each pass only removes
 * values, never adds them.
 */
export function dropZeroCountFacetValues(
  state: PlpFilterState,
  jabs: PlpCatalogItem[] = PLP_JAB_ITEMS,
  bundles: PlpCatalogItem[] = PLP_BUNDLE_CATALOG
): { filters: PlpFilterState; changed: boolean } {
  let next = state;
  let changed = false;
  for (const facet of FACET_KEYS) {
    const survivors = next[facet].filter(
      (value) => countPlpFacetOption(next, facet, value, jabs, bundles) > 0
    );
    if (survivors.length !== next[facet].length) {
      next = { ...next, [facet]: survivors };
      changed = true;
    }
  }
  return { filters: next, changed };
}

/**
 * Legacy `collectPlpCountryFilterLabels` — candidates from
 * `getPlpCountryCandidates(regions)`, keep score > 0, sort by availability.
 * Does not slice to `PLP_FILTER_LIST_MAX` (View all / search cap stays in UI).
 */
export function collectPlpCountryFilterLabels(
  state: PlpFilterState,
  jabs: PlpCatalogItem[] = PLP_JAB_ITEMS,
  bundles: PlpCatalogItem[] = PLP_BUNDLE_CATALOG
): string[] {
  const candidates = getPlpCountryCandidates(state.regions);
  return candidates
    .map((country) => ({
      country,
      score: countPlpFacetOption(state, "countries", country, jabs, bundles),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.country.localeCompare(b.country, "en")
    )
    .map((entry) => entry.country);
}

/** By Type radio counters (Individual jabs / Bundles). */
export function countPlpTypeOption(
  state: PlpFilterState,
  showBundles: boolean,
  jabs: PlpCatalogItem[] = PLP_JAB_ITEMS,
  bundles: PlpCatalogItem[] = PLP_BUNDLE_CATALOG
): number {
  const base = filtersWithoutFacet(state, "type");
  return filterPlpCatalog(
    { ...base, showBundles },
    jabs,
    bundles
  ).length;
}

/** Active facet chips shown in Legacy PLP results summary (removable). */
export type PlpActiveFilterChip = {
  facet: "ages" | "diseases" | "regions" | "countries";
  label: string;
};

export function collectPlpActiveFilterChips(
  state: PlpFilterState
): PlpActiveFilterChip[] {
  const chips: PlpActiveFilterChip[] = [];
  if (!state.allAges) {
    for (const label of state.ages) {
      chips.push({ facet: "ages", label });
    }
  }
  for (const label of state.diseases) {
    chips.push({ facet: "diseases", label });
  }
  for (const label of state.regions) {
    chips.push({ facet: "regions", label });
  }
  for (const label of state.countries) {
    chips.push({ facet: "countries", label });
  }
  return chips;
}

export function removePlpActiveFilterChip(
  state: PlpFilterState,
  facet: PlpActiveFilterChip["facet"],
  label: string
): PlpFilterState {
  if (facet === "ages") {
    const ages = state.ages.filter((item) => item !== label);
    return { ...state, ages, allAges: ages.length === 0 };
  }
  return {
    ...state,
    [facet]: state[facet].filter((item) => item !== label),
  };
}

/** Legacy wire copy noun for results summary. */
export function plpResultsNoun(
  state: PlpFilterState,
  visible: number
): string {
  if (state.showBundles) {
    return visible === 1 ? "bundle" : "bundles";
  }
  return visible === 1 ? "jab" : "jabs";
}
