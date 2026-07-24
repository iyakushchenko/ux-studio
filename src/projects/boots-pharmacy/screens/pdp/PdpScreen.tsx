import bodyFill from "@/projects/boots-pharmacy/frame/dbcd84d6da292330c6f57adefa32dd4b969ac8bd.png";
import appointmentIcon from "@/projects/boots-pharmacy/frame/9d46d8f7966cc26795f1d8689d9132bdf6e13c15.png";
import gpPromoLogo from "@/projects/boots-pharmacy/frame/61d74a3c817f3bb72471ea03403b2077aa2da40a.png";
import { TertiaryCta } from "@/app/chrome/TertiaryCta";
import { PromoMessageStrip } from "@/uxds/components";
import {
  Accordion,
  AccordionChevron,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/uxds/interactions";
import {
  PDP_ACCORDION_DEFAULT_OPEN,
  PDP_ACCORDION_PANELS,
  PDP_APPOINTMENT_STRIP,
  PDP_INTRO_PARAGRAPHS,
  PDP_REACT_SCREEN_ID,
  PDP_SPECS_ROWS,
} from "./pdpContract";
import { PdpRtbCard } from "./PdpRtbCard";
import "./pdp.css";

const GP_PROMO_COPY =
  "Book your doctor appointment online. Fast and convenient.";
/** Download glyph paths from Legacy `icon=download` (Frame126). */
const DOWNLOAD_GLYPH_BAR =
  "M14 12.2682H0V13.9999H14V12.2682Z";
const DOWNLOAD_GLYPH_ARROW =
  "M6.26167 0L6.26167 7.92269L2.38333 4.5891L1.25667 5.90955L6.565 10.4554C6.89 10.7368 7.36667 10.7368 7.69167 10.4554L13 5.90955L11.8733 4.5891L7.995 7.92269L7.995 0.0216467L6.26167 0.0216465V0Z";

export type PdpScreenProps = {
  includeBoosterDose: boolean;
  onToggleBooster: () => void;
  onBookNow: () => void;
  onCheckAvailability: () => void;
  onGoPlp: () => void;
  onGoHome: () => void;
  onOpenLogin: (tab: "signin" | "create") => void;
  loggedIn: boolean;
};

function DownloadGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d={DOWNLOAD_GLYPH_BAR} fill="currentColor" />
      <path d={DOWNLOAD_GLYPH_ARROW} fill="currentColor" />
    </svg>
  );
}

function PdpBelowFold() {
  return (
    <section
      className="pdp__below"
      data-name="body"
      aria-label="Product information"
    >
      <div className="pdp__shell pdp__below-inner">
        <div className="pdp__content-stack">
          <div className="pdp__content-hero">
            <h2
              className="pdp__content-title"
              data-studio-probe-below-fold="true"
            >
              Chickenpox
            </h2>
            <div
              className="pdp__content-accent"
              data-name="component.content.heading.accent"
              aria-hidden
            />
          </div>

          <div className="pdp__intro">
            {PDP_INTRO_PARAGRAPHS.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="pdp__appt-strip">
            <img
              className="pdp__appt-icon"
              src={appointmentIcon}
              alt=""
              width={30}
              height={30}
            />
            <p>{PDP_APPOINTMENT_STRIP}</p>
          </div>

          <div
            className="pdp__specs"
            data-name="component.laptop.specs.table"
          >
            <div className="pdp__specs-rows">
              {PDP_SPECS_ROWS.map((row) => (
                <div className="pdp__specs-row" key={row.label}>
                  <div className="pdp__specs-label">{row.label}</div>
                  <div className="pdp__specs-value">{row.value}</div>
                </div>
              ))}
            </div>
            <hr className="pdp__specs-divider" />
            <div className="pdp__specs-downloads">
              <button
                type="button"
                className="pdp__pill"
                data-name="component.input.button"
                data-studio-action="pdp-download-guide"
              >
                <span className="pdp__pill-icon" data-name="icon=download">
                  <DownloadGlyph />
                </span>
                <span className="pdp__pill-label">Chickenpox Guide</span>
              </button>
              <button
                type="button"
                className="pdp__pill"
                data-name="component.input.button"
                data-studio-action="pdp-download-leaflet"
              >
                <span className="pdp__pill-icon" data-name="icon=download">
                  <DownloadGlyph />
                </span>
                <span className="pdp__pill-label">
                  Vaccine Information Leaflet
                </span>
              </button>
            </div>
          </div>
        </div>

        <Accordion
          type="single"
          defaultValue={[...PDP_ACCORDION_DEFAULT_OPEN]}
          className="pdp__accordion"
          data-name="component.pdp.accordion"
        >
          {PDP_ACCORDION_PANELS.map((panel) => (
            <AccordionItem
              key={panel.id}
              id={panel.id}
              className="pdp__accordion-item"
              data-name="component.gse.accordion"
              data-studio-accordion-item={panel.id}
            >
              <AccordionTrigger
                id={panel.id}
                className="pdp__accordion-header"
                data-studio-action={`pdp-faq-${panel.id}`}
              >
                <span
                  className="pdp__accordion-title-wrap"
                  data-name="title wrapper"
                >
                  <span className="pdp__accordion-title">{panel.title}</span>
                </span>
                <AccordionChevron />
              </AccordionTrigger>
              <AccordionContent
                id={panel.id}
                className="pdp__accordion-body"
                data-name="Description"
              >
                <p>{panel.body}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <PromoMessageStrip
          data-name="Week Schedule"
          data-studio-promo="online-doctor"
          logo={
            <img src={gpPromoLogo} alt="" width={230} height={48} />
          }
          text={GP_PROMO_COPY}
          cta={
            <TertiaryCta
              compact
              soft
              data-name="component.input.button"
              data-studio-action="pdp-gp-find-out-more"
              icon={
                <span data-name="icon=download">
                  <DownloadGlyph />
                </span>
              }
            >
              Find out more
            </TertiaryCta>
          }
        />
      </div>
    </section>
  );
}

export function PdpScreen({
  includeBoosterDose,
  onToggleBooster,
  onBookNow,
  onCheckAvailability,
  onGoPlp,
  onGoHome,
  onOpenLogin,
  loggedIn,
}: PdpScreenProps) {
  return (
    <div
      className="pdp"
      data-studio-react-screen={PDP_REACT_SCREEN_ID}
      data-name="module.pdp"
    >
      <header className="pdp__crumbs" data-name="module.breadcrumbs">
        <div className="pdp__shell">
          <nav
            className="pdp__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button type="button" className="pdp__crumb-link" onClick={onGoHome}>
              Home
            </button>
            <span
              className="pdp__crumb-sep"
              data-name="component.gse.breadcrumbs.delimiter"
              aria-hidden
            >
              <span className="pdp__crumb-sep-bar" />
            </span>
            <span className="pdp__crumb-muted">Health Services</span>
            <span
              className="pdp__crumb-sep"
              data-name="component.gse.breadcrumbs.delimiter"
              aria-hidden
            >
              <span className="pdp__crumb-sep-bar" />
            </span>
            <button
              type="button"
              className="pdp__crumb-link"
              data-studio-crumb="vaccination"
              data-studio-action="pdp-crumb-vaccination"
              onClick={onGoPlp}
            >
              Vaccination
            </button>
            <span
              className="pdp__crumb-sep"
              data-name="component.gse.breadcrumbs.delimiter"
              aria-hidden
            >
              <span className="pdp__crumb-sep-bar" />
            </span>
            <span className="pdp__crumb-current">Chickenpox</span>
          </nav>
        </div>
      </header>

      <main className="pdp__main">
        <section className="pdp__rtb-band" aria-label="Product details">
          <div className="pdp__body-fill" aria-hidden>
            <img src={bodyFill} alt="" />
          </div>

          <div className="pdp__shell pdp__rtb-shell">
            <PdpRtbCard
              includeBoosterDose={includeBoosterDose}
              onToggleBooster={onToggleBooster}
              onBookNow={onBookNow}
              loggedIn={loggedIn}
              onOpenLogin={onOpenLogin}
              secondaryLabel="Check availability"
              onSecondaryAction={onCheckAvailability}
            />
          </div>
        </section>

        <PdpBelowFold />
      </main>
    </div>
  );
}

