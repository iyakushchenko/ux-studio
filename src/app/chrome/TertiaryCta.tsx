import type { ButtonHTMLAttributes, ReactNode } from "react";

type TertiaryCtaProps = {
  children: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  /**
   * Soft mint fill + ring (promo CTAs e.g. GP “Find out more”).
   * Transparent tertiary remains the default icon+text pattern.
   */
  soft?: boolean;
  className?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className"
>;

/**
 * Tertiary icon + text CTA — transparent, no hover wash; icon→navy, label→black.
 * Soft variant: mint fill for promo surfaces (Legacy GP CTA parity).
 * Styled via `.studio-tertiary-cta` in globals-chrome.css.
 */
export function TertiaryCta({
  children,
  icon,
  compact = false,
  soft = false,
  className,
  type = "button",
  ...rest
}: TertiaryCtaProps) {
  const sizeClass = compact ? " studio-tertiary-cta--compact" : "";
  const softClass = soft ? " studio-tertiary-cta--soft" : "";

  return (
    <button
      type={type}
      className={`studio-tertiary-cta${sizeClass}${softClass}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {icon ? <span className="studio-tertiary-cta__icon">{icon}</span> : null}
      <span className="studio-tertiary-cta__label">{children}</span>
    </button>
  );
}
