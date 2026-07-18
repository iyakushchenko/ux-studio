import type { ReactNode } from "react";
import ProtoSocialIcons from "@/projects/boots-pharmacy/chrome/ProtoSocialIcons";
import { ProtoTertiaryCta } from "@/app/chrome/ProtoTertiaryCta";
import searchIcon from "@/assets/avail/search.svg";
import {
  FOOTER_COPYRIGHT_LINES,
  FOOTER_LINK_COLUMNS,
  FOOTER_PHARMACY_SERVICES_URL,
  FOOTER_UTILITY_LINKS,
  footerLinkLabel,
  footerLinkScreen,
} from "@/projects/boots-pharmacy/chrome/protoFooterContent";

export type ProtoFooterVariant = "full" | "minified";
export type ProtoFooterTone = "pharmacy" | "health";

export type ProtoFooterNavHandlers = {
  onGoToPlp?: () => void;
};

export type ProtoFooterProps = ProtoFooterNavHandlers & {
  variant: ProtoFooterVariant;
  /** Background for the full footer — pharmacy (#f1f8ff) or health/booking (#ebf5ff). */
  tone?: ProtoFooterTone;
  /** Full footer only — omit link columns, newsletter, socials, and CTAs. */
  showColumns?: boolean;
};

/** Matches header/breadcrumb grid: 1440px outer shell, 1312px inner content, 64px horizontal pad. */
function FooterContentShell({
  children,
  innerClassName,
}: {
  children: ReactNode;
  innerClassName?: string;
}) {
  return (
    <div className="proto-footer__shell">
      <div
        className={
          innerClassName
            ? `proto-footer__shell-inner ${innerClassName}`
            : "proto-footer__shell-inner"
        }
      >
        {children}
      </div>
    </div>
  );
}

function FooterUtilityLinks({ dark }: { dark?: boolean }) {
  return (
    <nav
      className={`proto-footer__utility-links${dark ? " proto-footer__utility-links--dark" : ""}`}
      aria-label="Footer"
    >
      {FOOTER_UTILITY_LINKS.map((label) => (
        <button key={label} type="button" className="proto-link">
          {label}
        </button>
      ))}
    </nav>
  );
}

function FooterLinkColumns({ onGoToPlp }: ProtoFooterNavHandlers) {
  const onColumnLinkClick = (link: (typeof FOOTER_LINK_COLUMNS)[number]["links"][number]) => {
    const screen = footerLinkScreen(link);
    if (screen === "plp") onGoToPlp?.();
  };

  return (
    <>
      {FOOTER_LINK_COLUMNS.map((column) => (
        <div key={column.title} className="proto-footer__link-column">
          <p className="proto-footer__column-title">{column.title}</p>
          <ul className="proto-footer__column-links">
            {column.links.map((link) => {
              const label = footerLinkLabel(link);
              const screen = footerLinkScreen(link);
              return (
                <li key={label}>
                  <button
                    type="button"
                    className="proto-link"
                    onClick={
                      screen ? () => onColumnLinkClick(link) : undefined
                    }
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function FooterNewsletter() {
  return (
    <div className="proto-footer__newsletter">
      <p className="proto-footer__block-title">Newsletter</p>
      <p className="proto-footer__block-copy">
        Sign up for our latest news and offers
      </p>
      <div className="proto-footer__email-row">
        <span className="proto-footer__email-input">Enter your email</span>
        <button type="button" className="proto-footer__signup-btn">
          Sign up
        </button>
      </div>
    </div>
  );
}

function FooterSocials() {
  return (
    <div className="proto-footer__socials">
      <p className="proto-footer__block-title">See what&apos;s new on our socials</p>
      <p className="proto-footer__block-copy">
        Stay connected with us! Follow for exclusive looks, the latest styles
        &amp; trend inspiration
      </p>
      <ProtoSocialIcons />
    </div>
  );
}

function FooterPharmacyCtas() {
  return (
    <div className="proto-footer__pharmacy">
      <p className="proto-footer__block-title">Boots Pharmacy</p>
      <p className="proto-footer__block-copy">
        Order your product today using our simple online checkout.
      </p>
      <div className="proto-footer__cta-row">
        <button type="button" className="proto-footer__cta proto-footer__cta--outline">
          Our Services
        </button>
        <ProtoTertiaryCta
          icon={<img src={searchIcon} alt="" width={16} height={16} />}
        >
          Find a store
        </ProtoTertiaryCta>
      </div>
    </div>
  );
}

function FooterCopyright({ dark }: { dark?: boolean }) {
  return (
    <div
      className={`proto-footer__copyright${dark ? " proto-footer__copyright--dark" : ""}`}
    >
      <FooterContentShell innerClassName="proto-footer__copyright-inner">
        <div className="proto-footer__copyright-copy">
          {FOOTER_COPYRIGHT_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>
            For details of Boots online pharmacy services see{" "}
            {dark ? (
              <button type="button" className="proto-link">
                Using Our Pharmacy Services
              </button>
            ) : (
              <a
                href={FOOTER_PHARMACY_SERVICES_URL}
                target="_blank"
                rel="noreferrer"
                className="proto-link"
              >
                Using Our Pharmacy Services
              </a>
            )}{" "}
            page.
          </p>
        </div>
      </FooterContentShell>
    </div>
  );
}

export default function ProtoFooter({
  variant,
  tone = "pharmacy",
  showColumns = true,
  onGoToPlp,
}: ProtoFooterProps) {
  if (variant === "minified") {
    return (
      <footer className="proto-footer proto-footer--minified">
        <div className="proto-footer__top-bar proto-footer__top-bar--dark">
          <FooterContentShell>
            <FooterUtilityLinks dark />
          </FooterContentShell>
        </div>
        <FooterCopyright dark />
      </footer>
    );
  }

  const toneClass =
    tone === "health" ? "proto-footer--health" : "proto-footer--pharmacy";

  return (
    <footer className={`proto-footer proto-footer--full ${toneClass}`}>
      {!showColumns ? (
        <div className="proto-footer__top-bar">
          <FooterContentShell>
            <FooterUtilityLinks />
          </FooterContentShell>
        </div>
      ) : null}
      {showColumns ? (
        <div className="proto-footer__body">
          <FooterContentShell innerClassName="proto-footer__link-grid">
            <FooterLinkColumns onGoToPlp={onGoToPlp} />
          </FooterContentShell>
          <FooterContentShell innerClassName="proto-footer__extras">
            <FooterNewsletter />
            <FooterSocials />
            <FooterPharmacyCtas />
          </FooterContentShell>
        </div>
      ) : null}
      <FooterCopyright />
    </footer>
  );
}
