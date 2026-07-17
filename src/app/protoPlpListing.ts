import protoTrashIconSvg from "@/assets/proto-trash-icon.svg?raw";

export type PlpBundleItem = {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  savings: string;
  jabCount: number;
  regions: string[];
  countries: string[];
  searchTerms: string[];
};

/** Dummy bundle rows — aligned to Sarah Jenkins / Southeast Asia travel persona. */
export const PLP_BUNDLE_ITEMS: PlpBundleItem[] = [
  {
    title: "Southeast Asia Travel Vaccination Pack",
    subtitle: "Thailand, Malaysia, Indonesia, Vietnam & wider region",
    description:
      "Covers Hepatitis A, Typhoid, and DTP (Tetanus, Diphtheria, Polio) — the NaTHNaC-recommended core for multi-stop trips across South-East Asia, including street food and city-to-island itineraries. Includes a pharmacist travel health consultation and all jabs in one appointment; book 4–6 weeks before you fly. Rabies or Japanese Encephalitis can be added if you are staying rural or for three weeks+.",
    price: "245.00",
    savings: "Save up to 18% vs individual jabs",
    jabCount: 3,
    regions: ["South-East Asia", "Western Pacific"],
    countries: ["Thailand", "Malaysia", "Indonesia", "Philippines", "Vietnam", "Singapore"],
    searchTerms: ["southeast asia", "indonesia", "thailand", "bundle", "hepatitis", "typhoid", "travel pack"],
  },
  {
    title: "Indonesia & Bali Explorer Pack",
    subtitle: "Bali, Java, Lombok · 2–4 week trips",
    description:
      "Covers Hepatitis A, Typhoid, DTP, and Rabies pre-exposure — matched to island-hopping in Indonesia where food/water risks and animal contact (monkeys, stray dogs) are common. Ideal for Sarah-style three-week itineraries; Rabies needs a short course, so book as soon as your dates are set. Travel health review included, with malaria tablets and Yellow Fever guidance available as add-ons if your route needs them.",
    price: "229.00",
    savings: "Includes travel health review",
    jabCount: 4,
    regions: ["South-East Asia"],
    countries: ["Indonesia", "Malaysia", "Singapore", "Vietnam"],
    searchTerms: ["indonesia", "bali", "explorer", "rabies", "java", "lombok"],
  },
  {
    title: "Family Travel Health Pack",
    subtitle: "Up to 4 travellers · one shared appointment",
    description:
      "Covers Hepatitis A, Typhoid, DTP, and Polio for up to four people — the usual NHS-recommended holiday baseline for mixed family trips to Europe, South-East Asia, or the Americas. Everyone is seen in a single shared slot so you are not juggling multiple bookings. Children’s dosing and any extra jabs (e.g. Hepatitis B) are confirmed during your consultation.",
    price: "399.00",
    savings: "Best value for multi-traveller trips",
    jabCount: 5,
    regions: ["Europe", "Americas", "South-East Asia"],
    countries: ["Thailand", "Malaysia", "Indonesia", "Philippines", "Vietnam", "Singapore"],
    searchTerms: ["family", "travel", "children", "shared appointment"],
  },
  {
    title: "Hajj & Umrah Pilgrimage Pack",
    subtitle: "Saudi Arabia · certificate included",
    description:
      "Covers Meningitis ACWY (mandatory for visa — certificate issued at least 10 days before arrival), Hepatitis A, and seasonal Influenza — the required and strongly recommended vaccines for Hajj and Umrah. Certificate handling and travel health advice are included so you meet Saudi entry rules without a separate visit. DTP booster and optional add-ons available if your clinician recommends them.",
    price: "275.00",
    savings: "Certificate support included",
    jabCount: 3,
    regions: ["Eastern Mediterranean", "Africa"],
    countries: ["Malaysia", "Indonesia", "India"],
    searchTerms: ["hajj", "umrah", "meningitis", "pilgrimage", "saudi"],
  },
  {
    title: "East Africa Safari Pack",
    subtitle: "Kenya, Tanzania & sub-Saharan routes",
    description:
      "Covers Yellow Fever (with International Certificate of Vaccination), Typhoid, Hepatitis A, and Rabies pre-exposure — the standard private-clinic set for safari and East Africa travel where Yellow Fever proof is often required at border crossings. One appointment covers the core jabs; malaria prophylaxis and Hepatitis B can be added based on your route and season. Book 4–6 weeks ahead, or ask about urgent slots if you are travelling sooner.",
    price: "265.00",
    savings: "Yellow Fever certificate eligible",
    jabCount: 4,
    regions: ["Africa"],
    countries: ["Kenya", "Tanzania", "South Africa"],
    searchTerms: ["africa", "safari", "yellow fever", "kenya", "tanzania", "malaria"],
  },
  {
    title: "European City Break Pack",
    subtitle: "France, Spain, Italy, Germany · short stays",
    description:
      "Covers a DTP (Tetanus, Diphtheria, Polio) booster — usually all you need for short urban breaks in Western Europe when your routine vaccines are otherwise up to date. Quick appointment slots for long-weekend and city-break trips with minimal clinic time. Tick-borne Encephalitis or Hepatitis A can be added if you are hiking in Eastern Europe or staying longer.",
    price: "95.00",
    savings: "Quick appointment slots",
    jabCount: 1,
    regions: ["Europe"],
    countries: ["France", "Spain", "Italy", "Germany"],
    searchTerms: ["europe", "city break", "tetanus", "routine", "weekend"],
  },
  {
    title: "Long Haul Business Travel Pack",
    subtitle: "Frequent flyers · priority booking",
    description:
      "Covers combined Hepatitis A/B and Typhoid — core protection for repeated long-haul trips to Asia, the Americas, and multi-country business routes where food/water exposure adds up over many visits. Priority appointment access helps when departure dates move. Consultation covers your full travel calendar; Rabies, Yellow Fever, or malaria tablets available as add-ons per itinerary.",
    price: "210.00",
    savings: "Priority appointment access",
    jabCount: 2,
    regions: ["Americas", "Western Pacific", "Europe"],
    countries: ["Malaysia", "Philippines", "India", "Singapore"],
    searchTerms: ["business", "long haul", "hepatitis", "frequent", "corporate"],
  },
];

type TileFilterMeta = {
  ages: string[];
  diseases: string[];
  regions: string[];
  countries: string[];
};

type ActivePlpFilters = {
  showBundles: boolean;
  ages: string[] | null;
  diseases: string[];
  regions: string[];
  countries: string[];
};

const PLP_SCREEN_SELECTOR = ".proto-viewport > div > div:nth-child(9)";
const PLP_TILE_SELECTOR = `${PLP_SCREEN_SELECTOR} [data-name="boots-pharmacy.service.tile"]`;
const PLP_FILTERS_SELECTOR = '[data-name="module.plp.filters"]';
const PLP_FILTER_LIST_MAX = 10;

const PLP_COUNTRY_CATALOG = [
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Singapore",
  "Cambodia",
  "India",
  "Kenya",
  "Tanzania",
  "France",
  "Spain",
  "Italy",
  "Germany",
  "South Africa",
] as const;

/** Top travel countries per PLP region filter label (up to 10 each). */
const PLP_TRAVEL_COUNTRIES_BY_REGION: Record<string, readonly string[]> = {
  Europe: [
    "France",
    "Spain",
    "Italy",
    "Germany",
    "Portugal",
    "Greece",
    "Netherlands",
    "Switzerland",
    "Croatia",
    "Poland",
  ],
  "South-East Asia": [
    "Thailand",
    "Malaysia",
    "Indonesia",
    "Philippines",
    "Vietnam",
    "Singapore",
    "Cambodia",
    "Laos",
    "Myanmar",
    "Brunei",
  ],
  Africa: [
    "Kenya",
    "Tanzania",
    "South Africa",
    "Morocco",
    "Egypt",
    "Ghana",
    "Nigeria",
    "Uganda",
    "Rwanda",
    "Botswana",
  ],
  Americas: [
    "United States",
    "Mexico",
    "Brazil",
    "Peru",
    "Colombia",
    "Costa Rica",
    "Cuba",
    "Argentina",
    "Chile",
    "Canada",
  ],
  "Western Pacific": [
    "Australia",
    "New Zealand",
    "Japan",
    "China",
    "Fiji",
    "Papua New Guinea",
    "Philippines",
    "Indonesia",
    "Samoa",
    "Vanuatu",
  ],
  "Eastern Mediterranean": [
    "Turkey",
    "United Arab Emirates",
    "Saudi Arabia",
    "Jordan",
    "Israel",
    "Egypt",
    "Lebanon",
    "Qatar",
    "Oman",
    "Kuwait",
  ],
};

let plpListingSyncPass = 0;
let plpListingLoadTimer: ReturnType<typeof setTimeout> | null = null;
const PLP_LISTING_LOAD_MS = 450;

function findFilterSection(
  root: ParentNode,
  titlePattern: RegExp
): HTMLElement | null {
  const module = root.querySelector(PLP_FILTERS_SELECTOR);
  if (!module) return null;

  for (const section of module.querySelectorAll<HTMLElement>(
    '[data-name="component.plp.filter.custom"], [data-name="component.plp.filter.brands"]'
  )) {
    if (titlePattern.test(section.textContent ?? "")) return section;
  }
  return null;
}

function findByTypeFilterList(root: ParentNode = document): HTMLElement | null {
  return findFilterSection(root, /by type/i)?.querySelector<HTMLElement>(
    '[data-name="list"]'
  ) ?? null;
}

function radioLabel(row: HTMLElement): string {
  return (row.querySelector("p")?.textContent ?? "").trim();
}

function isVisibleFilterCheckboxItem(item: HTMLElement): boolean {
  return item.style.display !== "none";
}

function readCheckedCheckboxLabels(section: HTMLElement): string[] {
  const labels: string[] = [];
  section
    .querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
    .forEach((item) => {
      if (!isVisibleFilterCheckboxItem(item)) return;
      const row = item.querySelector<HTMLElement>(
        '[data-name="component.input.checkbox"]'
      );
      if (row?.dataset.checkboxChecked !== "true") return;
      const label =
        item.querySelector<HTMLElement>('[data-name="Label"] p')?.textContent?.trim() ??
        item.querySelector("p")?.textContent?.trim();
      if (label && !/^\d+$/.test(label)) labels.push(label);
    });
  return labels;
}

function readSearchQuery(section: HTMLElement | null): string {
  if (!section) return "";
  const input = section.querySelector<HTMLInputElement>(".proto-search-input");
  return (input?.value ?? "").trim();
}

export function isByTypeFilterRadio(radioRow: HTMLElement): boolean {
  const list = findByTypeFilterList();
  if (!list) return false;
  return list.contains(radioRow);
}

export function isPlpFilterPanelTarget(target: HTMLElement): boolean {
  return !!target.closest(PLP_FILTERS_SELECTOR);
}

export function getPlpByTypeMode(root: ParentNode = document): "jabs" | "bundles" {
  const list = findByTypeFilterList(root);
  if (!list) return "jabs";

  for (const row of list.querySelectorAll<HTMLElement>(
    '[data-name="component.input.radio"]'
  )) {
    if (/^bundles$/i.test(radioLabel(row)) && row.dataset.radioChecked === "true") {
      return "bundles";
    }
  }
  return "jabs";
}

function readActivePlpFilters(root: ParentNode = document): ActivePlpFilters {
  const ageSection = findFilterSection(root, /by age/i);
  const diseaseSection = findFilterSection(root, /by disease/i);
  const regionSection = findFilterSection(root, /by region/i);
  const countrySection = findFilterSection(root, /by country/i);

  let ages: string[] | null = null;
  if (ageSection) {
    const allAgesSelected = Array.from(
      ageSection.querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    ).some(
      (row) =>
        /all age groups/i.test(radioLabel(row)) &&
        row.dataset.radioChecked === "true"
    );
    if (!allAgesSelected) {
      const checked = readCheckedCheckboxLabels(ageSection);
      ages = checked.length ? checked : null;
    }
  }

  return {
    showBundles: getPlpByTypeMode(root) === "bundles",
    ages,
    diseases: diseaseSection ? readCheckedCheckboxLabels(diseaseSection) : [],
    regions: regionSection ? readCheckedCheckboxLabels(regionSection) : [],
    countries: countrySection ? readCheckedCheckboxLabels(countrySection) : [],
  };
}

/** True when any PLP sidebar filter differs from the reset defaults. */
function isPlpFiltersActive(root: ParentNode = document): boolean {
  const ageSection = findFilterSection(root, /by age/i);
  if (ageSection) {
    const allAgesSelected = Array.from(
      ageSection.querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    ).some(
      (row) =>
        /all age groups/i.test(radioLabel(row)) &&
        row.dataset.radioChecked === "true"
    );
    if (!allAgesSelected) return true;
  }

  for (const section of [
    findFilterSection(root, /by disease/i),
    findFilterSection(root, /by region/i),
    findFilterSection(root, /by country/i),
  ]) {
    if (!section) continue;
    if (readSearchQuery(section)) return true;
    if (readCheckedCheckboxLabels(section).length) return true;
  }

  return false;
}

function getFilterCheckboxItemLabel(item: HTMLElement): string {
  const fromLabel = item
    .querySelector<HTMLElement>('[data-name="Label"] p')
    ?.textContent?.trim();
  if (fromLabel) return fromLabel;

  for (const p of item.querySelectorAll<HTMLParagraphElement>("p")) {
    const text = (p.textContent ?? "").trim();
    if (text && !/^\d+$/.test(text)) return text;
  }
  return "";
}

function syncFilterSectionListSearch(section: HTMLElement | null): void {
  if (!section) return;

  const query = readSearchQuery(section).toLowerCase();
  const list = section.querySelector<HTMLElement>('[data-name="list"]');
  if (!list) return;

  list
    .querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
    .forEach((item) => {
      const label = getFilterCheckboxItemLabel(item).toLowerCase();
      const show = !query || label.includes(query);
      item.style.display = show ? "" : "none";
    });
}

function reapplyPlpFilterListSearch(root: ParentNode = document): void {
  syncFilterSectionListSearch(findFilterSection(root, /by disease/i));
  syncFilterSectionListSearch(findFilterSection(root, /by country/i));
}

/** Narrow By Disease / By Country checkbox lists from sidebar search fields only. */
export function syncPlpFilterListSearch(
  root: ParentNode = document,
  options: { refreshResults?: boolean } = {}
): void {
  if (options.refreshResults !== false) {
    syncPlpListingResults(root, { simulateLoad: false });
  } else {
    reapplyPlpFilterListSearch(root);
  }
}

type PlpFacetKey = "age" | "disease" | "region" | "country";

function findFilterRowCountEl(row: HTMLElement): HTMLParagraphElement | null {
  const directCountPs = Array.from(row.children).filter(
    (el): el is HTMLParagraphElement => el.tagName === "P"
  );
  for (let i = directCountPs.length - 1; i >= 0; i--) {
    const p = directCountPs[i];
    if (/text-\[10px\]/.test(p.className) && /text-\[#7a7d87\]/.test(p.className)) {
      return p;
    }
  }

  return (
    Array.from(row.querySelectorAll<HTMLParagraphElement>("p"))
      .reverse()
      .find(
        (p) =>
          /text-\[10px\]/.test(p.className) &&
          /text-\[#7a7d87\]/.test(p.className) &&
          !p.closest('[data-name="Label"]')
      ) ?? null
  );
}

function setFilterRowCount(row: HTMLElement, count: number): void {
  const el = findFilterRowCountEl(row);
  if (el) el.textContent = String(count);
}

function diseaseFilterMatchesLabel(haystack: string, label: string): boolean {
  const blob = haystack.toLowerCase();
  const key = label.toLowerCase();

  if (blob.includes(key)) return true;

  switch (key) {
    case "chickenpox":
      return /chickenpox|varicella/.test(blob);
    case "covid-19":
      return /covid/.test(blob);
    case "diphtheria":
      return /diphtheria|tetanus|polio|pertussis|dtap|tdap/.test(blob);
    case "cholera":
      return /cholera/.test(blob);
    case "dengue":
      return /dengue/.test(blob);
    case "influenza":
      return /flu|influenza/.test(blob);
    case "hepatitis a":
      return /hepatitis a/.test(blob);
    case "hepatitis b":
      return /hepatitis b/.test(blob);
    case "yellow fever":
      return /yellow fever/.test(blob);
    case "typhoid":
      return /typhoid/.test(blob);
    case "meningitis":
      return /meningococcal|meningitis/.test(blob);
    case "rabies":
      return /rabies/.test(blob);
    case "japanese encephalitis":
      return /japanese encephalitis/.test(blob);
    case "shingles":
      return /shingles/.test(blob);
    case "hpv":
      return /\bhpv\b|human papillomavirus/.test(blob);
    case "mmr":
      return /mmr|measles|mumps|rubella/.test(blob);
    case "pneumococcal":
      return /pneumococcal/.test(blob);
    case "rsv":
      return /\brsv\b/.test(blob);
    case "tick-borne encephalitis":
      return /tick-borne encephalitis/.test(blob);
    default:
      return false;
  }
}

function inferDiseasesFromText(text: string): string[] {
  const diseases: string[] = [];
  for (const label of [
    "Chickenpox",
    "COVID-19",
    "Influenza",
    "Diphtheria",
    "Cholera",
    "Dengue",
    "Hepatitis A",
    "Hepatitis B",
    "Yellow Fever",
    "Typhoid",
    "Meningitis",
    "Rabies",
    "Japanese Encephalitis",
    "Shingles",
    "HPV",
    "MMR",
    "Pneumococcal",
    "RSV",
    "Tick-borne Encephalitis",
  ]) {
    if (diseaseFilterMatchesLabel(text, label)) diseases.push(label);
  }
  return [...new Set(diseases)];
}

function inferCountriesFromText(text: string): string[] {
  const blob = text.toLowerCase();
  const found = PLP_COUNTRY_CATALOG.filter((country) =>
    blob.includes(country.toLowerCase())
  );
  for (const countries of Object.values(PLP_TRAVEL_COUNTRIES_BY_REGION)) {
    for (const country of countries) {
      if (blob.includes(country.toLowerCase()) && !found.includes(country)) {
        found.push(country);
      }
    }
  }
  return found;
}

function getPlpCountryCandidates(selectedRegions: string[]): string[] {
  if (selectedRegions.length) {
    const set = new Set<string>();
    for (const region of selectedRegions) {
      for (const country of PLP_TRAVEL_COUNTRIES_BY_REGION[region] ?? []) {
        set.add(country);
      }
    }
    return [...set];
  }

  const set = new Set<string>();
  for (const countries of Object.values(PLP_TRAVEL_COUNTRIES_BY_REGION)) {
    for (const country of countries) {
      set.add(country);
    }
  }
  return [...set];
}

function jabCoversCountry(
  meta: TileFilterMeta,
  country: string,
  selectedRegions: string[]
): boolean {
  if (meta.countries.includes(country)) return true;
  if (meta.countries.length > 0) return false;

  const regionsToUse = selectedRegions.length ? selectedRegions : meta.regions;

  return regionsToUse.some((region) => {
    if (!meta.regions.some((r) => r.toLowerCase() === region.toLowerCase())) {
      return false;
    }
    return (PLP_TRAVEL_COUNTRIES_BY_REGION[region] ?? []).includes(country);
  });
}

function setFilterCheckboxItemLabel(item: HTMLElement, label: string): void {
  const labelEl = item.querySelector<HTMLElement>('[data-name="Label"] p');
  if (labelEl) {
    labelEl.textContent = label;
    return;
  }

  for (const p of item.querySelectorAll<HTMLParagraphElement>("p")) {
    const text = (p.textContent ?? "").trim();
    if (text && !/^\d+$/.test(text) && !/text-\[10px\]/.test(p.className)) {
      p.textContent = label;
      return;
    }
  }
}

function countCatalogDisease(
  label: string,
  jabTiles: HTMLElement[]
): { jabs: number; bundles: number } {
  let jabs = 0;
  jabTiles.forEach((tile, index) => {
    const haystack = getTileSearchText(tile);
    const meta = ensureTileMeta(tile, index);
    if (
      diseaseFilterMatchesLabel(haystack, label) ||
      matchesAnySelected([label], meta.diseases, haystack)
    ) {
      jabs += 1;
    }
  });

  const bundles = PLP_BUNDLE_ITEMS.reduce((count, item) => {
    const haystack = `${item.title} ${item.subtitle} ${item.description}`;
    return diseaseFilterMatchesLabel(haystack, label) ? count + 1 : count;
  }, 0);

  return { jabs, bundles };
}

function collectPlpDiseaseFilterLabels(jabTiles: HTMLElement[]): string[] {
  const labels = new Set<string>();
  jabTiles.forEach((tile, index) => {
    ensureTileMeta(tile, index).diseases.forEach((disease) => labels.add(disease));
    inferDiseasesFromText(getTileTitle(tile)).forEach((disease) =>
      labels.add(disease)
    );
  });
  PLP_BUNDLE_ITEMS.forEach((item) => {
    inferDiseasesFromText(
      `${item.title} ${item.subtitle} ${item.description}`
    ).forEach((disease) => labels.add(disease));
  });

  return [...labels]
    .map((label) => {
      const { jabs, bundles } = countCatalogDisease(label, jabTiles);
      return { label, score: jabs + bundles };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.label.localeCompare(b.label, "en")
    )
    .slice(0, PLP_FILTER_LIST_MAX)
    .map((entry) => entry.label);
}

function collectPlpCountryFilterLabels(
  jabTiles: HTMLElement[],
  filters: ActivePlpFilters
): string[] {
  const candidates = getPlpCountryCandidates(filters.regions);

  return candidates
    .map((country) => ({
      country,
      score: countCountryAvailability(country, jabTiles, filters),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.country.localeCompare(b.country, "en")
    )
    .slice(0, PLP_FILTER_LIST_MAX)
    .map((entry) => entry.country);
}

function clearCountryFilterSelections(section: HTMLElement | null): void {
  if (!section) return;
  section
    .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
    .forEach((row) => {
      row.dataset.checkboxChecked = "false";
    });
}

function ensurePlpFilterCheckboxList(
  section: HTMLElement | null,
  labels: string[]
): void {
  if (!section) return;

  const list = section.querySelector<HTMLElement>('[data-name="list"]');
  if (!list) return;

  const template = list.querySelector<HTMLElement>(
    '[data-name="component.plp.filter.checkbox.item"]'
  );
  if (!template) return;

  const existing = Array.from(
    list.querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
  );
  const capped = labels.slice(0, PLP_FILTER_LIST_MAX);

  capped.forEach((label, index) => {
    let item = existing[index];
    if (!item) {
      item = template.cloneNode(true) as HTMLElement;
      const checkboxRow = item.querySelector<HTMLElement>(
        '[data-name="component.input.checkbox"]'
      );
      if (checkboxRow) {
        checkboxRow.dataset.checkboxChecked = "false";
        checkboxRow.removeAttribute("data-proto-filter-disabled");
      }
      item.dataset.protoFilterDisabled = "false";
      item.removeAttribute("aria-disabled");
      list.appendChild(item);
    }

    setFilterCheckboxItemLabel(item, label);
    item.style.display = "";
  });

  existing.slice(capped.length).forEach((item) => {
    item.style.display = "none";
    const checkboxRow = item.querySelector<HTMLElement>(
      '[data-name="component.input.checkbox"]'
    );
    if (checkboxRow?.dataset.checkboxChecked === "true") {
      checkboxRow.dataset.checkboxChecked = "false";
    }
  });
}

function ensurePlpFilterLists(
  root: ParentNode,
  jabTiles: HTMLElement[]
): void {
  jabTiles.forEach((tile) => {
    tile.removeAttribute("data-proto-filter-meta");
  });

  const filters = readActivePlpFilters(root);

  ensurePlpFilterCheckboxList(
    findFilterSection(root, /by disease/i),
    collectPlpDiseaseFilterLabels(jabTiles)
  );

  const countrySection = findFilterSection(root, /by country/i);
  const countryLabels = collectPlpCountryFilterLabels(jabTiles, filters);
  const countryLabelsKey = `${filters.regions.join("|")}::${countryLabels.join("|")}`;
  if (countrySection?.dataset.protoPlpCountryLabelsKey !== countryLabelsKey) {
    clearCountryFilterSelections(countrySection);
    if (countrySection) {
      countrySection.dataset.protoPlpCountryLabelsKey = countryLabelsKey;
    }
  }
  ensurePlpFilterCheckboxList(countrySection, countryLabels);
}

/** Update count and disabled state; returns true if a checked box was cleared. */
function setFilterCheckboxItemState(item: HTMLElement, count: number): boolean {
  setFilterRowCount(item, count);

  const disabled = count === 0;
  item.dataset.protoFilterDisabled = disabled ? "true" : "false";
  item.setAttribute("aria-disabled", disabled ? "true" : "false");

  const checkboxRow = item.querySelector<HTMLElement>(
    '[data-name="component.input.checkbox"]'
  );
  if (!checkboxRow) return false;

  checkboxRow.dataset.protoFilterDisabled = disabled ? "true" : "false";
  if (disabled && checkboxRow.dataset.checkboxChecked === "true") {
    checkboxRow.dataset.checkboxChecked = "false";
    return true;
  }
  return false;
}

export function isPlpFilterCheckboxDisabled(target: HTMLElement): boolean {
  return (
    target.closest('[data-name="component.plp.filter.checkbox.item"]')
      ?.dataset.protoFilterDisabled === "true"
  );
}

function filtersWithoutFacet(
  filters: ActivePlpFilters,
  facet: PlpFacetKey | "type"
): ActivePlpFilters {
  switch (facet) {
    case "type":
      return { ...filters, showBundles: false };
    case "age":
      return { ...filters, ages: null };
    case "disease":
      return { ...filters, diseases: [] };
    case "region":
      return { ...filters, regions: [] };
    case "country":
      return { ...filters, countries: [] };
  }
}

function jabHasFacetValue(
  tile: HTMLElement,
  index: number,
  facet: PlpFacetKey,
  value: string,
  selectedRegions: string[] = []
): boolean {
  const meta = ensureTileMeta(tile, index);
  const haystack = getTileSearchText(tile);

  switch (facet) {
    case "age":
      return matchesAnySelected([value], meta.ages, haystack);
    case "disease":
      return (
        diseaseFilterMatchesLabel(haystack, value) ||
        matchesAnySelected([value], meta.diseases, haystack)
      );
    case "region":
      return matchesAnySelected([value], meta.regions, haystack);
    case "country":
      return jabCoversCountry(meta, value, selectedRegions);
  }
}

function bundleHasFacetValue(
  item: PlpBundleItem,
  facet: PlpFacetKey,
  value: string
): boolean {
  const haystack =
    `${item.title} ${item.subtitle} ${item.description}`.toLowerCase();

  switch (facet) {
    case "age":
      return true;
    case "disease":
      return diseaseFilterMatchesLabel(haystack, value);
    case "region":
      return matchesAnySelected([value], item.regions, haystack);
    case "country":
      return matchesAnySelected([value], item.countries, haystack);
  }
}

function countJabsMatchingFilters(
  jabTiles: HTMLElement[],
  filters: ActivePlpFilters
): number {
  return jabTiles.reduce((count, tile, index) => {
    return jabTileMatches(tile, filters, index) ? count + 1 : count;
  }, 0);
}

function countBundlesMatchingFilters(filters: ActivePlpFilters): number {
  return PLP_BUNDLE_ITEMS.reduce((count, item) => {
    return bundleItemMatches(item, filters) ? count + 1 : count;
  }, 0);
}

function countJabFacetValue(
  jabTiles: HTMLElement[],
  facet: PlpFacetKey,
  value: string,
  filters: ActivePlpFilters
): number {
  const baseFilters = filtersWithoutFacet(filters, facet);
  return jabTiles.reduce((count, tile, index) => {
    if (!jabHasFacetValue(tile, index, facet, value, filters.regions)) return count;
    return jabTileMatches(tile, baseFilters, index) ? count + 1 : count;
  }, 0);
}

function countBundleFacetValue(
  facet: PlpFacetKey,
  value: string,
  filters: ActivePlpFilters
): number {
  const baseFilters = filtersWithoutFacet(filters, facet);

  if (facet === "age") {
    return countBundlesMatchingFilters(baseFilters);
  }

  return PLP_BUNDLE_ITEMS.reduce((count, item) => {
    if (!bundleHasFacetValue(item, facet, value)) return count;
    return bundleItemMatches(item, baseFilters) ? count + 1 : count;
  }, 0);
}

function syncPlpByTypeFilterCounts(
  root: ParentNode,
  jabTiles: HTMLElement[],
  filters: ActivePlpFilters
): void {
  const section = findFilterSection(root, /by type/i);
  const list = section?.querySelector<HTMLElement>('[data-name="list"]');
  if (!list) return;

  const typeFilters = filtersWithoutFacet(filters, "type");

  list
    .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    .forEach((row) => {
      const label = radioLabel(row);
      if (/^individual jabs$/i.test(label)) {
        setFilterRowCount(row, countJabsMatchingFilters(jabTiles, typeFilters));
        return;
      }
      if (/^bundles$/i.test(label)) {
        setFilterRowCount(row, countBundlesMatchingFilters(typeFilters));
      }
    });
}

function syncPlpCheckboxFacetFilterCounts(
  root: ParentNode,
  titlePattern: RegExp,
  facet: PlpFacetKey,
  jabTiles: HTMLElement[],
  mode: "jabs" | "bundles",
  filters: ActivePlpFilters
): boolean {
  const section = findFilterSection(root, titlePattern);
  if (!section) return false;

  let selectionCleared = false;

  section
    .querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
    .forEach((item) => {
      const label = getFilterCheckboxItemLabel(item);
      if (!label) return;

      const count =
        mode === "bundles"
          ? countBundleFacetValue(facet, label, filters)
          : countJabFacetValue(jabTiles, facet, label, filters);
      if (setFilterCheckboxItemState(item, count)) {
        selectionCleared = true;
      }
    });

  return selectionCleared;
}

function syncPlpFilterCounts(
  root: ParentNode,
  jabTiles: HTMLElement[],
  filters: ActivePlpFilters
): boolean {
  const mode = getPlpByTypeMode(root);

  syncPlpByTypeFilterCounts(root, jabTiles, filters);

  return [
    syncPlpCheckboxFacetFilterCounts(
      root,
      /by age/i,
      "age",
      jabTiles,
      mode,
      filters
    ),
    syncPlpCheckboxFacetFilterCounts(
      root,
      /by disease/i,
      "disease",
      jabTiles,
      mode,
      filters
    ),
    syncPlpCheckboxFacetFilterCounts(
      root,
      /by region/i,
      "region",
      jabTiles,
      mode,
      filters
    ),
    syncPlpCheckboxFacetFilterCounts(
      root,
      /by country/i,
      "country",
      jabTiles,
      mode,
      filters
    ),
  ].some(Boolean);
}

function cancelPlpListingLoadTimer(): void {
  if (plpListingLoadTimer !== null) {
    clearTimeout(plpListingLoadTimer);
    plpListingLoadTimer = null;
  }
}

function hideAllPlpTiles(jabTiles: HTMLElement[], bundleTiles: HTMLElement[]): void {
  for (const tile of [...jabTiles, ...bundleTiles]) {
    tile.style.display = "none";
    tile.classList.remove("proto-plp-tile--in");
    tile.style.removeProperty("--proto-plp-stagger");
  }
}

function ensurePlpTilesHost(container: HTMLElement): void {
  container.classList.add("proto-plp-tiles-host");
}

function ensurePlpListingLoader(host: HTMLElement): HTMLElement {
  let loader = host.querySelector<HTMLElement>(".proto-plp-listing-loader");
  if (loader && !loader.querySelector(".proto-plp-listing-loader__arc")) {
    loader.remove();
    loader = null;
  }
  if (loader) return loader;

  loader = document.createElement("div");
  loader.className = "proto-plp-listing-loader";
  loader.hidden = true;
  loader.setAttribute("aria-live", "polite");
  loader.innerHTML = `
    <div class="proto-plp-listing-loader__inner">
      <div class="proto-plp-listing-loader__spinner proto-plp-listing-loader__spinner--run" aria-hidden="true">
        <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
          <circle class="proto-plp-listing-loader__track" cx="22" cy="22" r="18" fill="none"></circle>
          <circle class="proto-plp-listing-loader__arc" cx="22" cy="22" r="18" fill="none"></circle>
        </svg>
      </div>
      <p class="proto-plp-listing-loader__text">Updating results…</p>
    </div>
  `;
  host.appendChild(loader);
  return loader;
}

function beginPlpListingLoading(host: HTMLElement, root: ParentNode): void {
  host.classList.add("proto-plp-listing--loading");
  const loader = ensurePlpListingLoader(host);
  loader.hidden = false;

  const spinner = loader.querySelector<HTMLElement>(
    ".proto-plp-listing-loader__spinner"
  );
  if (spinner) {
    spinner.classList.remove("proto-plp-listing-loader__spinner--run");
    void spinner.offsetWidth;
    spinner.classList.add("proto-plp-listing-loader__spinner--run");
  }

  setPlpResultsCountLoading(root);
}

function endPlpListingLoading(host: HTMLElement): void {
  host.classList.remove("proto-plp-listing--loading");
  host.classList.remove("proto-plp-listing--reveal");
  const loader = host.querySelector<HTMLElement>(".proto-plp-listing-loader");
  if (loader) loader.hidden = true;

  requestAnimationFrame(() => {
    host.classList.add("proto-plp-listing--reveal");
  });
}

function setPlpResultsCountLoading(root: ParentNode): void {
  const controls = root.querySelector<HTMLElement>(
    '[data-name="component.filter.controls"]'
  );
  const el =
    controls?.querySelector<HTMLElement>(".proto-plp-results-summary") ??
    controls?.querySelector<HTMLElement>(".proto-plp-filter-controls__row p") ??
    controls?.querySelector("p");
  if (el) {
    el.textContent = "Updating results…";
    el.classList.add("proto-plp-results-count--loading");
  }
}

function setPlpTileVisible(
  tile: HTMLElement,
  show: boolean,
  options: { animate: boolean; staggerIndex: number }
): void {
  tile.classList.remove("proto-plp-tile--hidden");

  if (!show) {
    tile.style.display = "none";
    tile.classList.remove("proto-plp-tile--in");
    tile.style.removeProperty("--proto-plp-stagger");
    return;
  }

  tile.style.display = "";

  if (!options.animate) {
    tile.classList.remove("proto-plp-tile--in");
    tile.style.removeProperty("--proto-plp-stagger");
    return;
  }

  tile.classList.remove("proto-plp-tile--in");
  tile.style.setProperty(
    "--proto-plp-stagger",
    `${Math.min(options.staggerIndex, 8) * 50}ms`
  );

  requestAnimationFrame(() => {
    tile.classList.add("proto-plp-tile--in");
  });
}

function syncPlpListingResults(
  root: ParentNode = document,
  options: { simulateLoad?: boolean } = {}
): void {
  const screen = root.querySelector<HTMLElement>(PLP_SCREEN_SELECTOR);
  if (!screen) return;

  const jabTiles = Array.from(
    screen.querySelectorAll<HTMLElement>(PLP_TILE_SELECTOR)
  ).filter((tile) => tile.dataset.protoPlpBundle !== "true");

  if (!jabTiles.length) return;

  jabTiles.forEach((tile) => {
    tile.dataset.protoPlpJab = "true";
  });

  const container = jabTiles[0].parentElement;
  if (!container) return;

  ensurePlpTilesHost(container);
  ensurePlpFilterLists(root, jabTiles);

  const bundleTiles = ensureBundleTiles(container, jabTiles[0]);
  const simulateLoad = options.simulateLoad === true && plpListingSyncPass > 0;
  plpListingSyncPass += 1;

  const applyListingVisibility = (
    filters: ActivePlpFilters,
    reveal: boolean
  ): number => {
    let visibleCount = 0;
    let staggerIndex = 0;

    if (filters.showBundles) {
      jabTiles.forEach((tile) => {
        setPlpTileVisible(tile, false, { animate: false, staggerIndex: 0 });
      });
      bundleTiles.forEach((tile, index) => {
        const item = PLP_BUNDLE_ITEMS[index];
        const show = item ? bundleItemMatches(item, filters) : false;
        setPlpTileVisible(tile, show, {
          animate: reveal,
          staggerIndex: show ? staggerIndex++ : 0,
        });
        if (show) visibleCount += 1;
      });
    } else {
      bundleTiles.forEach((tile) => {
        setPlpTileVisible(tile, false, { animate: false, staggerIndex: 0 });
      });
      jabTiles.forEach((tile, index) => {
        const show = jabTileMatches(tile, filters, index);
        setPlpTileVisible(tile, show, {
          animate: reveal,
          staggerIndex: show ? staggerIndex++ : 0,
        });
        if (show) visibleCount += 1;
      });
    }

    return visibleCount;
  };

  const finalizeListing = (): void => {
    let filters = readActivePlpFilters(root);
    let visibleCount = applyListingVisibility(filters, true);

    if (syncPlpFilterCounts(root, jabTiles, filters)) {
      filters = readActivePlpFilters(root);
      visibleCount = applyListingVisibility(filters, true);
      syncPlpFilterCounts(root, jabTiles, filters);
    }

    updateResultsCount(root, visibleCount, true);
    endPlpListingLoading(container);
    ensurePlpTileTitleLinks(root);
    reapplyPlpFilterListSearch(root);
  };

  if (!simulateLoad) {
    cancelPlpListingLoadTimer();
    let filters = readActivePlpFilters(root);
    let visibleCount = applyListingVisibility(filters, false);

    if (syncPlpFilterCounts(root, jabTiles, filters)) {
      filters = readActivePlpFilters(root);
      visibleCount = applyListingVisibility(filters, false);
      syncPlpFilterCounts(root, jabTiles, filters);
    }

    updateResultsCount(root, visibleCount, false);
    container.classList.remove("proto-plp-listing--loading", "proto-plp-listing--reveal");
    const loader = container.querySelector<HTMLElement>(".proto-plp-listing-loader");
    if (loader) loader.hidden = true;
    ensurePlpTileTitleLinks(root);
    reapplyPlpFilterListSearch(root);
    return;
  }

  cancelPlpListingLoadTimer();
  beginPlpListingLoading(container, root);
  hideAllPlpTiles(jabTiles, bundleTiles);

  plpListingLoadTimer = window.setTimeout(() => {
    plpListingLoadTimer = null;
    finalizeListing();
  }, PLP_LISTING_LOAD_MS);
}

/** Sync PLP listing visibility with all sidebar filters (prototype mapping). */
export function syncPlpListingFilters(root: ParentNode = document): void {
  syncPlpFilterListSearch(root, { refreshResults: false });
  syncPlpListingResults(root, { simulateLoad: true });
}

function findTitleEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      /leading-\[38px\].*text-\[24px\]|text-\[24px\].*leading-\[38px\]/.test(
        p.className
      )
    ) ?? null
  );
}

/** Wrap PLP tile H1-style titles in links (navigation wired in App.tsx). */
export function ensurePlpTileTitleLinks(root: ParentNode = document): void {
  const screen = root.querySelector<HTMLElement>(PLP_SCREEN_SELECTOR);
  if (!screen) return;

  screen.querySelectorAll<HTMLElement>(PLP_TILE_SELECTOR).forEach((tile) => {
    const titleEl = findTitleEl(tile);
    if (!titleEl) return;

    if (titleEl.closest("a.proto-plp-tile-title-link")) return;

    const link = document.createElement("a");
    link.href = "#";
    link.className = "proto-link proto-plp-tile-title-link";
    link.setAttribute("data-proto-plp-tile-title", "true");
    titleEl.parentElement?.insertBefore(link, titleEl);
    link.appendChild(titleEl);
  });
}

function getTileTitle(tile: HTMLElement): string {
  return (findTitleEl(tile)?.textContent ?? tile.textContent ?? "").trim();
}

function getTileSearchText(tile: HTMLElement): string {
  return (tile.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function inferTileMeta(title: string, index: number): TileFilterMeta {
  const t = title.toLowerCase();
  const diseases = inferDiseasesFromText(title);

  const ages: string[] = ["Teens & adults 13–64 years"];
  if (/chickenpox|mmr|meningococcal/.test(t)) {
    ages.push("Infants under 1 year", "Children 2–12 years");
  }
  if (index % 7 === 0) ages.push("Infants under 1 year");
  if (index % 3 === 0) ages.push("Children 2–12 years");
  if (/shingles|pneumococcal|flu|influenza/.test(t) || index % 5 === 0) {
    ages.push("Adults 65+");
  }

  const regions = new Set<string>(["Europe"]);
  if (/typhoid|hepatitis|yellow|japanese|cholera|dengue|rabies|meningococcal/.test(t)) {
    regions.add("South-East Asia");
    regions.add("Africa");
    regions.add("Americas");
    regions.add("Western Pacific");
  }
  if (/meningococcal/.test(t)) regions.add("Eastern Mediterranean");

  const countries = new Set<string>();
  if (
    regions.has("South-East Asia") ||
    /japanese|dengue|typhoid|hepatitis|cholera|rabies|yellow/.test(t)
  ) {
    for (const country of [
      "Thailand",
      "Malaysia",
      "Indonesia",
      "Philippines",
      "Vietnam",
      "Singapore",
      "Cambodia",
    ]) {
      countries.add(country);
    }
  }
  if (/yellow|rabies/.test(t)) {
    countries.add("Kenya");
    countries.add("Tanzania");
    countries.add("South Africa");
  }

  return {
    ages: [...new Set(ages)],
    diseases: [...new Set(diseases)],
    regions: [...regions],
    countries: [...countries],
  };
}

function ensureTileMeta(tile: HTMLElement, index: number): TileFilterMeta {
  if (tile.dataset.protoFilterMeta) {
    try {
      return JSON.parse(tile.dataset.protoFilterMeta) as TileFilterMeta;
    } catch {
      /* re-tag below */
    }
  }
  const meta = inferTileMeta(getTileTitle(tile), index);
  tile.dataset.protoFilterMeta = JSON.stringify(meta);
  return meta;
}

function matchesAnySelected(selected: string[], tags: string[], haystack: string): boolean {
  if (!selected.length) return true;
  const blob = `${tags.join(" ")} ${haystack}`.toLowerCase();
  return selected.some((value) => blob.includes(value.toLowerCase()));
}

function jabTileMatches(tile: HTMLElement, filters: ActivePlpFilters, index: number): boolean {
  const meta = ensureTileMeta(tile, index);
  const haystack = getTileSearchText(tile);

  if (filters.ages && !matchesAnySelected(filters.ages, meta.ages, haystack)) {
    return false;
  }
  if (
    filters.diseases.length &&
    !filters.diseases.some((disease) =>
      diseaseFilterMatchesLabel(haystack, disease) ||
      matchesAnySelected([disease], meta.diseases, haystack)
    )
  ) {
    return false;
  }
  if (!matchesAnySelected(filters.regions, meta.regions, haystack)) return false;
  if (
    filters.countries.length &&
    !filters.countries.some((country) =>
      jabCoversCountry(meta, country, filters.regions)
    )
  ) {
    return false;
  }
  return true;
}

function countCountryAvailability(
  country: string,
  jabTiles: HTMLElement[],
  filters: ActivePlpFilters
): number {
  const testFilters: ActivePlpFilters = {
    ...filtersWithoutFacet(filters, "country"),
    countries: [country],
  };

  if (filters.showBundles) {
    return PLP_BUNDLE_ITEMS.reduce((count, item) => {
      return bundleItemMatches(item, testFilters) ? count + 1 : count;
    }, 0);
  }

  return jabTiles.reduce((count, tile, index) => {
    return jabTileMatches(tile, testFilters, index) ? count + 1 : count;
  }, 0);
}

function bundleItemMatches(item: PlpBundleItem, filters: ActivePlpFilters): boolean {
  const haystack = `${item.title} ${item.subtitle} ${item.description}`.toLowerCase();

  if (
    filters.diseases.length &&
    !filters.diseases.some((disease) => diseaseFilterMatchesLabel(haystack, disease))
  ) {
    return false;
  }
  if (!matchesAnySelected(filters.regions, item.regions, haystack)) return false;
  if (!matchesAnySelected(filters.countries, item.countries, haystack)) return false;
  return true;
}

function setTilePriceLabel(tile: HTMLElement, label: string): void {
  Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).forEach((p) => {
    if (/price for 1 dose|bundle price/i.test(p.textContent ?? "")) {
      p.textContent = label;
    }
  });
}

function setTilePriceAmount(tile: HTMLElement, amount: string): void {
  const priceRoot = tile.querySelector('[data-name="component.product.price"]');
  const amountEl = priceRoot?.querySelectorAll("p")[1];
  if (amountEl) amountEl.textContent = amount;
}

function findSubtitleEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      /text-\[#7a7d87\]/.test(p.className)
    ) ?? null
  );
}

function findDescriptionEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) => {
      const text = (p.textContent ?? "").trim();
      if (text.length <= 48) return false;
      if (
        /leading-\[38px\].*text-\[24px\]|text-\[24px\].*leading-\[38px\]/.test(
          p.className
        )
      ) {
        return false;
      }
      if (/text-\[#7a7d87\]/.test(p.className)) return false;
      if (/text-\[#459827\]/.test(p.className)) return false;
      if (/text-\[10px\]/.test(p.className)) return false;
      if (p.closest('[data-name="component.input.button"]')) return false;
      if (p.closest('[data-name="Label"]')) return false;
      return (
        /leading-\[24px\]/.test(p.className) ||
        (/text-\[13px\]/.test(p.className) && /text-\[#3a3a3a\]/.test(p.className))
      );
    }) ?? null
  );
}

function findSavingsEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      /text-\[#459827\]/.test(p.className)
    ) ?? null
  );
}

function formatBundleSubtitle(bundle: PlpBundleItem): string {
  const noun = bundle.jabCount === 1 ? "jab" : "jabs";
  return `${bundle.subtitle} · ${bundle.jabCount} ${noun}`;
}

function applyBundleToTile(tile: HTMLElement, bundle: PlpBundleItem): void {
  findTitleEl(tile)?.replaceChildren(document.createTextNode(bundle.title));
  findSubtitleEl(tile)?.replaceChildren(
    document.createTextNode(formatBundleSubtitle(bundle))
  );
  findDescriptionEl(tile)?.replaceChildren(
    document.createTextNode(bundle.description)
  );
  findSavingsEl(tile)?.replaceChildren(document.createTextNode(bundle.savings));
  setTilePriceLabel(tile, "Bundle price");
  setTilePriceAmount(tile, bundle.price);
}

function ensureBundleTiles(
  container: HTMLElement,
  template: HTMLElement
): HTMLElement[] {
  const existing = Array.from(
    container.querySelectorAll<HTMLElement>('[data-proto-plp-bundle="true"]')
  );
  if (existing.length >= PLP_BUNDLE_ITEMS.length) {
    existing.forEach((tile, index) => {
      if (index < PLP_BUNDLE_ITEMS.length) {
        applyBundleToTile(tile, PLP_BUNDLE_ITEMS[index]);
      }
    });
    return existing.slice(0, PLP_BUNDLE_ITEMS.length);
  }

  const created: HTMLElement[] = [];
  PLP_BUNDLE_ITEMS.forEach((bundle) => {
    const tile = template.cloneNode(true) as HTMLElement;
    tile.dataset.protoPlpBundle = "true";
    tile.removeAttribute("data-proto-plp-jab");
    tile.removeAttribute("data-proto-filter-meta");
    tile.style.display = "none";
    tile.classList.remove("proto-plp-tile--in");
    applyBundleToTile(tile, bundle);
    container.appendChild(tile);
    created.push(tile);
  });
  return created;
}

function selectRadioInSection(section: HTMLElement | null, labelPattern: RegExp): void {
  if (!section) return;

  const list =
    section.querySelector<HTMLElement>('[data-name="list"]') ?? section;
  const radios = list.querySelectorAll<HTMLElement>(
    '[data-name="component.input.radio"]'
  );
  if (!radios.length) return;

  radios.forEach((row) => {
    row.dataset.radioChecked = "false";
  });

  const match = Array.from(radios).find((row) =>
    labelPattern.test(radioLabel(row))
  );
  if (match) {
    match.dataset.radioChecked = "true";
    list
      .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
      .forEach((row) => {
        row.dataset.checkboxChecked = "false";
      });
  }
}

function syncPlpSearchInputClearState(
  input: HTMLInputElement,
  value = input.value
): void {
  const textField = input.closest<HTMLElement>('[data-name="Text Field"]');
  if (!textField) return;

  textField.dataset.protoSearchFilled = value.trim() ? "true" : "false";
  const clearBtn = textField.querySelector<HTMLButtonElement>(
    ".proto-plp-search-clear"
  );
  if (clearBtn) {
    const show = value.trim().length > 0;
    clearBtn.hidden = !show;
    clearBtn.style.display = show ? "" : "none";
    clearBtn.tabIndex = show ? 0 : -1;
    clearBtn.setAttribute("aria-hidden", show ? "false" : "true");
  }
}

export function clearPlpFilterSectionSearch(section: HTMLElement): void {
  const input = section.querySelector<HTMLInputElement>(".proto-search-input");
  if (!input) return;

  input.value = "";
  syncPlpSearchInputClearState(input, "");
  syncFilterSectionListSearch(section);
  input.focus();
}

function plpFilterSectionHasVisibleItems(section: HTMLElement): boolean {
  const list = section.querySelector<HTMLElement>('[data-name="list"]');
  if (!list) return true;

  return Array.from(
    list.querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
  ).some((item) => item.style.display !== "none");
}

/** View All — when search has no matches, clear the field like the in-field X. */
export function handlePlpFilterViewAllClick(link: HTMLElement): void {
  const section = link.closest<HTMLElement>(
    '[data-name="component.plp.filter.custom"], [data-name="component.plp.filter.brands"]'
  );
  if (!section) return;

  if (!readSearchQuery(section)) return;
  if (plpFilterSectionHasVisibleItems(section)) return;

  clearPlpFilterSectionSearch(section);
}

function clearPlpFilterSearchFields(root: ParentNode): void {
  const module = root.querySelector(PLP_FILTERS_SELECTOR);
  if (!module) return;

  module.querySelectorAll<HTMLInputElement>(".proto-search-input").forEach((input) => {
    input.value = "";
    syncPlpSearchInputClearState(input, "");
  });
}

type PlpActiveFilterChip = {
  facet: "age" | "disease" | "region" | "country";
  label: string;
};

function collectActivePlpFilterChips(root: ParentNode): PlpActiveFilterChip[] {
  const filters = readActivePlpFilters(root);
  const chips: PlpActiveFilterChip[] = [];

  filters.ages?.forEach((label) => chips.push({ facet: "age", label }));
  filters.diseases.forEach((label) => chips.push({ facet: "disease", label }));
  filters.regions.forEach((label) => chips.push({ facet: "region", label }));
  filters.countries.forEach((label) => chips.push({ facet: "country", label }));

  return chips;
}

function uncheckFilterCheckboxByLabel(
  section: HTMLElement | null,
  label: string
): void {
  if (!section) return;

  const target = label.trim().toLowerCase();
  section
    .querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
    .forEach((item) => {
      if (getFilterCheckboxItemLabel(item).trim().toLowerCase() !== target) return;
      const row = item.querySelector<HTMLElement>(
        '[data-name="component.input.checkbox"]'
      );
      if (row) row.dataset.checkboxChecked = "false";
    });
}

function removePlpFilterChip(
  root: ParentNode,
  facet: PlpActiveFilterChip["facet"],
  label: string
): void {
  switch (facet) {
    case "age": {
      const section = findFilterSection(root, /by age/i);
      uncheckFilterCheckboxByLabel(section, label);
      if (section && readCheckedCheckboxLabels(section).length === 0) {
        selectRadioInSection(section, /all age groups/i);
      }
      break;
    }
    case "disease":
      uncheckFilterCheckboxByLabel(findFilterSection(root, /by disease/i), label);
      break;
    case "region":
      uncheckFilterCheckboxByLabel(findFilterSection(root, /by region/i), label);
      break;
    case "country":
      uncheckFilterCheckboxByLabel(findFilterSection(root, /by country/i), label);
      break;
  }
}

function wirePlpActiveFilterChipLinks(
  controls: HTMLElement,
  root: ParentNode
): void {
  if (controls.dataset.protoPlpFilterChipsWired === "1") return;

  controls.addEventListener("click", (e) => {
    const chip = (e.target as Element | null)?.closest<HTMLAnchorElement>(
      "a.proto-plp-filter-chip"
    );
    if (!chip || !controls.contains(chip)) return;

    e.preventDefault();
    e.stopPropagation();

    const facet = chip.dataset.protoPlpFilterFacet as
      | PlpActiveFilterChip["facet"]
      | undefined;
    const label = chip.dataset.protoPlpFilterLabel;
    if (!facet || !label) return;

    removePlpFilterChip(root, facet, label);
    syncPlpListingFilters(root);
  });

  controls.dataset.protoPlpFilterChipsWired = "1";
}

function buildPlpResetFiltersButton(root: ParentNode): HTMLButtonElement {
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.dataset.protoPlpResetFilters = "true";
  resetBtn.dataset.protoPlpResetBuilt = "7";
  resetBtn.className =
    "proto-tertiary-cta proto-tertiary-cta--compact proto-plp-reset-filters-link";
  resetBtn.setAttribute("aria-label", "Reset Filters");

  const iconWrap = document.createElement("span");
  iconWrap.className = "proto-tertiary-cta__icon";
  iconWrap.innerHTML = protoTrashIconSvg;

  const label = document.createElement("span");
  label.className = "proto-tertiary-cta__label";
  label.textContent = "Reset Filters";

  resetBtn.append(iconWrap, label);
  resetBtn.addEventListener("click", () => resetPlpFilters(root));
  return resetBtn;
}

function ensurePlpResetFiltersButton(
  messageRow: HTMLElement,
  root: ParentNode
): HTMLButtonElement {
  const controls = messageRow.closest<HTMLElement>(
    '[data-name="component.filter.controls"]'
  );

  let resetBtn =
    messageRow.querySelector<HTMLButtonElement>(
      '[data-proto-plp-reset-filters="true"]'
    ) ??
    controls?.querySelector<HTMLButtonElement>(
      '[data-proto-plp-reset-filters="true"]'
    ) ??
    null;

  if (resetBtn && resetBtn.dataset.protoPlpResetBuilt !== "7") {
    const fresh = buildPlpResetFiltersButton(root);
    resetBtn.replaceWith(fresh);
    resetBtn = fresh;
  }

  if (!resetBtn) {
    resetBtn = buildPlpResetFiltersButton(root);
  }

  if (resetBtn.parentElement !== messageRow) {
    messageRow.appendChild(resetBtn);
  }

  return resetBtn;
}

function ensurePlpFilterControlsChrome(
  controls: HTMLElement,
  root: ParentNode
): { summaryEl: HTMLElement; resetBtn: HTMLButtonElement } {
  controls.classList.add("proto-plp-filter-controls");

  let messageRow = controls.querySelector<HTMLElement>(
    ".proto-plp-filter-controls__row"
  );
  if (!messageRow) {
    messageRow = document.createElement("div");
    messageRow.className = "proto-plp-filter-controls__row";
    controls.replaceChildren(messageRow);
  }

  let summaryEl = messageRow.querySelector<HTMLElement>(".proto-plp-results-summary");
  if (!summaryEl) {
    summaryEl = document.createElement("p");
    summaryEl.className = "proto-plp-results-summary leading-[24px]";
    messageRow.prepend(summaryEl);
  } else if (summaryEl.parentElement !== messageRow) {
    messageRow.prepend(summaryEl);
  }

  const resetBtn = ensurePlpResetFiltersButton(messageRow, root);

  wirePlpActiveFilterChipLinks(controls, root);

  return { summaryEl, resetBtn };
}

function renderPlpResultsSummary(
  summaryEl: HTMLElement,
  visible: number,
  noun: string,
  filtersActive: boolean,
  chips: PlpActiveFilterChip[]
): void {
  summaryEl.replaceChildren();

  if (filtersActive && chips.length) {
    summaryEl.append(
      document.createTextNode(`${visible} ${noun} found for `)
    );
    chips.forEach((chip, index) => {
      if (index > 0) {
        summaryEl.appendChild(document.createTextNode(", "));
      }
      const link = document.createElement("a");
      link.href = "#";
      link.className = "proto-link proto-plp-filter-chip";
      link.dataset.protoPlpFilterFacet = chip.facet;
      link.dataset.protoPlpFilterLabel = chip.label;
      link.textContent = chip.label;
      summaryEl.appendChild(link);
    });
    return;
  }

  if (filtersActive) {
    summaryEl.textContent = `${visible} ${noun} found`;
    return;
  }

  summaryEl.textContent = `${visible} ${noun} available`;
}

/** Reset PLP sidebar filters to defaults and refresh the listing. */
export function resetPlpFilters(root: ParentNode = document): void {
  const module = root.querySelector(PLP_FILTERS_SELECTOR);
  if (!module) return;

  module
    .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
    .forEach((row) => {
      row.dataset.checkboxChecked = "false";
    });

  selectRadioInSection(findFilterSection(root, /by type/i), /^individual jabs$/i);
  selectRadioInSection(findFilterSection(root, /by age/i), /all age groups/i);
  clearPlpFilterSearchFields(root);
  cancelPlpListingLoadTimer();
  syncPlpFilterListSearch(root, { refreshResults: false });
  syncPlpListingResults(root, { simulateLoad: true });
}

function updateResultsCount(
  root: ParentNode,
  visible: number,
  animate = false
): void {
  const controls = root.querySelector<HTMLElement>(
    '[data-name="component.filter.controls"]'
  );
  if (!controls) return;

  const filtersActive = isPlpFiltersActive(root);
  const chips = collectActivePlpFilterChips(root);
  const { summaryEl, resetBtn } = ensurePlpFilterControlsChrome(controls, root);

  const typeMode = getPlpByTypeMode(root);
  const noun =
    typeMode === "bundles"
      ? visible === 1
        ? "bundle"
        : "bundles"
      : visible === 1
        ? "jab"
        : "jabs";

  renderPlpResultsSummary(summaryEl, visible, noun, filtersActive, chips);

  summaryEl.classList.remove("proto-plp-results-count--loading");

  if (animate) {
    summaryEl.classList.remove("proto-plp-results-count--in");
    requestAnimationFrame(() => {
      summaryEl.classList.add("proto-plp-results-count--in");
    });
  }

  resetBtn.hidden = !filtersActive;
  resetBtn.style.display = filtersActive ? "" : "none";
}

/** @deprecated Use syncPlpListingFilters */
export function syncPlpListingTypeFilter(root: ParentNode = document): void {
  syncPlpListingFilters(root);
}
