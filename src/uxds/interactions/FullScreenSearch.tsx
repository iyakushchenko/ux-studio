import { type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";
import { CloseIcon } from "@/app/chrome/CloseIcon";
import iconSearch from "@/assets/avail/search.svg";
import { UxdsTextLink, type UxdsTextLinkItem } from "./UxdsTextLink";
import { useOverlayEscapeDismiss } from "./useOverlayEscapeDismiss";
import "./full-screen-search.css";

/** Same show/hide transition as `MegaMenuFlyout` — MOTION.md "opacity + tiny y". */
const FULL_SCREEN_SEARCH_TRANSITION = {
  duration: 0.2,
  ease: MOTION_EASE_IN_OUT,
} as const;

export type FullScreenSearchLinkGroup = {
  title: string;
  links: UxdsTextLinkItem[];
};

/** A category link + its "in <categoryLabel>" hint (Figma node 21362:294522). */
export type FullScreenSearchCategorySuggestion = UxdsTextLinkItem & {
  categoryLabel: string;
};

export type FullScreenSearchProductSuggestion = {
  title: string;
  /** Formatted amount, no currency symbol — the kit prefixes "£" (Boots price contract). */
  price: string;
  onClick?: () => void;
  actionId?: string;
};

/**
 * "Couldn't find" scenario (Figma node 21362:294522) — richer than a bare
 * `noResultsText` string: spelling-correction offer, category/content
 * suggestions, and a product-suggestion grid. Every field is optional and
 * parent-supplied — the kit never invents a "did you mean" guess or fake
 * suggestions; omit a field when the parent has no real match for it.
 */
export type FullScreenSearchNotFound = {
  /** Omit when there's no confident spelling-correction match — do not guess. */
  didYouMean?: UxdsTextLinkItem;
  categorySuggestions?: FullScreenSearchCategorySuggestion[];
  contentSuggestions?: UxdsTextLinkItem[];
  /**
   * Figma shows a photographed product tile (`component.product.image.basic`)
   * per suggestion; Boots' real PLP catalog has no product photography (text
   * + price only, same as every PLP tile) — this kit under-matches that one
   * image on purpose rather than inventing artwork. A future catalog with
   * real images can add an optional `imageUrl` here without breaking this
   * contract.
   */
  productSuggestions?: FullScreenSearchProductSuggestion[];
  viewAllLabel?: string;
  onViewAll?: () => void;
};

export type FullScreenSearchProps = {
  open: boolean;
  /** Controlled search text — parent owns live filtering. */
  value: string;
  onValueChange: (next: string) => void;
  /** Escape, scrim click, or the Exit pill — force-close, no hide delay. */
  onDismiss: () => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  exitLabel?: string;
  /** Empty-query state (Figma: "L & XL / Initial Suggestions", node 2544:589387). */
  quickLinksTitle?: string;
  quickLinks: UxdsTextLinkItem[];
  /** Non-empty query state — grouped matches; parent filters `value` itself. */
  resultGroups?: FullScreenSearchLinkGroup[];
  /**
   * Richer "couldn't find" scenario (Figma node 21362:294522) — takes
   * priority over `noResultsText` when both are given. Omit to keep the
   * plain-text fallback (e.g. refapp with no curated suggestion data).
   */
  notFound?: FullScreenSearchNotFound;
  /** Plain-text fallback shown when `notFound` isn't given (or has no fields). */
  noResultsText?: ReactNode;
  /**
   * Px offset from the real viewport top — studio chrome (`.studio-nav-panel-host`,
   * `position: relative`, not removed from flow) always renders above this
   * kit's `z-index: 10200`, so an `inset: 0` root gets its own field row
   * hidden underneath the toolbar. Host measures the toolbar's live height
   * and passes it in; 0 is fine for a host with no such persistent chrome.
   */
  topOffset?: number;
  className?: string;
  "data-name"?: string;
};

/**
 * `component.search.fullscreen` — click-to-open full-viewport search
 * takeover. Three Figma scenarios, all in [UX] UXDS - Larkin ·
 * myqzp3KRc1pxKDOv8RfTsl: node 2544:589387 "Initial Suggestions" (empty
 * query → `quickLinks`), node 2544:589399 "Search Query Suggestions"
 * (unbuilt in Figma — the query-result state below reuses the same field
 * chrome + the one titled-link-group pattern already proven by
 * `MegaMenuFlyout`, not invented chrome), and node 21362:294522 "couldn't
 * find" (`notFound` — spelling-correction offer + category/content
 * suggestions + a product-suggestion grid, shown when the query has zero
 * catalog matches).
 *
 * Presentational + controlled, same contract as `MegaMenuFlyout`: parent
 * owns `open`/`value`, this kit owns layout/motion/dismiss. Same overlay
 * techniques as the mega-menu flyout — `AnimatePresence` opacity + tiny y
 * (MOTION.md), a scrim that's `pointer-events: auto` + `onClick={onDismiss}`,
 * and `useOverlayEscapeDismiss` for Escape — except this overlay covers the
 * *entire* viewport (including the header, which it visually replaces with
 * its own field row) rather than dropping in below it.
 *
 * Stamps `data-studio-modal="full-screen-search"` for future overlay-eyes
 * registration, but — same as `MegaMenuFlyout` — is a self-contained
 * kit-owned overlay, not part of the wire-level `STUDIO_MODAL_REGISTRY` /
 * `&modal=` URL-sync system (`studioModalRegistry.ts`), which is scoped to
 * `ProjectWireApi`-controlled Boots popups (choose-pharmacy, quick-view,
 * login, vaccine-picker, recipient-picker). Wiring FSC into that system —
 * URL deep-link, wire open/close helpers — is a real gap if it's ever
 * driven by playback/CJM rather than a live click; tracked as backlog.
 */
export function FullScreenSearch({
  open,
  value,
  onValueChange,
  onDismiss,
  onSubmit,
  placeholder = "Search",
  exitLabel = "Exit",
  quickLinksTitle = "Quick Links",
  quickLinks,
  resultGroups,
  notFound,
  noResultsText,
  topOffset = 0,
  className,
  "data-name": dataName = "component.search.fullscreen",
}: FullScreenSearchProps) {
  useOverlayEscapeDismiss({ open, onDismiss });

  const hasQuery = value.trim().length > 0;
  const hasNotFound =
    !!notFound &&
    (!!notFound.didYouMean ||
      !!notFound.categorySuggestions?.length ||
      !!notFound.contentSuggestions?.length ||
      !!notFound.productSuggestions?.length);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit?.(value);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="uxds-full-screen-search__root"
          data-name="module.full.screen.search"
          data-studio-modal="full-screen-search"
          style={topOffset ? { top: topOffset } : undefined}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={FULL_SCREEN_SEARCH_TRANSITION}
        >
          <div
            className="uxds-full-screen-search__scrim"
            data-name="module.full.screen.search.scrim"
            onClick={onDismiss}
            aria-hidden
          />
          <div
            className={`uxds-full-screen-search${className ? ` ${className}` : ""}`}
            data-name={dataName}
            data-uxds-kit="full-screen-search"
            role="dialog"
            aria-modal="true"
            aria-label={placeholder}
          >
            <div
              className="uxds-full-screen-search__field-row"
              data-name="component.search.fullscreen.field"
            >
              <div className="uxds-full-screen-search__field">
                <span
                  className="uxds-full-screen-search__pill uxds-full-screen-search__pill--search"
                  data-name="component.input.button"
                  aria-hidden
                >
                  <img src={iconSearch} alt="" width={16} height={16} draggable={false} />
                </span>
                <input
                  className="uxds-full-screen-search__input"
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  aria-label={placeholder}
                  autoFocus
                />
                {hasQuery ? (
                  <button
                    type="button"
                    className="uxds-full-screen-search__pill uxds-full-screen-search__pill--clear"
                    data-name="component.input.button"
                    aria-label="Clear search"
                    onClick={() => onValueChange("")}
                  >
                    <CloseIcon size={16} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="uxds-full-screen-search__pill uxds-full-screen-search__pill--exit"
                  data-name="component.input.button"
                  onClick={onDismiss}
                >
                  {exitLabel}
                </button>
              </div>
            </div>

            <div className="uxds-full-screen-search__body" data-name="body">
              {!hasQuery ? (
                <div
                  className="uxds-full-screen-search__group"
                  data-name="component.ss.initial.suggestions"
                >
                  <p className="uxds-full-screen-search__group-title">
                    {quickLinksTitle}
                  </p>
                  <div className="uxds-full-screen-search__group-links" data-name="Links">
                    {quickLinks.map((link) => (
                      <UxdsTextLink
                        link={link}
                        className="uxds-full-screen-search__link"
                        key={link.label}
                      />
                    ))}
                  </div>
                </div>
              ) : resultGroups && resultGroups.length > 0 ? (
                <div
                  className="uxds-full-screen-search__results"
                  data-name="component.ss.query.suggestions"
                >
                  {resultGroups.map((group) => (
                    <div
                      className="uxds-full-screen-search__group"
                      data-name={`search.result-group.${group.title}`}
                      key={group.title}
                    >
                      <p className="uxds-full-screen-search__group-title">
                        {group.title}
                      </p>
                      <div className="uxds-full-screen-search__group-links" data-name="Links">
                        {group.links.map((link) => (
                          <UxdsTextLink
                            link={link}
                            className="uxds-full-screen-search__link"
                            key={link.label}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasNotFound && notFound ? (
                <div
                  className="uxds-full-screen-search__not-found"
                  data-name="module.ss.couldnt.find.content.slot"
                >
                  <div className="uxds-full-screen-search__not-found-header">
                    <p className="uxds-full-screen-search__not-found-title">
                      {`Sorry, we couldn't find "`}
                      <span className="uxds-full-screen-search__not-found-query">
                        {value.trim()}
                      </span>
                      {`"`}
                    </p>
                    {notFound.didYouMean ? (
                      <p className="uxds-full-screen-search__did-you-mean">
                        {"Did you mean "}
                        <UxdsTextLink
                          link={notFound.didYouMean}
                          className="uxds-full-screen-search__did-you-mean-term"
                        />
                        {"?"}
                      </p>
                    ) : null}
                  </div>

                  {notFound.categorySuggestions?.length ||
                  notFound.contentSuggestions?.length ? (
                    <div className="uxds-full-screen-search__suggestion-columns">
                      {notFound.categorySuggestions?.length ? (
                        <div
                          className="uxds-full-screen-search__group"
                          data-name="Category Suggestions"
                        >
                          <p className="uxds-full-screen-search__group-title">
                            Category Suggestions
                          </p>
                          <div className="uxds-full-screen-search__group-links" data-name="Links">
                            {notFound.categorySuggestions.map((suggestion) => (
                              <div
                                className="uxds-full-screen-search__category-row"
                                key={suggestion.label}
                              >
                                <UxdsTextLink
                                  link={suggestion}
                                  className="uxds-full-screen-search__link"
                                />
                                <span className="uxds-full-screen-search__category-hint">
                                  {"in "}
                                  <strong>{suggestion.categoryLabel}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {notFound.contentSuggestions?.length ? (
                        <div
                          className="uxds-full-screen-search__group"
                          data-name="Content Suggestions"
                        >
                          <p className="uxds-full-screen-search__group-title">
                            Content Suggestions
                          </p>
                          <div className="uxds-full-screen-search__group-links" data-name="Links">
                            {notFound.contentSuggestions.map((link) => (
                              <UxdsTextLink
                                link={link}
                                className="uxds-full-screen-search__link"
                                key={link.label}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {notFound.productSuggestions?.length ? (
                    <div
                      className="uxds-full-screen-search__product-suggestions"
                      data-name="component.search.results.suggestions.product.listing"
                    >
                      <p className="uxds-full-screen-search__group-title">
                        Product Suggestions
                      </p>
                      <div className="uxds-full-screen-search__product-grid">
                        {notFound.productSuggestions.map((product) => (
                          <button
                            type="button"
                            key={product.title}
                            className="uxds-full-screen-search__product-tile"
                            data-name="component.search.results.suggestions.product.tile"
                            onClick={product.onClick}
                            data-studio-action={product.actionId}
                          >
                            <span className="uxds-full-screen-search__product-title">
                              {product.title}
                            </span>
                            <span className="uxds-full-screen-search__product-price">
                              {"£"}
                              {product.price}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {notFound.onViewAll ? (
                    <button
                      type="button"
                      className="uxds-full-screen-search__view-all"
                      onClick={notFound.onViewAll}
                    >
                      {notFound.viewAllLabel ?? "View all results"}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p
                  className="uxds-full-screen-search__no-results"
                  data-name="search.no-results"
                >
                  {noResultsText ?? `No results for "${value.trim()}"`}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
