import { Fragment, type MouseEventHandler, type ReactNode } from "react";
import { AnimatePresence, motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";
import { UxdsTextLink, type UxdsTextLinkItem } from "./UxdsTextLink";
import { useOverlayEscapeDismiss } from "./useOverlayEscapeDismiss";
import "./mega-menu-flyout.css";

/**
 * Show/hide transition (MOTION.md: "Enter / exit presence … opacity (+ tiny
 * y) only"). Kept quick and matched to the show/hide pacing the hovering nav
 * item already applies (`healthServicesMegaMenuMount.ts` 100ms show / 200ms
 * hide) — this animates the reveal itself, not the hover-intent delay.
 */
const MEGA_MENU_FLYOUT_TRANSITION = {
  duration: 0.2,
  ease: MOTION_EASE_IN_OUT,
} as const;

/** @deprecated Import `UxdsTextLinkItem` from `./UxdsTextLink` — kept as an alias so existing imports don't break. */
export type MegaMenuLinkItem = UxdsTextLinkItem;

export type MegaMenuLinkGroup = {
  title: string;
  links: MegaMenuLinkItem[];
};

export type MegaMenuHeroCta = {
  label: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

export type MegaMenuHero = {
  image: { src: string; alt?: string };
  title: string;
  cta?: MegaMenuHeroCta;
};

export type MegaMenuFlyoutProps = {
  /** Rows of link groups (Figma: 3 groups/row, divided by `component.gse.delimiter`). */
  linkRows: MegaMenuLinkGroup[][];
  /** Right-hand hero asset — image + overlay title + secondary CTA. */
  hero?: MegaMenuHero;
  /** Bottom promo band copy. */
  promoText?: ReactNode;
  /** Parent (mega-menu nav item hover) owns visibility — unmounts when false. */
  open?: boolean;
  /** Escape key or scrim click — parent should force-close (no hide delay). */
  onDismiss?: () => void;
  className?: string;
  "data-name"?: string;
};

function MegaMenuHeroCtaButton({ cta }: { cta: MegaMenuHeroCta }) {
  const className = "uxds-mega-menu-flyout__hero-cta";
  if (cta.href) {
    return (
      <a
        className={className}
        data-name="component.input.button"
        href={cta.href}
        onClick={cta.onClick}
      >
        {cta.label}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      data-name="component.input.button"
      onClick={cta.onClick}
    >
      {cta.label}
    </button>
  );
}

/**
 * `component.header.mega.menu.flyout.standard` — header nav flyout panel.
 * Presentational only: the parent mega-menu nav item owns hover/focus
 * open-state and passes it in via `open`. Group links reuse the one
 * `.uxds-link` pattern (no invented link chrome); hero CTA is the kit
 * secondary-outline pill (`--uxds-input-button-*` tokens), not `ButtonPrimary`.
 *
 * Also renders `module.mega.menu`'s scrim (Figma node 7650:86158) for visual
 * separation from the page underneath — anchored to the flyout's own top
 * edge (never the header/breadcrumb above it — see `mega-menu-flyout.css`
 * header comment). Clicking the scrim, or pressing Escape while open, calls
 * `onDismiss` (`useOverlayEscapeDismiss` — shared with `FullScreenSearch`)
 * so the parent can force-close immediately instead of waiting the hover
 * hide delay; `aria-hidden` stays on the scrim since Escape is the
 * accessible dismiss path and the click is a mouse-only convenience.
 *
 * Show/hide is `framer-motion` `AnimatePresence` (opacity + tiny y, per
 * MOTION.md — same idiom as `StudioNavStudioSelect`), **not** an instant
 * mount/unmount — `AnimatePresence` keeps the panel mounted for the exit
 * transition before actually removing it, so `open=false` is followed
 * shortly by DOM removal rather than being synchronous (see kit tests).
 */
export function MegaMenuFlyout({
  linkRows,
  hero,
  promoText,
  open = true,
  onDismiss,
  className,
  "data-name": dataName = "component.header.mega.menu.flyout.standard",
}: MegaMenuFlyoutProps) {
  useOverlayEscapeDismiss({ open, onDismiss });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="uxds-mega-menu-flyout__root"
          data-name="module.mega.menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={MEGA_MENU_FLYOUT_TRANSITION}
        >
          <div
            className="uxds-mega-menu-flyout__scrim"
            data-name="module.mega.menu.scrim"
            onClick={onDismiss}
            aria-hidden
          />
          <div
            className={`uxds-mega-menu-flyout${className ? ` ${className}` : ""}`}
            data-name={dataName}
            data-uxds-kit="mega-menu-flyout"
            data-has-hero={hero ? "true" : "false"}
            role="menu"
          >
            <div className="uxds-mega-menu-flyout__layout" data-name="flyout.layout">
              <div className="uxds-mega-menu-flyout__grid" data-name="flyout.links.grid">
                {linkRows.map((row, rowIndex) => (
                  <Fragment key={rowIndex}>
                    {rowIndex > 0 ? (
                      <div
                        className="uxds-mega-menu-flyout__delimiter"
                        data-name="component.gse.delimiter"
                        aria-hidden
                      />
                    ) : null}
                    <div
                      className="uxds-mega-menu-flyout__row"
                      data-name={`flyout.links.row.${rowIndex + 1}`}
                    >
                      {row.map((group, groupIndex) => (
                        <div
                          className="uxds-mega-menu-flyout__group"
                          data-name={`flyout.link-group.${rowIndex + 1}.${groupIndex + 1}`}
                          key={`${rowIndex}-${groupIndex}-${group.title}`}
                        >
                          <p className="uxds-mega-menu-flyout__group-title">
                            {group.title}
                          </p>
                          <div
                            className="uxds-mega-menu-flyout__group-links"
                            data-name="group.links"
                          >
                            {group.links.map((link) => (
                              <UxdsTextLink
                                link={link}
                                className="uxds-mega-menu-flyout__link"
                                key={link.label}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>

              {hero ? (
                <div
                  className="uxds-mega-menu-flyout__hero"
                  data-name="flyout.content.asset"
                >
                  <img
                    className="uxds-mega-menu-flyout__hero-image"
                    src={hero.image.src}
                    alt={hero.image.alt ?? ""}
                  />
                  <p className="uxds-mega-menu-flyout__hero-title">{hero.title}</p>
                  {hero.cta ? <MegaMenuHeroCtaButton cta={hero.cta} /> : null}
                </div>
              ) : null}
            </div>

            {promoText ? (
              <div className="uxds-mega-menu-flyout__promo" data-name="flyout.promo">
                <p className="uxds-mega-menu-flyout__promo-text">{promoText}</p>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
