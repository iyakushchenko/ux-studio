import type { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { TertiaryCta } from "@/app/chrome/TertiaryCta";
import iconMapPin from "@/assets/avail/map-pin.svg";

/** Canonical copy — Book Step 1 + Availability search-row share this string/role. */
export const NEAR_ME_CTA_LABEL = "See what's available near me";

type NearMeCtaProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "aria-label">;

/**
 * Shared “See what's available near me” CTA.
 *
 * Source of truth: Availability popup / Make search-row tertiary
 * (`.studio-tertiary-cta--compact` + 16×16 map-pin glyph, nowrap, beside search).
 * Do not restyle via FilterChip or Change-pencil one-offs — both surfaces import this.
 */
export function NearMeCta({
  onClick,
  className,
  type = "button",
  "aria-label": ariaLabel = NEAR_ME_CTA_LABEL,
}: NearMeCtaProps) {
  const classes = ["proto-near-me-cta", className].filter(Boolean).join(" ");

  return (
    <TertiaryCta
      type={type}
      compact
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      data-studio-action="avail-near-me"
      icon={<img src={iconMapPin} alt="" width={16} height={16} />}
    >
      {NEAR_ME_CTA_LABEL}
    </TertiaryCta>
  );
}
