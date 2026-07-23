import type { MouseEventHandler } from "react";

export type UxdsTextLinkItem = {
  label: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Stable REC/CJM capture target — see RECORDING.md § Hit targets. */
  actionId?: string;
};

/**
 * One `.uxds-link` text link — `<a>` when `href` is given, else `<button>`.
 * Shared by every kit that renders a titled group of links (mega-menu
 * flyout, full-screen search quick links / result groups) so they all stay
 * on the single kit-wide `.uxds-link` pattern instead of each hand-rolling
 * near-duplicate link markup.
 */
export function UxdsTextLink({
  link,
  className,
}: {
  link: UxdsTextLinkItem;
  /** Kit-scoped modifier class (e.g. `uxds-mega-menu-flyout__link`) — `.uxds-link` is always added. */
  className: string;
}) {
  const combinedClassName = `${className} uxds-link`;
  if (link.href) {
    return (
      <a
        className={combinedClassName}
        href={link.href}
        onClick={link.onClick}
        data-studio-action={link.actionId}
      >
        {link.label}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={combinedClassName}
      onClick={link.onClick}
      data-studio-action={link.actionId}
    >
      {link.label}
    </button>
  );
}
