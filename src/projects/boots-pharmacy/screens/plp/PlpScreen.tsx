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
import { ButtonPrimary } from "@/uxds/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/uxds/interactions";
import {
  DEFAULT_PLP_FILTERS,
  PLP_AGE_OPTIONS,
  PLP_BUNDLE_CATALOG,
  PLP_COUNTRY_OPTIONS,
  PLP_DISEASE_OPTIONS,
  PLP_JAB_ITEMS,
  PLP_LISTING_LOAD_MS,
  PLP_REGION_OPTIONS,
  collectPlpActiveFilterChips,
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

/** Make Reset Filters trash glyph — stroke tertiary (studio-tertiary-cta). */
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
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="plp__option-row"
      data-name="component.plp.filter.checkbox.item"
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
    </button>
  );
}

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
    <label
      className="plp__search"
      data-name="component.input.field"
      data-studio-react-owned="true"
    >
      <input
        className="plp__search-input proto-search-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          className="plp__search-clear"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          ×
        </button>
      ) : null}
    </label>
  );
}

function ServiceTile({
  item,
  tileIndex,
  wishlisted,
  staggerMs,
  reveal,
  onToggleWishlist,
  onBookNow,
  onQuickView,
}: {
  item: PlpCatalogItem;
  tileIndex: number;
  wishlisted: boolean;
  staggerMs?: number;
  reveal?: boolean;
  onToggleWishlist: () => void;
  onBookNow: () => void;
  onQuickView: () => void;
}) {
  // Optimistic heart: hover preview + click flip with no laggy feedback.
  const [heartHover, setHeartHover] = useState(false);
  const [optimisticOn, setOptimisticOn] = useState<boolean | null>(null);
  const heartActive = optimisticOn ?? wishlisted;
  const heartPreview = heartActive || heartHover;

  useEffect(() => {
    setOptimisticOn(null);
  }, [wishlisted]);

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
              aria-pressed={heartActive}
              onMouseEnter={() => setHeartHover(true)}
              onMouseLeave={() => setHeartHover(false)}
              onPointerDown={() => setOptimisticOn(!heartActive)}
              onClick={onToggleWishlist}
            >
              <span
                className={`plp__tertiary-icon${heartPreview ? " is-active" : ""}`}
                data-name="icon=add to wishlist"
                data-fav-active={String(heartActive)}
              >
                <BookmarkGlyph />
              </span>
              <span>Add to Bookmarks</span>
            </button>
            <button
              type="button"
              className="plp__tertiary"
              data-name="component.input.button"
              data-studio-quick-view="true"
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
 * Retires Make HTML for Frame child 9; Studio hooks via data-name.
 */
export function PlpScreen({
  onBookNow,
  onQuickView,
  onGoHome,
  onFiltersDirtyChange,
}: PlpScreenProps) {
  const [filters, setFilters] = useState<PlpFilterState>(DEFAULT_PLP_FILTERS);
  const [wishlistTick, setWishlistTick] = useState(0);
  const [displayItems, setDisplayItems] = useState(() =>
    filterPlpCatalog(DEFAULT_PLP_FILTERS)
  );
  const [listingPhase, setListingPhase] = useState<ListingPhase>("idle");
  const syncPassRef = useRef(0);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = isPlpFiltersDirty(filters);
  const activeChips = collectPlpActiveFilterChips(filters);
  const noun = plpResultsNoun(filters, displayItems.length);

  useEffect(() => {
    onFiltersDirtyChange?.(dirty);
  }, [dirty, onFiltersDirtyChange]);

  // Make plpListing: first sync instant; later filter changes simulate load.
  useEffect(() => {
    const next = filterPlpCatalog(filters);

    if (syncPassRef.current === 0) {
      syncPassRef.current = 1;
      setDisplayItems(next);
      setListingPhase("idle");
      return;
    }

    if (loadTimerRef.current != null) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }

    setListingPhase("loading");
    loadTimerRef.current = setTimeout(() => {
      loadTimerRef.current = null;
      setDisplayItems(next);
      setListingPhase("reveal");
    }, PLP_LISTING_LOAD_MS);

    return () => {
      if (loadTimerRef.current != null) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, [filters]);

  const diseaseOptions = filterOptionList(
    PLP_DISEASE_OPTIONS,
    filters.diseaseQuery
  );
  const countryOptions = filterOptionList(
    PLP_COUNTRY_OPTIONS,
    filters.countryQuery
  );

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

  return (
    <div
      className="plp"
      data-name="body"
      data-studio-react-screen={PLP_REACT_SCREEN_ID}
    >
      <div className="plp__crumbs" data-name="module.breadcrumbs">
        <div className="plp__shell">
          <nav
            className="plp__shell-inner plp__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              className="plp__crumb-link"
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
      </div>

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

      <div className="plp__body" data-name="module.laptop.specs">
        {/* Make ModuleLaptopSpecs: white base + decorative fill @ opacity 0.41 */}
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
            {/* Make ModuleLaptopSpecs — Advantage Card system message above filters/listing */}
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
                  <AccordionTrigger id="type" className="plp__filter-trigger">
                    <span>By Type</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="type" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list" role="radiogroup">
                      <RadioRow
                        checked={!filters.showBundles}
                        label="Individual jabs"
                        count={PLP_JAB_ITEMS.length}
                        onSelect={() =>
                          setFilters({ ...filters, showBundles: false })
                        }
                      />
                      <RadioRow
                        checked={filters.showBundles}
                        label="Bundles"
                        count={PLP_BUNDLE_CATALOG.length}
                        onSelect={() =>
                          setFilters({ ...filters, showBundles: true })
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="age" className="plp__filter-section">
                  <AccordionTrigger id="age" className="plp__filter-trigger">
                    <span>By Age</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="age" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list">
                      <RadioRow
                        checked={filters.allAges}
                        label="All age groups"
                        count={PLP_JAB_ITEMS.length}
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
                  <AccordionTrigger id="disease" className="plp__filter-trigger">
                    <span>By Disease</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="disease" className="plp__filter-content">
                    <FilterSearch
                      value={filters.diseaseQuery}
                      onChange={(diseaseQuery) =>
                        setFilters({ ...filters, diseaseQuery })
                      }
                      placeholder="Search diseases"
                    />
                    <div className="plp__option-list" data-name="list">
                      {diseaseOptions.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.diseases.includes(label)}
                          label={label}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "diseases", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="region" className="plp__filter-section">
                  <AccordionTrigger id="region" className="plp__filter-trigger">
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
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "regions", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="country" className="plp__filter-section">
                  <AccordionTrigger id="country" className="plp__filter-trigger">
                    <span>By Country</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="country" className="plp__filter-content">
                    <FilterSearch
                      value={filters.countryQuery}
                      onChange={(countryQuery) =>
                        setFilters({ ...filters, countryQuery })
                      }
                      placeholder="Search countries"
                    />
                    <div className="plp__option-list" data-name="list">
                      {countryOptions.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.countries.includes(label)}
                          label={label}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "countries", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {dirty ? (
                <TertiaryCta
                  compact
                  className="plp__reset"
                  data-name="component.plp.reset-filters"
                  aria-label="Reset filters"
                  icon={<TrashGlyph />}
                  onClick={() => setFilters(DEFAULT_PLP_FILTERS)}
                >
                  Reset filters
                </TertiaryCta>
              ) : null}
            </aside>

            {/* Make Body8 listing wrapper — white card + drop-shadow over page fill */}
            <div className="plp__listing" data-name="module.plp.listing">
              <div className="plp__results">
                <div
                  className="plp__results-summary"
                  data-name="component.filter.controls"
                >
                  <div className="plp__results-summary-row">
                    <p
                      className={resultsCountClass}
                      data-studio-plp-results={String(displayItems.length)}
                      aria-live="polite"
                    >
                      {listingPhase === "loading" ? (
                        "Updating results…"
                      ) : activeChips.length ? (
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
                  className={tilesHostClass}
                  data-name="module.plp.tiles"
                  data-studio-plp-listing-phase={listingPhase}
                >
                  {/*
                    Make preloader (child 9 / plpListing / globals-screens):
                    ~450ms filter-change → hide tiles (display:none) + centered
                    spinner overlay (arc + “Updating results…”) on min-height host
                    + pulsed count text. Not a blank page with count text alone.
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
                    const wishId = plpTileWishlistId(tileIndex);
                    const wishlisted =
                      wishlistTick >= 0 && isInWishlist(wishId);
                    const staggerMs = Math.min(tileIndex, 8) * 50;
                    return (
                      <ServiceTile
                        key={item.id}
                        item={item}
                        tileIndex={tileIndex}
                        wishlisted={wishlisted}
                        staggerMs={
                          listingPhase === "reveal" ? staggerMs : undefined
                        }
                        reveal={listingPhase === "reveal"}
                        onToggleWishlist={() => {
                          toggleWishlist(wishId);
                          setWishlistTick((n) => n + 1);
                        }}
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
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
