import type { ButtonHTMLAttributes, ReactNode } from "react";

type TertiaryCtaProps = {
  children: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className"
>;

/**
 * Tertiary icon + text CTA — transparent, no hover wash; icon→navy, label→black.
 * Styled via `.studio-tertiary-cta` in globals.css.
 */
export function TertiaryCta({
  children,
  icon,
  compact = false,
  className,
  type = "button",
  ...rest
}: TertiaryCtaProps) {
  const sizeClass = compact ? " studio-tertiary-cta--compact" : "";

  return (
    <button
      type={type}
      className={`studio-tertiary-cta${sizeClass}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {icon ? <span className="studio-tertiary-cta__icon">{icon}</span> : null}
      <span className="studio-tertiary-cta__label">{children}</span>
    </button>
  );
}
