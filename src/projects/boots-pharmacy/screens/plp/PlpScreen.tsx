import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { TertiaryCta } from "@/app/chrome/TertiaryCta";
import plpHeroImage from "@/projects/boots-pharmacy/frame/5b75d20d7a0df34031ca23477a68cf97cac4938d.png";
import plpBodyFill from "@/projects/boots-pharmacy/frame/dbcd84d6da292330c6f57adefa32dd4b969ac8bd.png";
import {
  isInWishlist,
  plpTileWishlistId,
  toggleWishlist,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import { useCommitPendingToggle } from "@/app/interaction/useCommitPendingToggle";
import { waitStudioContentLoad } from "@/uxds/motion";
import { ButtonPrimary, SearchField } from "@/uxds/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  CommitPulseIcon,
  PendingSpinnerIcon,
} from "@/uxds/interactions";
import {
  DEFAULT_PLP_FILTERS,
  PLP_AGE_OPTIONS,
  PLP_DISEASE_OPTIONS,
  PLP_FILTER_LIST_MAX,
  PLP_LISTING_LOAD_MS,
  PLP_REGION_OPTIONS,
  PLP_WISHLIST_ADD_DELAY_MS,
  capPlpFilterOptionList,
  collectPlpActiveFilterChips,
  collectPlpCountryFilterLabels,
  countPlpFacetOption,
  countPlpTypeOption,
  dropZeroCountFacetValues,
  filterOptionList,
  filterPlpCatalog,
  isPlpFiltersDirty,
  plpResultsNoun,
  removePlpActiveFilterChip,
  togglePlpFilterValue,
  type PlpCatalogItem,
  type PlpFilterState,
} from "./plpCatalog";
import { PLP_REACT_SCREEN_ID } from "./plpContract";
import "./plp.css";

type ListingPhase = "idle" | "loading" | "reveal";

export type PlpScreenProps = {
  onBookNow: (item: PlpCatalogItem) => void;
  onQuickView: (item: PlpCatalogItem) => void;
  onGoHome: () => void;
  onFiltersDirtyChange?: (dirty: boolean) => void;
};

function ChevronGlyph() {
  return (
    <span className="plp__chevron" aria-hidden>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path
          d="M1.2 1.2 8 8.2l6.8-7"
          stroke="#5C5C5C"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function BookmarkGlyph() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M8.97666 0.739019C8.65666 0.958352 8.3648 1.22079 8.1094 1.51851L7.9994 1.65068C7.7186 1.29817 7.38906 0.990592 7.023 0.739545C6.16554 0.151519 5.10788 -0.126355 4.00824 0.0548652C3.46077 0.146165 2.92962 0.331285 2.43333 0.607132C1.93684 0.881965 1.49417 1.23659 1.12197 1.65503C-0.520466 3.50007 -0.32604 6.37247 1.48489 7.99807L1.61087 8.10693C1.8692 8.3232 2.1194 8.54207 2.35995 8.76253L8 14L13.642 8.7614C13.8817 8.54007 14.1302 8.32287 14.3873 8.10947C16.3162 6.50553 16.5585 3.54285 14.8775 1.65471C14.5067 1.23784 14.0648 0.884092 13.5664 0.607105C13.1395 0.369819 12.6875 0.199439 12.2241 0.0991519L11.9915 0.0548652C10.8915 -0.126435 9.83333 0.151765 8.97666 0.739019Z"
      />
    </svg>
  );
}

/** Legacy Reset Filters trash glyph — stroke tertiary (studio-tertiary-cta). */
function TrashGlyph() {
  return (
    <svg
      className="studio-tertiary-cta__svg--stroke"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path d="M2.5 4h11" strokeLinecap="round" />
      <path
        d="M5.25 4V3.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.25 4l.65 8.25a1.25 1.25 0 0 0 1.25 1.25h3.7a1.25 1.25 0 0 0 1.25-1.25L11.75 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 6.75v4.5M9.5 6.75v4.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeGlyph() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0C4.5 0 1.6 2.1 0 5c1.6 2.9 4.5 5 8 5s6.4-2.1 8-5c-1.6-2.9-4.5-5-8-5Zm0 8.2A3.2 3.2 0 1 1 8 1.8a3.2 3.2 0 0 1 0 6.4Z"
      />
    </svg>
  );
}

function RadioRow({
  checked,
  label,
  count,
  onSelect,
}: {
  checked: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="plp__option-row"
      data-name="component.input.radio"
      data-radio-checked={String(checked)}
      data-studio-plp-option-count={String(count)}
      data-studio-action={`plp-filter-radio-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      aria-checked={checked}
      role="radio"
      onClick={onSelect}
    >
      <span className={`plp__radio${checked ? " is-on" : ""}`} aria-hidden />
      <span className="plp__option-label">{label}</span>
      <span className="plp__option-count">{count}</span>
    </button>
  );
}

function CheckboxRow({
  checked,
  label,
  count,
  onToggle,
}: {
  checked: boolean;
  label: string;
  count: number;
  onToggle: () => void;
}) {
  // I3c: zero-count rows are unselectable (Legacy `setFilterCheckboxItemState`
  // L746–765) — checked+0 is only ever a transient render before the
  // auto-uncheck effect (PlpScreen) settles it, never a stable state.
  const disabled = count === 0;
  return (
    <button
      type="button"
      className="plp__option-row"
      data-name="component.plp.filter.checkbox.item"
      data-studio-plp-option-count={String(count)}
      data-studio-action={`plp-filter-checkbox-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onToggle}
    >
      <span
        className={`plp__checkbox${checked ? " is-on" : ""}`}
        data-name="component.input.checkbox"
        data-checkbox-checked={String(checked)}
        data-studio-react-owned="true"
        aria-hidden
      />
      <span className="plp__option-label" data-name="Label">
        <span>{label}</span>
      </span>
      <span className="plp__option-count">{count}</span>
    </button>
  );
}

/**
 * Legacy PLP filter search — UXDS SearchField, magnifier END (right), one clear.
 * Filled + View all → reset field (wire `handlePlpFilterViewAllClick` / clear).
 */
function FilterSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <SearchField
      className="plp__search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      iconPosition="end"
      clearable
      aria-label={placeholder}
    />
  );
}

/** Legacy `component.plp.filter.view-all` — always under disease/country lists. */
function FilterViewAll({
  section,
  onActivate,
}: {
  section: "disease" | "country";
  onActivate: () => void;
}) {
  return (
    <a
      href="#"
      className="plp__view-all uxds-link"
      data-name="component.plp.filter.view-all"
      data-studio-plp-view-all="true"
      data-studio-action={`plp-filter-view-all-${section}`}
      onClick={(e) => {
        e.preventDefault();
        onActivate();
      }}
    >
      View all
    </a>
  );
}

function ServiceTile({
  item,
  tileIndex,
  staggerMs,
  reveal,
  probeBelowFold,
  onBookNow,
  onQuickView,
}: {
  item: PlpCatalogItem;
  tileIndex: number;
  staggerMs?: number;
  reveal?: boolean;
  /** Last-tile marker for MCP below-fold scroll prove. */
  probeBelowFold?: boolean;
  onBookNow: () => void;
  onQuickView: () => void;
}) {
  // Click-optimistic only. Empty hover = Legacy tertiary navy (CSS), NOT fuchsia.
  const {
    active: heartActive,
    pending: wishlistCommitPending,
    pulseKey: commitPulseKey,
    onPointerDown: onWishlistPointerDown,
    onClick: onWishlistClick,
  } = useCommitPendingToggle(
    plpTileWishlistId(tileIndex),
    isInWishlist,
    toggleWishlist,
    PLP_WISHLIST_ADD_DELAY_MS
  );

  return (
    <article
      className={`plp__tile${reveal ? " plp__tile--in" : ""}`}
      data-name="boots-pharmacy.service.tile"
      data-studio-plp-tile-id={item.id}
      data-studio-plp-tile-index={String(tileIndex)}
      style={
        staggerMs != null
          ? ({ ["--plp-stagger"]: `${staggerMs}ms` } as CSSProperties)
          : undefined
      }
    >
      <div className="plp__tile-main">
        <div className="plp__tile-copy">
          <div className="plp__tile-titles">
            <a
              href="#pdp"
              className="plp__tile-title-link proto-plp-tile-title-link"
              data-name="component.plp.tile.title"
              data-studio-action={`plp-tile-title-${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onBookNow();
              }}
            >
              <p className="plp__tile-title">{item.title}</p>
            </a>
            <p className="plp__tile-subtitle">{item.subtitle}</p>
          </div>
          <p className="plp__tile-desc">{item.description}</p>
          <div className="plp__tile-tertiaries">
            <button
              type="button"
              className="plp__tertiary"
              data-name="component.input.button"
              data-studio-wishlist-id={plpTileWishlistId(tileIndex)}
              data-studio-action={`plp-tile-wishlist-${item.id}`}
              data-studio-bookmarked={heartActive ? "true" : "false"}
              aria-pressed={heartActive}
              aria-label={
                wishlistCommitPending
                  ? "Saving to Bookmarks"
                  : heartActive
                    ? "Remove from Bookmarks"
                    : "Add to Bookmarks"
              }
              onPointerDown={onWishlistPointerDown}
              onClick={onWishlistClick}
            >
              <span
                className={`plp__tertiary-icon${heartActive ? " is-active" : ""}`}
                data-name="icon=add to wishlist"
                data-fav-active={String(heartActive)}
                data-fav-pending={String(wishlistCommitPending)}
              >
                {wishlistCommitPending ? (
                  <PendingSpinnerIcon size={16} />
                ) : commitPulseKey > 0 ? (
                  <CommitPulseIcon pulseKey={commitPulseKey}>
                    <BookmarkGlyph />
                  </CommitPulseIcon>
                ) : (
                  <BookmarkGlyph />
                )}
              </span>
              {wishlistCommitPending ? (
                <span className="plp__bookmark-label" data-bookmarked="pending">
                  Saving…
                </span>
              ) : heartActive ? (
                <span className="plp__bookmark-label" data-bookmarked="true">
                  <span className="plp__bookmark-label--default">
                    In your Bookmarks
                  </span>
                  <span className="plp__bookmark-label--hover">
                    Remove from Bookmarks
                  </span>
                </span>
              ) : (
                <span className="plp__bookmark-label" data-bookmarked="false">
                  Add to Bookmarks
                </span>
              )}
            </button>
            <button
              type="button"
              className="plp__tertiary"
              data-name="component.input.button"
              data-studio-quick-view="true"
              data-studio-action={`plp-tile-quickview-${item.id}`}
              {...(probeBelowFold
                ? { "data-studio-probe-below-fold": "true" }
                : {})}
              onClick={onQuickView}
            >
              <span className="plp__tertiary-icon" data-name="icon=view">
                <EyeGlyph />
              </span>
              <span>Quick View</span>
            </button>
          </div>
        </div>
        <div className="plp__tile-buy">
          <div className="plp__price-block">
            <p className="plp__price-note">{item.priceNote}</p>
            <div
              className="plp__price"
              data-name="component.product.price"
            >
              <span>£</span>
              <span>{item.price.replace(/^£/, "")}</span>
            </div>
            {item.accent ? (
              <p className="plp__price-accent">{item.accent}</p>
            ) : null}
          </div>
          <ButtonPrimary
            className="plp__book uxds-btn-primary--commerce"
            data-studio-action="plp-book-now"
            onClick={onBookNow}
          >
            Book now
          </ButtonPrimary>
        </div>
      </div>
    </article>
  );
}

/**
 * React + UXDS PLP — Vaccinations listing.
 * Retires Legacy HTML for Frame child 9; Studio hooks via data-name.
 */
export function PlpScreen({
  onBookNow,
  onQuickView,
  onGoHome,
  onFiltersDirtyChange,
}: PlpScreenProps) {
  const [filters, setFilters] = useState<PlpFilterState>(DEFAULT_PLP_FILTERS);

  // I3c (PLP_LEGACY_PARITY_REGISTER.md): a checked facet value whose
  // leave-one-out count drops to 0 auto-unchecks (Legacy `setFilterCheckboxItemState`
  // L746–765). Re-runs on every filters change; converges in bounded steps
  // since each pass only removes values.
  useEffect(() => {
    const { filters: next, changed } = dropZeroCountFacetValues(filters);
    if (changed) setFilters(next);
  }, [filters]);

  const [displayItems, setDisplayItems] = useState(() =>
    filterPlpCatalog(DEFAULT_PLP_FILTERS)
  );
  const [listingPhase, setListingPhase] = useState<ListingPhase>("idle");
  const [loadHostMinHeight, setLoadHostMinHeight] = useState<number | null>(
    null
  );
  /** View all expand (uncap beyond Legacy `PLP_FILTER_LIST_MAX`). */
  const [diseaseExpanded, setDiseaseExpanded] = useState(false);
  const [countryExpanded, setCountryExpanded] = useState(false);
  const syncPassRef = useRef(0);
  const tilesHostRef = useRef<HTMLDivElement | null>(null);

  const dirty = isPlpFiltersDirty(filters);
  const activeChips = collectPlpActiveFilterChips(filters);
  const noun = plpResultsNoun(filters, displayItems.length);

  useEffect(() => {
    onFiltersDirtyChange?.(dirty);
  }, [dirty, onFiltersDirtyChange]);

  // Platform content-load interim on first paint / refresh — not instant dump.
  // Shared waitStudioContentLoad (not a raw setTimeout) — same wait primitive
  // Chat's browse-entry reveal uses, so every content-load interim honors the
  // same abort/no-compress contract (LESSONS #topic-plp-listing-race: a raw
  // setTimeout here let a scripted click race the reveal and lose its
  // optimistic visual state).
  useEffect(() => {
    const next = filterPlpCatalog(filters);
    let cancelled = false;

    // Lock host height before tiles hide — prevents listing band collapse jump.
    const host = tilesHostRef.current;
    if (host) {
      const h = Math.round(host.getBoundingClientRect().height);
      setLoadHostMinHeight(Math.max(220, h));
    } else {
      setLoadHostMinHeight(220);
    }

    setListingPhase("loading");
    try {
      document.body.setAttribute("data-studio-content-loading", "plp");
    } catch {
      /* hang-safe */
    }

    void waitStudioContentLoad(PLP_LISTING_LOAD_MS, () => cancelled).then(() => {
      if (cancelled) return;
      setDisplayItems(next);
      setListingPhase("reveal");
      setLoadHostMinHeight(null);
      try {
        document.body.removeAttribute("data-studio-content-loading");
      } catch {
        /* hang-safe */
      }
      syncPassRef.current = Math.max(1, syncPassRef.current + 1);
    });

    return () => {
      cancelled = true;
      try {
        document.body.removeAttribute("data-studio-content-loading");
      } catch {
        /* hang-safe */
      }
    };
  }, [filters]);

  const diseaseFiltered = filterOptionList(
    PLP_DISEASE_OPTIONS,
    filters.diseaseQuery
  );
  // Legacy wire: region selection narrows country candidates (counters kept).
  const countryPool = collectPlpCountryFilterLabels(filters);
  const countryFiltered = filterOptionList(countryPool, filters.countryQuery);
  const diseaseQuerying = filters.diseaseQuery.trim().length > 0;
  const countryQuerying = filters.countryQuery.trim().length > 0;
  const diseaseOptions = capPlpFilterOptionList(diseaseFiltered, {
    expanded: diseaseExpanded,
    querying: diseaseQuerying,
  });
  const countryOptions = capPlpFilterOptionList(countryFiltered, {
    expanded: countryExpanded,
    querying: countryQuerying,
  });
  const diseaseCanExpand =
    !diseaseQuerying &&
    !diseaseExpanded &&
    diseaseFiltered.length > PLP_FILTER_LIST_MAX;
  const countryCanExpand =
    !countryQuerying &&
    !countryExpanded &&
    countryFiltered.length > PLP_FILTER_LIST_MAX;

  // During load: hide count entirely (no stale/fake jab totals). Real count
  // only after displayItems swap. ONE “Updating results…” under spinner only.
  const resultsCountClass =
    listingPhase === "loading"
      ? "plp__results-count plp__results-count--loading"
      : listingPhase === "reveal"
        ? "plp__results-count plp__results-count--in"
        : "plp__results-count";

  const tilesHostClass = [
    "plp__tiles-host",
    listingPhase === "loading" ? "plp__tiles-host--loading" : "",
    listingPhase === "reveal" ? "plp__tiles-host--reveal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tilesHostStyle: CSSProperties | undefined =
    listingPhase === "loading" && loadHostMinHeight != null
      ? { minHeight: loadHostMinHeight }
      : undefined;

  return (
    <div
      className="plp"
      data-name="body"
      data-studio-react-screen={PLP_REACT_SCREEN_ID}
    >
      <header className="plp__crumbs" data-name="module.breadcrumbs">
        <div className="plp__shell">
          <nav
            className="plp__shell-inner plp__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              className="plp__crumb-link"
              data-studio-action="plp-crumb-home"
              onClick={onGoHome}
            >
              Home
            </button>
            <span className="plp__crumb-sep" aria-hidden>
              /
            </span>
            <span className="plp__crumb-current">Vaccinations</span>
          </nav>
        </div>
      </header>

      <section className="plp__hero" data-name="module.plp.hero">
        <div className="plp__hero-bg" data-name="component.plp.hero.bg" aria-hidden>
          <img src={plpHeroImage} alt="" />
        </div>
        <div className="plp__shell plp__hero-shell">
          <div className="plp__shell-inner plp__hero-inner">
            <div className="plp__hero-copy">
              <h1 className="plp__hero-title">Vaccinations</h1>
              <p className="plp__hero-lede">
                Find and book trusted vaccination services for travel, seasonal
                protection, and routine health needs.
              </p>
            </div>
            <div className="plp__hero-media" aria-hidden>
              <img src={plpHeroImage} alt="" />
            </div>
          </div>
        </div>
      </section>

      <main className="plp__body" data-name="module.laptop.specs">
        {/* Legacy ModuleLaptopSpecs: white base + decorative fill @ opacity 0.41 */}
        <div className="plp__body-fill" aria-hidden>
          <div className="plp__body-fill-solid" />
          <img
            className="plp__body-fill-img"
            src={plpBodyFill}
            alt=""
          />
        </div>

        <div className="plp__shell plp__body-shell">
          <div className="plp__shell-inner plp__body-stack">
            {/* Legacy ModuleLaptopSpecs — Advantage Card system message above filters/listing */}
            <div
              className="plp__advantage"
              data-name="component.gse.system.message"
              data-studio-plp-advantage="true"
            >
              <p className="plp__advantage-text">
                Collect 3 points for every £1 you spend with Boots Advantage
                Card‡
              </p>
            </div>

            <div className="plp__layout">
            <aside
              className="plp__filters"
              data-name="module.plp.filters"
              data-studio-react-owned="true"
            >
              <Accordion
                type="multiple"
                defaultValue={["type", "age", "disease", "region", "country"]}
                className="plp__filter-accordion"
                data-name="plp.filter.accordion"
              >
                <AccordionItem id="type" className="plp__filter-section">
                  <AccordionTrigger id="type" className="plp__filter-trigger" data-studio-action="plp-filter-accordion-type">
                    <span>By Type</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="type" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list" role="radiogroup">
                      <RadioRow
                        checked={!filters.showBundles}
                        label="Individual jabs"
                        count={countPlpTypeOption(filters, false)}
                        onSelect={() =>
                          setFilters({ ...filters, showBundles: false })
                        }
                      />
                      <RadioRow
                        checked={filters.showBundles}
                        label="Bundles"
                        count={countPlpTypeOption(filters, true)}
                        onSelect={() =>
                          setFilters({ ...filters, showBundles: true })
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="age" className="plp__filter-section">
                  <AccordionTrigger id="age" className="plp__filter-trigger" data-studio-action="plp-filter-accordion-age">
                    <span>By Age</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="age" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list">
                      <RadioRow
                        checked={filters.allAges}
                        label="All age groups"
                        count={countPlpTypeOption(
                          { ...filters, allAges: true, ages: [] },
                          filters.showBundles
                        )}
                        onSelect={() =>
                          setFilters({
                            ...filters,
                            allAges: true,
                            ages: [],
                          })
                        }
                      />
                      {PLP_AGE_OPTIONS.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.ages.includes(label)}
                          label={label}
                          count={countPlpFacetOption(filters, "ages", label)}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "ages", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="disease" className="plp__filter-section">
                  <AccordionTrigger id="disease" className="plp__filter-trigger" data-studio-action="plp-filter-accordion-disease">
                    <span>By Disease</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="disease" className="plp__filter-content">
                    <FilterSearch
                      value={filters.diseaseQuery}
                      onChange={(diseaseQuery) => {
                        setDiseaseExpanded(false);
                        setFilters({ ...filters, diseaseQuery });
                      }}
                      placeholder="Search diseases"
                    />
                    <div className="plp__option-list" data-name="list">
                      {diseaseOptions.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.diseases.includes(label)}
                          label={label}
                          count={countPlpFacetOption(
                            filters,
                            "diseases",
                            label
                          )}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "diseases", label)
                            )
                          }
                        />
                      ))}
                    </div>
                    <FilterViewAll
                      section="disease"
                      onActivate={() => {
                        // Filled → reset field (Legacy wire clear / PO restore).
                        if (diseaseQuerying) {
                          setFilters({ ...filters, diseaseQuery: "" });
                          setDiseaseExpanded(false);
                          return;
                        }
                        if (diseaseCanExpand) setDiseaseExpanded(true);
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="region" className="plp__filter-section">
                  <AccordionTrigger id="region" className="plp__filter-trigger" data-studio-action="plp-filter-accordion-region">
                    <span>By Region</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="region" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list">
                      {PLP_REGION_OPTIONS.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.regions.includes(label)}
                          label={label}
                          count={countPlpFacetOption(filters, "regions", label)}
                          onToggle={() => {
                            setCountryExpanded(false);
                            setFilters(
                              togglePlpFilterValue(filters, "regions", label)
                            );
                          }}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="country" className="plp__filter-section">
                  <AccordionTrigger id="country" className="plp__filter-trigger" data-studio-action="plp-filter-accordion-country">
                    <span>By Country</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="country" className="plp__filter-content">
                    <FilterSearch
                      value={filters.countryQuery}
                      onChange={(countryQuery) => {
                        setCountryExpanded(false);
                        setFilters({ ...filters, countryQuery });
                      }}
                      placeholder="Search countries"
                    />
                    <div className="plp__option-list" data-name="list">
                      {countryOptions.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.countries.includes(label)}
                          label={label}
                          count={countPlpFacetOption(
                            filters,
                            "countries",
                            label
                          )}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "countries", label)
                            )
                          }
                        />
                      ))}
                    </div>
                    <FilterViewAll
                      section="country"
                      onActivate={() => {
                        if (countryQuerying) {
                          setFilters({ ...filters, countryQuery: "" });
                          setCountryExpanded(false);
                          return;
                        }
                        if (countryCanExpand) setCountryExpanded(true);
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {dirty ? (
                <TertiaryCta
                  compact
                  className="plp__reset"
                  data-name="component.plp.reset-filters"
                  data-studio-plp-reset-filters="true"
                  aria-label="Reset filters"
                  icon={<TrashGlyph />}
                  onClick={() => setFilters(DEFAULT_PLP_FILTERS)}
                >
                  Reset filters
                </TertiaryCta>
              ) : null}
            </aside>

            {/* Legacy Body8 listing wrapper — white card + drop-shadow over page fill */}
            <section className="plp__listing" data-name="module.plp.listing">
              <div className="plp__results">
                <div
                  className="plp__results-summary"
                  data-name="component.filter.controls"
                >
                  <div className="plp__results-summary-row">
                    <p
                      className={resultsCountClass}
                      data-studio-plp-results={
                        listingPhase === "loading"
                          ? ""
                          : String(displayItems.length)
                      }
                      data-studio-plp-results-loading={
                        listingPhase === "loading" ? "true" : undefined
                      }
                      aria-live="polite"
                      aria-busy={listingPhase === "loading" || undefined}
                    >
                      {listingPhase === "loading" ? null : activeChips.length ? (
                        <>
                          {displayItems.length} {noun} found for{" "}
                          {activeChips.map((chip, index) => (
                            <span key={`${chip.facet}:${chip.label}`}>
                              {index > 0 ? ", " : null}
                              <button
                                type="button"
                                className="plp__filter-chip uxds-link"
                                data-studio-plp-filter-facet={chip.facet}
                                data-studio-plp-filter-label={chip.label}
                                data-studio-action={`plp-filter-remove-${chip.facet}-${chip.label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                                onClick={() =>
                                  setFilters(
                                    removePlpActiveFilterChip(
                                      filters,
                                      chip.facet,
                                      chip.label
                                    )
                                  )
                                }
                              >
                                {chip.label}
                              </button>
                            </span>
                          ))}
                        </>
                      ) : dirty ? (
                        `${displayItems.length} ${noun} found`
                      ) : (
                        `${displayItems.length} ${noun} available`
                      )}
                    </p>
                    {dirty ? (
                      <TertiaryCta
                        compact
                        className="plp__reset-inline"
                        data-name="component.plp.reset-filters"
                        data-studio-plp-reset-filters="true"
                        aria-label="Reset Filters"
                        icon={<TrashGlyph />}
                        onClick={() => setFilters(DEFAULT_PLP_FILTERS)}
                      >
                        Reset Filters
                      </TertiaryCta>
                    ) : null}
                  </div>
                </div>

                <div
                  ref={tilesHostRef}
                  className={tilesHostClass}
                  data-name="module.plp.tiles"
                  data-studio-plp-listing-phase={listingPhase}
                  style={tilesHostStyle}
                >
                  {/*
                    Legacy preloader (child 9): hide tiles + in-band spinner overlay.
                    ONE “Updating results…” under spinner — never also in count line.
                    Host min-height locked to prior band height (no collapse jump).
                    Sticky inner pin keeps spinner in the visible listing scrollport.
                  */}
                  {listingPhase === "loading" ? (
                    <div
                      className="plp__listing-loader"
                      data-studio-plp-listing-loader="true"
                      aria-live="polite"
                    >
                      <div className="plp__listing-loader__inner">
                        <div
                          className="plp__listing-loader__spinner plp__listing-loader__spinner--run"
                          aria-hidden
                        >
                          <svg
                            viewBox="0 0 44 44"
                            width="44"
                            height="44"
                            aria-hidden
                          >
                            <circle
                              className="plp__listing-loader__track"
                              cx="22"
                              cy="22"
                              r="18"
                              fill="none"
                            />
                            <circle
                              className="plp__listing-loader__arc"
                              cx="22"
                              cy="22"
                              r="18"
                              fill="none"
                            />
                          </svg>
                        </div>
                        <p className="plp__listing-loader__text">
                          Updating results…
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {displayItems.map((item, tileIndex) => {
                    const staggerMs = Math.min(tileIndex, 8) * 50;
                    const isLastTile = tileIndex === displayItems.length - 1;
                    return (
                      <ServiceTile
                        key={item.id}
                        item={item}
                        tileIndex={tileIndex}
                        staggerMs={
                          listingPhase === "reveal" ? staggerMs : undefined
                        }
                        reveal={listingPhase === "reveal"}
                        probeBelowFold={isLastTile && displayItems.length > 1}
                        onBookNow={() => onBookNow(item)}
                        onQuickView={() => onQuickView(item)}
                      />
                    );
                  })}
                  {!displayItems.length && listingPhase !== "loading" ? (
                    <p className="plp__empty">
                      No services match these filters. Try resetting filters.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
