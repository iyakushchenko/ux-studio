import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconHitProps = {
  /** Accessible name for icon-only control. */
  label: string;
  /** Visual glyph size inside the circular hit target (default 16 — share/heart). */
  glyphSize?: 16 | 24;
  children: ReactNode;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;

/**
 * Icon-only hit target — circular hover wash + glyph fill (PDP share / heart).
 * Styled via `.studio-icon-hit` in globals.css.
 */
export function IconHit({
  label,
  glyphSize = 16,
  children,
  className,
  onClick,
  type = "button",
}: IconHitProps) {
  const glyphClass =
    glyphSize === 24 ? "studio-icon-hit__glyph--24" : "studio-icon-hit__glyph--16";

  return (
    <button
      type={type}
      className={`studio-icon-hit${className ? ` ${className}` : ""}`}
      aria-label={label}
      onClick={onClick}
    >
      <span className={`studio-icon-hit__glyph ${glyphClass}`}>{children}</span>
    </button>
  );
}
