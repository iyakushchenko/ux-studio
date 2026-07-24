import { useEffect, useRef, useState } from "react";
import newcoLogo from "@/projects/newco/assets/logo.svg";
import newcoHeroImage from "@/projects/newco/assets/hero.png";
import newcoDailyCareImage from "@/projects/newco/assets/daily-care.png";
import newcoInsuranceImage from "@/projects/newco/assets/insurance.jpg";
import articleSupplies from "@/projects/newco/assets/article-supplies.jpg";
import articleInsurance from "@/projects/newco/assets/article-insurance.jpg";
import articleCareTips from "@/projects/newco/assets/article-caretips.jpg";
import {
  ARTICLES,
  BRAND_COPYRIGHT,
  BRAND_PHONE,
  DAILY_CARE_POINTS,
  ACCOUNT_MENU,
  FOOTER_COLUMNS,
  HELP_CARDS,
  INSURANCE_POINTS,
  MEGA_MENU,
  NAV_LINKS,
  PARTNER_CARDS,
  PRODUCT_CATEGORIES,
  PRODUCTS_POINTS,
  TESTIMONIALS,
} from "@/projects/newco/screens/home/newcoHomeContent";
import {
  ArrowIcon,
  BellIcon,
  BillingIcon,
  CareIcon,
  CartIcon,
  CategoryIcon,
  ChevronDownIcon,
  ChevronIcon,
  ChevronRightIcon,
  EligibilityIcon,
  OrdersIcon,
  PersonIcon,
  RefillIcon,
  ShieldIcon,
  SignOutIcon,
} from "@/projects/newco/screens/home/newcoIcons";

/** Real photographs (Lorem Picsum — actual stock photos, not placeholder boxes), one stable seed per slot. */
function photo(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const ARTICLE_IMAGES: Record<string, string> = {
  supplies: articleSupplies,
  insurance: articleInsurance,
  caretips: articleCareTips,
};

function NewCoLogo() {
  return (
    <a href="#home" className="newco-logo" data-studio-action="newco-logo-home" aria-label="NewCo home">
      <img src={newcoLogo} alt="NewCo" width={104} height={26} />
    </a>
  );
}

/** Same debounce timing as Boots' Header.tsx account flyout (scheduleShow/scheduleHide). */
const SHOW_DELAY_MS = 100;
const HIDE_DELAY_MS = 200;

/** Debounced open/close so briefly crossing a gap between trigger and panel doesn't close it. */
function useHoverFlyout<T>(initial: T | null = null) {
  const [value, setValue] = useState<T | null>(initial);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const scheduleShow = (next: T) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setValue(next), SHOW_DELAY_MS);
  };
  const scheduleHide = () => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setValue(null), HIDE_DELAY_MS);
  };
  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  return { value, scheduleShow, scheduleHide, cancelHide, setValue };
}

export function NewCoHomeScreen() {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [email, setEmail] = useState("");
  const nav = useHoverFlyout<(typeof NAV_LINKS)[number]>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const account = useHoverFlyout<true>(null);

  return (
    <div className="newco-home" data-name="screen.newco.home">
      <header className="newco-header">
        <div className="newco-header__bar newco-header__bar--top">
          <div className="newco-shell newco-header__top-row">
            <span className="newco-header__phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.1 21 3 12.9 3 3c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              {BRAND_PHONE}
            </span>
            <span className="newco-header__eligibility">
              Understand your coverage now.{" "}
              <a href="#eligibility" data-studio-action="newco-header-eligibility">
                Check eligibility
              </a>
            </span>
            <button type="button" className="newco-header__locale" data-studio-action="newco-header-locale">
              En <ChevronDownIcon />
            </button>
          </div>
        </div>
        <div className="newco-header__bar newco-header__bar--main">
          <div className="newco-shell newco-header__row">
            <NewCoLogo />
            <div className="newco-search">
              <span className="newco-search__icon newco-search__icon--start" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                className="newco-search__input newco-search__input--icon-start"
                placeholder="Search products, SKUs, or conditions..."
                aria-label="Search products, SKUs, or conditions"
                data-studio-search-icon="true"
                data-studio-search-icon-pos="start"
              />
            </div>
            <div className="newco-header__actions">
              <div
                className="newco-account"
                onMouseEnter={() => account.scheduleShow(true)}
                onMouseLeave={() => account.scheduleHide()}
              >
                <button
                  type="button"
                  className="newco-account-btn"
                  data-studio-action="newco-header-account"
                  aria-label="Account: Hi, John"
                  aria-expanded={!!account.value}
                  onFocus={() => account.scheduleShow(true)}
                >
                  <PersonIcon />
                  <span>Hi, John</span>
                </button>
                {account.value ? (
                  <div
                    className="newco-account-flyout"
                    onMouseEnter={account.cancelHide}
                    onMouseLeave={() => account.scheduleHide()}
                  >
                    {ACCOUNT_MENU.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="newco-account-flyout__item"
                        data-studio-action={`newco-account-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        onClick={() => account.setValue(null)}
                      >
                        {item.icon === "eligibility" ? (
                          <EligibilityIcon />
                        ) : item.icon === "orders" ? (
                          <OrdersIcon />
                        ) : item.icon === "billing" ? (
                          <BillingIcon />
                        ) : (
                          <SignOutIcon />
                        )}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="newco-icon-btn newco-icon-btn--badge" data-studio-action="newco-header-notifications" aria-label="Notifications, 12 unread">
                <BellIcon />
                <span className="newco-badge">12</span>
              </button>
              <button type="button" className="newco-icon-btn newco-icon-btn--badge" data-studio-action="newco-header-cart" aria-label="Cart, 4 items">
                <CartIcon />
                <span className="newco-badge">4</span>
              </button>
              <button type="button" className="newco-btn newco-btn--solid" data-studio-action="newco-header-reorder">
                Reorder
              </button>
            </div>
          </div>
        </div>
        <nav className="newco-header__bar newco-header__bar--nav" aria-label="Primary">
          <div className="newco-shell newco-nav">
            {NAV_LINKS.map((label) => {
              const menu = MEGA_MENU[label];
              const isOpen = nav.value === label;
              const isFlat = menu.categories.every((c) => c.subLinks.length === 0);
              const active =
                menu.categories.find((c) => c.label === activeCategory) ?? menu.categories[0];
              const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const openThis = () => {
                nav.scheduleShow(label);
                setActiveCategory(menu.categories[0]?.label ?? null);
              };
              return (
                <div
                  key={label}
                  className="newco-nav__item"
                  onMouseLeave={() => nav.scheduleHide()}
                >
                  <a
                    href={`#${slug}`}
                    className="newco-nav__link"
                    data-studio-action={`newco-nav-${slug}`}
                    aria-expanded={isOpen}
                    onMouseEnter={openThis}
                    onFocus={openThis}
                    onClick={(e) => e.preventDefault()}
                  >
                    {label} <ChevronDownIcon />
                  </a>
                  {isOpen ? (
                    <>
                      <div className="newco-mega-menu-scrim" aria-hidden />
                      <div
                        className="newco-mega-menu"
                        onMouseEnter={nav.cancelHide}
                        onMouseLeave={() => nav.scheduleHide()}
                      >
                        <div className="newco-mega-menu__categories">
                          {menu.categories.map((cat) =>
                            isFlat ? (
                              <a
                                key={cat.label}
                                href={`#${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                className="newco-mega-menu__category newco-mega-menu__category--flat"
                                data-studio-action={`newco-mega-${slug}-${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                              >
                                <span>{cat.label}</span>
                              </a>
                            ) : (
                              <button
                                key={cat.label}
                                type="button"
                                className={`newco-mega-menu__category${cat.label === active?.label ? " is-active" : ""}`}
                                data-studio-action={`newco-mega-${slug}-cat-${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                onMouseEnter={() => setActiveCategory(cat.label)}
                              >
                                <span>{cat.label}</span>
                                <ChevronRightIcon />
                              </button>
                            )
                          )}
                        </div>
                        {!isFlat ? (
                          <div className="newco-mega-menu__sublinks">
                            <ul>
                              {active?.subLinks.map((link) => (
                                <li key={link}>
                                  <a
                                    href={`#${link.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                    data-studio-action={`newco-mega-${slug}-${link.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                  >
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <div
                          className={`newco-mega-menu__promo${isFlat ? " newco-mega-menu__promo--flat" : ""}`}
                          style={{ backgroundImage: `url(${newcoHeroImage})` }}
                        >
                          <div className="newco-mega-menu__promo-scrim" />
                          <h4>{menu.promo.title}</h4>
                          <a
                            href={`#${slug}-promo`}
                            className="newco-btn newco-btn--outline-white"
                            data-studio-action={`newco-mega-${slug}-promo`}
                          >
                            {menu.promo.cta}
                          </a>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>
      </header>

      <main>
        <section
          className="newco-hero"
          style={{
            backgroundImage: `linear-gradient(115deg, rgba(23,23,23,0.82) 0%, rgba(46,46,46,0.62) 45%, rgba(74,74,74,0.28) 100%), url(${newcoHeroImage})`,
          }}
        >
          <div className="newco-shell newco-hero__inner">
            <h1 className="newco-hero__title">
              Seamless Care,
              <br />
              Delivered to Your Door.
            </h1>
            <p className="newco-hero__body">
              Quality Medical Supplies for Chronic Health Conditions Covered by Insurance
            </p>
            <div className="newco-hero__ctas">
              <button type="button" className="newco-btn newco-btn--outline-inverse" data-studio-action="newco-hero-signup">
                Sign Up Today
              </button>
              <button type="button" className="newco-btn newco-btn--solid-inverse" data-studio-action="newco-hero-reorder">
                Reorder Now
              </button>
            </div>
          </div>
        </section>

        <section className="newco-section" id="how-we-help">
          <div className="newco-shell">
            <h2 className="newco-section__title newco-section__title--center">How We Help You</h2>
            <div className="newco-help-grid">
              {HELP_CARDS.map((card) => (
                <article className="newco-help-card" key={card.title}>
                  <span className="newco-help-card__icon" aria-hidden>
                    {card.title === "Easy Refills" ? (
                      <RefillIcon />
                    ) : card.title === "Simple, Transparent Billing" ? (
                      <BillingIcon />
                    ) : (
                      <CareIcon />
                    )}
                  </span>
                  <h3 className="newco-help-card__title">{card.title}</h3>
                  <p className="newco-help-card__body">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="newco-section newco-section--muted">
          <div className="newco-shell newco-banner">
            <p className="newco-eyebrow">Getting Started</p>
            <h2 className="newco-section__title">Your First Order</h2>
            <p className="newco-banner__body">
              We'll review your prescription info, verify insurance coverage, and confirm what's
              needed before shipping — most first orders ship within a few business days.
            </p>
            <button type="button" className="newco-btn newco-btn--outline" data-studio-action="newco-first-order-expect">
              What to Expect
            </button>
          </div>
        </section>

        <section className="newco-section" id="products">
          <div className="newco-shell newco-split">
            <div className="newco-split__text">
              <p className="newco-eyebrow">Extensive Catalog</p>
              <h2 className="newco-section__title">The Products You Know and Rely On</h2>
              <p className="newco-split__body">
                We carry all of the major, trusted brands your care team already recommends —
                delivered on the schedule you set, with no guesswork.
              </p>
              <ul className="newco-check-list">
                {PRODUCTS_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <button type="button" className="newco-btn newco-btn--solid" data-studio-action="newco-products-browse">
                Browse Products
              </button>
            </div>
            <div className="newco-category-grid">
              {PRODUCT_CATEGORIES.map((label) => (
                <div className="newco-category-tile" key={label} data-studio-action={`newco-category-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <span className="newco-category-tile__icon" aria-hidden>
                    <CategoryIcon />
                  </span>
                  <span className="newco-category-tile__label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="newco-section" id="insurance">
          <div className="newco-shell newco-split newco-split--reverse">
            <div className="newco-split__media">
              <img
                src={newcoInsuranceImage}
                alt="Health insurance plan documents and benefits summary on a desk"
                width={640}
                height={480}
                loading="lazy"
              />
            </div>
            <div className="newco-split__text">
              <p className="newco-eyebrow">Insurance Made Easy</p>
              <h2 className="newco-section__title">We Work With Your Insurance</h2>
              <p className="newco-split__body">
                Not sure what's covered? We check your benefits before you ever place an order, so
                there are no surprises when your supplies arrive.
              </p>
              <ul className="newco-check-list">
                {INSURANCE_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <button type="button" className="newco-btn newco-btn--solid" data-studio-action="newco-insurance-verify">
                Verify Coverage
              </button>
            </div>
          </div>
        </section>

        <section className="newco-section newco-section--muted" id="reviews">
          <div className="newco-shell">
            <h2 className="newco-section__title newco-section__title--center">Our Customers Say</h2>
            <div className="newco-testimonials">
              <button
                type="button"
                className="newco-testimonials__nav"
                aria-label="Previous testimonial"
                data-studio-action="newco-testimonial-prev"
                onClick={() =>
                  setTestimonialIndex(
                    (i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
                  )
                }
              >
                <ChevronIcon direction="left" />
              </button>
              <div className="newco-testimonials__track">
                {TESTIMONIALS.map((t, i) => (
                  <blockquote
                    className={`newco-testimonial-card${i === testimonialIndex ? " is-active" : ""}`}
                    key={t.name}
                  >
                    <p>&ldquo;{t.quote}&rdquo;</p>
                    <footer>
                      <span className="newco-testimonial-card__name">{t.name}</span>
                      <span className="newco-testimonial-card__detail">{t.detail}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
              <button
                type="button"
                className="newco-testimonials__nav"
                aria-label="Next testimonial"
                data-studio-action="newco-testimonial-next"
                onClick={() => setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length)}
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
            <div className="newco-testimonials__dots">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  className={`newco-dot${i === testimonialIndex ? " is-active" : ""}`}
                  aria-label={`Show testimonial ${i + 1}`}
                  data-studio-action={`newco-testimonial-dot-${i}`}
                  onClick={() => setTestimonialIndex(i)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="newco-section newco-badges" aria-label="Accreditations">
          <div className="newco-shell newco-badges__row">
            {Array.from({ length: 6 }).map((_, i) => (
              <span className="newco-badges__icon" aria-hidden key={i}>
                <ShieldIcon />
              </span>
            ))}
          </div>
        </section>

        <section className="newco-section" id="digital-care">
          <div className="newco-shell newco-split">
            <div className="newco-split__text">
              <p className="newco-eyebrow">Why NewCo</p>
              <h2 className="newco-section__title">Simplifying Your Daily Care</h2>
              <p className="newco-split__body">
                Manage everything from your phone — track shipments, message your care team, and
                keep your insurance documents in one place.
              </p>
              <ul className="newco-check-list">
                {DAILY_CARE_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <button type="button" className="newco-btn newco-btn--solid" data-studio-action="newco-app-discover">
                Discover the NewCo
              </button>
            </div>
            <div className="newco-split__media">
              <img
                src={newcoDailyCareImage}
                alt="Doctor consulting a patient using a digital tablet"
                width={640}
                height={480}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="newco-section newco-section--muted" id="partners">
          <div className="newco-shell newco-split">
            <div className="newco-split__text">
              <p className="newco-eyebrow">Partner With Us</p>
              <h2 className="newco-section__title">Partnering for Better Care</h2>
              <p className="newco-split__body">
                We work alongside healthcare providers, health plans, and pharmacy professionals to
                get patients the supplies they need, faster.
              </p>
              <button type="button" className="newco-btn newco-btn--outline" data-studio-action="newco-partners-explore">
                Explore Partnerships
              </button>
            </div>
            <div className="newco-partner-grid">
              {PARTNER_CARDS.map((card) => (
                <article className="newco-partner-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <a
                    href={`#${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className="newco-text-link"
                    data-studio-action={`newco-partner-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    Learn More <ArrowIcon />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="newco-section" id="articles">
          <div className="newco-shell">
            <div className="newco-articles__head">
              <h2 className="newco-section__title">The Latest from NewCo</h2>
              <a href="#articles" className="newco-text-link" data-studio-action="newco-articles-view-all">
                View all <ArrowIcon />
              </a>
            </div>
            <div className="newco-article-grid">
              {ARTICLES.map((article) => (
                <article className="newco-article-card" key={article.title}>
                  <img
                    src={ARTICLE_IMAGES[article.image]}
                    alt=""
                    width={480}
                    height={320}
                    loading="lazy"
                  />
                  <p className="newco-article-card__tag">{article.tag}</p>
                  <h3>{article.title}</h3>
                  <p className="newco-article-card__date">{article.date}</p>
                  <p className="newco-article-card__excerpt">{article.excerpt}</p>
                  <a
                    href={`#${article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="newco-text-link"
                    data-studio-action={`newco-article-${article.seed}`}
                  >
                    Learn more <ArrowIcon />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="newco-section newco-section--muted">
          <div className="newco-shell newco-cta-banner">
            <h2 className="newco-section__title">We're here to help you get started</h2>
            <button type="button" className="newco-btn newco-btn--solid" data-studio-action="newco-cta-contact">
              Contact Us
            </button>
          </div>
        </section>
      </main>

      <footer className="newco-footer">
        <div className="newco-shell newco-footer__grid">
          {FOOTER_COLUMNS.map((col) => (
            <div className="newco-footer__col" key={col.heading}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      data-studio-action={`newco-footer-${link.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="newco-footer__newsletter-band">
          <div className="newco-shell newco-footer__extras">
            <div className="newco-footer__block newco-footer__newsletter">
              <p className="newco-footer__block-title">Newsletter</p>
              <p className="newco-footer__block-copy">
                Sign up for our latest platform updates and product news.
              </p>
              <form
                className="newco-footer__email-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEmail("");
                }}
              >
                <input
                  className="newco-footer__email-input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                  required
                />
                <button type="submit" className="newco-footer__signup-btn" data-studio-action="newco-newsletter-signup">
                  Sign up
                </button>
              </form>
            </div>
            <div className="newco-footer__block newco-footer__socials">
              <p className="newco-footer__block-title">See what&apos;s new on our socials</p>
              <p className="newco-footer__block-copy">
                Stay connected with us! Follow for the latest company updates, healthcare resources,
                and product news.
              </p>
              <div className="newco-social-row">
                {["Facebook", "Instagram", "LinkedIn", "YouTube"].map((label) => (
                  <a
                    key={label}
                    href={`#${label.toLowerCase()}`}
                    className="newco-icon-btn newco-icon-btn--muted"
                    aria-label={label}
                    data-studio-action={`newco-social-${label.toLowerCase()}`}
                  >
                    {label[0]}
                  </a>
                ))}
              </div>
            </div>
            <div className="newco-footer__block newco-footer__brand-ctas">
              <p className="newco-footer__block-title">NewCo</p>
              <p className="newco-footer__block-copy">
                Easily browse our catalog or quickly reorder your medical supplies online.
              </p>
              <div className="newco-footer__cta-row">
                <a href="#products" className="newco-footer__cta newco-footer__cta--outline" data-studio-action="newco-footer-browse-catalog">
                  Browse Catalog
                </a>
                <a href="#reorder" className="newco-footer__cta newco-footer__cta--outline" data-studio-action="newco-footer-reorder">
                  Reorder
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="newco-shell newco-footer__bottom">
          <span>{BRAND_COPYRIGHT}</span>
          <span>{BRAND_PHONE}</span>
        </div>
      </footer>
    </div>
  );
}
