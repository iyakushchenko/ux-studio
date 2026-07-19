import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonPrimaryProps = {
  children: ReactNode;
  className?: string;
  "data-name"?: string;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type" | "disabled" | "aria-label"
>;

/**
 * Thin UXDS primary button — uses semantic token
 * `--uxds-input-button-surface-surface-primary-solid`.
 * Project `styleguide/theme.css` remaps that role for brand.
 */
export function ButtonPrimary({
  children,
  className,
  "data-name": dataName = "component.input.button",
  type = "button",
  ...rest
}: ButtonPrimaryProps) {
  return (
    <button
      type={type}
      className={`uxds-btn-primary${className ? ` ${className}` : ""}`}
      data-name={dataName}
      {...rest}
    >
      {children}
    </button>
  );
}
