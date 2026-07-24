/**
 * Legacy Frame337 / Frame338 — Site Pilot microheader (white bar under engine header).
 * Logo cluster + Contact Support | Rate / More. Sticky is structural: bar sits
 * above `.chat__column` (sole scroll host), so it never scrolls away.
 */
import type { ReactNode } from "react";
import svgPaths from "../../frame/svg-p97rh8hlns";

const WORDMARK_PATHS = [
  svgPaths.p268f7e40,
  svgPaths.p2df28900,
  svgPaths.p34ea1b00,
  svgPaths.p456b580,
  svgPaths.p2cb216f0,
  svgPaths.pb651800,
  svgPaths.p3bd58100,
  svgPaths.p34373d80,
  svgPaths.pb62c800,
] as const;

function SitePilotCompactLogo() {
  return (
    <div
      className="chat__site-pilot-logo"
      data-name="boots.ai assistant 3"
      aria-hidden
    >
      <span className="chat__site-pilot-logo-outline">
        <svg viewBox="0 0 111.92 28.5868" fill="none" aria-hidden>
          <path d={svgPaths.p30e723b0} fill="#261F4B" />
        </svg>
      </span>
      <span className="chat__site-pilot-logo-wordmark" data-name="SITE PILOT">
        <svg viewBox="0 0 73.2155 6.73767" fill="none" aria-hidden>
          {WORDMARK_PATHS.map((d) => (
            <path key={d.slice(0, 24)} d={d} fill="#29254C" />
          ))}
        </svg>
      </span>
    </div>
  );
}

function BarAction({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <button type="button" className="chat__site-pilot-action">
      {icon}
      <span className="chat__site-pilot-action-label">{label}</span>
    </button>
  );
}

function QuestionIcon() {
  return (
    <span className="chat__site-pilot-action-icon" aria-hidden>
      <svg viewBox="0 0 16 16" fill="none">
        <path
          clipRule="evenodd"
          d={svgPaths.p116ea480}
          fill="#AFCCCA"
          fillRule="evenodd"
        />
      </svg>
    </span>
  );
}

function HeartIcon() {
  return (
    <span className="chat__site-pilot-action-icon chat__site-pilot-action-icon--heart" aria-hidden>
      <svg viewBox="0 0 16 14" fill="none">
        <path
          clipRule="evenodd"
          d={svgPaths.p3566e370}
          fill="#AFCCCA"
          fillRule="evenodd"
        />
      </svg>
    </span>
  );
}

function MoreIcon() {
  return (
    <span className="chat__site-pilot-action-icon chat__site-pilot-action-icon--more" aria-hidden>
      <svg viewBox="0 0 4 16" fill="none">
        <path d={svgPaths.pe1f7580} fill="#AFCCCA" />
        <path d={svgPaths.p2c25f000} fill="#AFCCCA" />
        <path d={svgPaths.p3f67e300} fill="#AFCCCA" />
      </svg>
    </span>
  );
}

export function ChatSitePilotBar() {
  return (
    <header
      className="chat__site-pilot-bar"
      data-studio-chat-site-pilot-bar="true"
      data-studio-sticky-group="true"
      aria-label="Site Pilot"
    >
      <div className="chat__site-pilot-bar-inner">
        <div className="chat__site-pilot-bar-start">
          <SitePilotCompactLogo />
          <BarAction label="Contact Support" icon={<QuestionIcon />} />
        </div>
        <div className="chat__site-pilot-bar-end">
          <BarAction label="Rate your experience" icon={<HeartIcon />} />
          <BarAction label="More" icon={<MoreIcon />} />
        </div>
      </div>
    </header>
  );
}
