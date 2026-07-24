import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLP_FILTERS,
  countPlpFacetOption,
  dropZeroCountFacetValues,
  togglePlpFilterValue,
  type PlpCatalogItem,
} from "../plpCatalog";

function jab(overrides: Partial<PlpCatalogItem>): PlpCatalogItem {
  return {
    id: overrides.id ?? "jab-1",
    kind: "jab",
    title: "Test Jab",
    subtitle: "",
    description: "",
    price: "£10",
    priceNote: "",
    ages: ["Adults 65+ years"],
    diseases: ["Flu"],
    regions: ["Europe"],
    countries: ["France"],
    searchTerms: [],
    ...overrides,
  };
}

// I3c (PLP_LEGACY_PARITY_REGISTER.md): a checked facet value whose leave-one-out
// count hits 0 must auto-uncheck (Legacy `setFilterCheckboxItemState` L746–765).
describe("PLP filter cascade — I3c zero-count disable/auto-uncheck", () => {
  const jabs: PlpCatalogItem[] = [
    jab({ id: "flu-europe", diseases: ["Flu"], regions: ["Europe"] }),
    jab({ id: "malaria-africa", diseases: ["Malaria"], regions: ["Africa"] }),
  ];

  it("reports a 0 leave-one-out count for a disease that never co-occurs with the selected region", () => {
    const state = togglePlpFilterValue(DEFAULT_PLP_FILTERS, "regions", "Europe");
    // Only "flu-europe" survives the region filter; "Malaria" has zero matches within it.
    expect(countPlpFacetOption(state, "diseases", "Malaria", jabs, [])).toBe(0);
    expect(countPlpFacetOption(state, "diseases", "Flu", jabs, [])).toBe(1);
  });

  it("auto-unchecks a selected facet value once another selection drives its count to 0", () => {
    let state = togglePlpFilterValue(DEFAULT_PLP_FILTERS, "diseases", "Malaria");
    state = togglePlpFilterValue(state, "regions", "Europe");
    expect(state.diseases).toEqual(["Malaria"]);

    const { filters, changed } = dropZeroCountFacetValues(state, jabs, []);
    expect(changed).toBe(true);
    expect(filters.diseases).toEqual([]);
  });

  it("is a no-op once no selected value has a 0 count", () => {
    const state = togglePlpFilterValue(DEFAULT_PLP_FILTERS, "diseases", "Flu");
    const { filters, changed } = dropZeroCountFacetValues(state, jabs, []);
    expect(changed).toBe(false);
    expect(filters).toBe(state);
  });

  it("converges in one pass even when multiple facets need dropping", () => {
    let state = togglePlpFilterValue(DEFAULT_PLP_FILTERS, "diseases", "Malaria");
    state = togglePlpFilterValue(state, "ages", "Infants under 1 year");
    state = togglePlpFilterValue(state, "regions", "Europe");

    const { filters, changed } = dropZeroCountFacetValues(state, jabs, []);
    expect(changed).toBe(true);
    expect(filters.diseases).toEqual([]);
    expect(filters.ages).toEqual([]);
    expect(filters.regions).toEqual(["Europe"]);

    const second = dropZeroCountFacetValues(filters, jabs, []);
    expect(second.changed).toBe(false);
  });
});
