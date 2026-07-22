import "./maNavigationPanel.css";

/**
 * Shared My Account left-nav rail — UXDS `module.ma.navigation`
 * (Figma: myqzp3KRc1pxKDOv8RfTsl, node 12409:640716).
 * Used by appointment-history + appointment-details; keep in sync with
 * that Figma node rather than re-inlining per screen.
 */
export type MaNavigationPanelProps = {
  helloLabel: string;
  profileName: string;
  navItems: readonly string[];
  activeItem: string;
};

function AccountAvatar() {
  return (
    <div
      className="ma-navigation-panel__avatar"
      data-name="icon / accent / account"
      aria-hidden
    >
      <svg viewBox="0 0 24 28" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 14c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm0 2c-4.418 0-12 2.239-12 6.667V28h24v-5.333C24 18.239 16.418 16 12 16z"
          fill="#5C5C5C"
        />
      </svg>
    </div>
  );
}

export function MaNavigationPanel({
  helloLabel,
  profileName,
  navItems,
  activeItem,
}: MaNavigationPanelProps) {
  return (
    <aside className="ma-navigation-panel" data-name="module.ma.navigation">
      <div
        className="ma-navigation-panel__profile"
        data-name="component.ma.navigation.profile.name.and.icon"
      >
        <AccountAvatar />
        <p className="ma-navigation-panel__profile-text">
          <span>{helloLabel}</span> <span>{profileName}</span>
        </p>
      </div>

      <nav
        className="ma-navigation-panel__menu"
        data-name="component.ma.navigation.menu"
        aria-label="My Account"
      >
        {navItems.map((label) => {
          const active = label === activeItem;
          return (
            <div
              key={label}
              className={
                active
                  ? "ma-navigation-panel__menu-item ma-navigation-panel__menu-item--active"
                  : "ma-navigation-panel__menu-item"
              }
              data-name="component.ma.navigation.menu.item"
              aria-current={active ? "page" : undefined}
            >
              {label}
            </div>
          );
        })}
      </nav>

      <div
        className="ma-navigation-panel__service"
        data-name="component.ma.navigation.content.slot"
      >
        <p className="ma-navigation-panel__service-title">Customer Service</p>
        <p className="ma-navigation-panel__service-line">
          Monday – Friday: 9:00 am – 12:00 pm
        </p>
        <p className="ma-navigation-panel__service-line">
          Saturday: 9:00 am – 12:00 am
        </p>
        <p className="ma-navigation-panel__service-line">Sunday: Closed</p>
        <p className="ma-navigation-panel__service-line">
          Got a question or need help with your account?
        </p>
        <span className="ma-navigation-panel__service-contact">Contact us</span>
      </div>
    </aside>
  );
}
