import { describe, expect, it } from "vitest";
import {
  INDEX_PLP,
  PROJECT_SCREENS,
} from "@/projects/boots-pharmacy/screens/screens";
import {
  getPlpCountryCandidates,
  PLP_TRAVEL_COUNTRIES_BY_REGION,
} from "@/projects/boots-pharmacy/data/plpListing";
import {
  DEFAULT_PLP_FILTERS,
  PLP_COUNTRY_OPTIONS,
  PLP_FILTER_LIST_MAX,
  PLP_LISTING_LOAD_MS,
  capPlpFilterOptionList,
  collectPlpActiveFilterChips,
  collectPlpCountryFilterLabels,
  countPlpFacetOption,
  filterOptionList,
  filterPlpCatalog,
  isPlpFiltersDirty,
  plpResultsNoun,
  removePlpActiveFilterChip,
  togglePlpFilterValue,
} from "../plpCatalog";
import {
  PLP_CHILD_INDEX,
  PLP_REACT_SCREEN_ID,
  PLP_SCREEN_SELECTOR,
} from "../plpContract";

describe("plpContract", () => {
  it("matches Studio screen registry child index for PLP", () => {
    const screen = PROJECT_SCREENS.find((s) => /plp\. vaccinations/i.test(s.label));
    expect(screen?.childIndex).toBe(PLP_CHILD_INDEX);
    expect(screen?.screenId).toBe(PLP_REACT_SCREEN_ID);
    expect(INDEX_PLP).toBe(
      PROJECT_SCREENS.findIndex((s) => s.childIndex === PLP_CHILD_INDEX)
    );
    expect(PLP_SCREEN_SELECTOR).toContain(`nth-child(${PLP_CHILD_INDEX})`);
    expect(PLP_REACT_SCREEN_ID).toBe("plp");
  });
});

describe("plpCatalog filters", () => {
  it("defaults to individual jabs and not dirty", () => {
    expect(DEFAULT_PLP_FILTERS.showBundles).toBe(false);
    expect(isPlpFiltersDirty(DEFAULT_PLP_FILTERS)).toBe(false);
    expect(filterPlpCatalog(DEFAULT_PLP_FILTERS).length).toBeGreaterThan(0);
    expect(
      filterPlpCatalog(DEFAULT_PLP_FILTERS).every((item) => item.kind === "jab")
    ).toBe(true);
  });

  it("switches to bundles and marks dirty", () => {
    const bundles = filterPlpCatalog({
      ...DEFAULT_PLP_FILTERS,
      showBundles: true,
    });
    expect(bundles.length).toBeGreaterThan(0);
    expect(bundles.every((item) => item.kind === "bundle")).toBe(true);
    expect(
      isPlpFiltersDirty({ ...DEFAULT_PLP_FILTERS, showBundles: true })
    ).toBe(true);
  });

  it("narrows by disease checkbox", () => {
    const next = togglePlpFilterValue(
      DEFAULT_PLP_FILTERS,
      "diseases",
      "Chickenpox"
    );
    const items = filterPlpCatalog(next);
    expect(items.some((item) => /chickenpox/i.test(item.title))).toBe(true);
    expect(items.every((item) => item.diseases.includes("Chickenpox"))).toBe(
      true
    );
  });

  it("collects and removes active filter chips like Make summary", () => {
    const dirty = togglePlpFilterValue(
      DEFAULT_PLP_FILTERS,
      "diseases",
      "Chickenpox"
    );
    const chips = collectPlpActiveFilterChips(dirty);
    expect(chips).toEqual([{ facet: "diseases", label: "Chickenpox" }]);
    expect(plpResultsNoun(dirty, 1)).toBe("jab");
    expect(PLP_LISTING_LOAD_MS).toBe(450);
    const cleared = removePlpActiveFilterChip(
      dirty,
      "diseases",
      "Chickenpox"
    );
    expect(collectPlpActiveFilterChips(cleared)).toEqual([]);
    expect(isPlpFiltersDirty(cleared)).toBe(false);
  });

  it("caps filter option lists at Make PLP_FILTER_LIST_MAX with View all expand", () => {
    expect(PLP_FILTER_LIST_MAX).toBe(10);
    expect(PLP_COUNTRY_OPTIONS.length).toBeGreaterThan(PLP_FILTER_LIST_MAX);
    const capped = capPlpFilterOptionList(PLP_COUNTRY_OPTIONS);
    expect(capped).toHaveLength(PLP_FILTER_LIST_MAX);
    expect(
      capPlpFilterOptionList(PLP_COUNTRY_OPTIONS, { expanded: true })
    ).toHaveLength(PLP_COUNTRY_OPTIONS.length);
    const filtered = filterOptionList(PLP_COUNTRY_OPTIONS, "th");
    expect(
      capPlpFilterOptionList(filtered, { querying: true }).length
    ).toBe(filtered.length);
  });

  it("counts filter facet options like Make sidebar counters", () => {
    const chicken = countPlpFacetOption(
      DEFAULT_PLP_FILTERS,
      "diseases",
      "Chickenpox"
    );
    expect(chicken).toBeGreaterThan(0);
    const thai = countPlpFacetOption(
      DEFAULT_PLP_FILTERS,
      "countries",
      "Thailand"
    );
    expect(thai).toBeGreaterThan(0);
  });

  it("narrows By Country list when a region is selected (Make cascade)", () => {
    const europeCandidates = getPlpCountryCandidates(["Europe"]);
    expect(europeCandidates).toEqual([
      ...PLP_TRAVEL_COUNTRIES_BY_REGION.Europe,
    ]);
    expect(europeCandidates).toContain("France");
    expect(europeCandidates).not.toContain("Thailand");

    const withEurope = togglePlpFilterValue(
      DEFAULT_PLP_FILTERS,
      "regions",
      "Europe"
    );
    const labels = collectPlpCountryFilterLabels(withEurope);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((c) => europeCandidates.includes(c))).toBe(true);
    expect(labels).toContain("France");
    expect(labels).not.toContain("Thailand");

    // Counters stay on the cascade (score > 0 only).
    for (const label of labels) {
      expect(
        countPlpFacetOption(withEurope, "countries", label)
      ).toBeGreaterThan(0);
    }
  });

  it("clears country selections when region toggles (Make wire)", () => {
    const withCountry = togglePlpFilterValue(
      DEFAULT_PLP_FILTERS,
      "countries",
      "Thailand"
    );
    expect(withCountry.countries).toEqual(["Thailand"]);
    const withRegion = togglePlpFilterValue(withCountry, "regions", "Europe");
    expect(withRegion.regions).toEqual(["Europe"]);
    expect(withRegion.countries).toEqual([]);
  });
});

describe("plp loading count source contract", () => {
  it("hides jab-count text while listingPhase is loading", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../PlpScreen.tsx"),
      "utf8"
    );
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    expect(code).toMatch(/data-studio-plp-results-loading/);
    expect(code).toMatch(/listingPhase\s*===\s*["']loading["']\s*\?\s*null/);
    expect(code).not.toMatch(
      /listingPhase\s*===\s*["']loading["']\s*\?[\s\S]{0,120}available/
    );
    // Idle/reveal path still has real count copy.
    expect(code).toMatch(/\$\{displayItems\.length\} \$\{noun\} available/);
  });
});
