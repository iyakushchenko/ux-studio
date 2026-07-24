import newcoLogo from "@/projects/newco/assets/logo.svg";
import { HUB_CONTENT } from "@/projects/newco/hub/hubContent";

type Props = {
  onGoToTab: (screenIndex: number) => void;
};

/**
 * First-draft basic wiki — reuses Boots' shared `.proto-hub-page` chrome
 * classes (globals-hub.css) but skips the diagram/tour/lightbox machinery:
 * NewCo has one screen and zero CJMs so far (PO, 2026-07-24).
 */
export default function HubPage({ onGoToTab }: Props) {
  const { title, lead, sections } = HUB_CONTENT;

  return (
    <main className="proto-hub-page" id="proto-hub-main">
      <div className="proto-hub-page__inner">
        <header className="proto-hub-page__hero">
          <div className="proto-hub-page__hero-brand">
            <img src={newcoLogo} alt="NewCo" width={104} height={26} />
          </div>
          <p className="proto-hub-page__hero-eyebrow">Project onboarding</p>
          <h1 className="proto-hub-page__h1">{title}</h1>
          <div className="proto-hub-page__lead">
            {lead.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </header>

        <div className="proto-hub-page__body">
          <div className="proto-hub-page__content">
            {sections.map((section) => {
              const headingId = `${section.id}-heading`;
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="proto-hub-page__section"
                  aria-labelledby={headingId}
                >
                  <h2 id={headingId} className="proto-hub-page__h2">
                    {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph, i) => (
                    <p key={i} className="proto-hub-page__p">
                      {paragraph}
                    </p>
                  ))}
                  {section.highlights?.length ? (
                    <ul className="proto-hub-page__highlights">
                      {section.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>

          <aside className="proto-hub-page__sidebar" aria-label="Page navigation">
            <nav className="proto-hub-page__toc" aria-label="On this page">
              <h2 className="proto-hub-page__toc-title">On this page</h2>
              <ol className="proto-hub-page__toc-list">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="proto-hub-page__toc-link"
                      onClick={(event) => {
                        event.preventDefault();
                        document
                          .getElementById(section.id)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <button
              type="button"
              className="proto-hub-page__open-cta"
              onClick={() => onGoToTab(0)}
            >
              Open Home
            </button>

            <div className="proto-hub-page__powered">
              <p className="proto-hub-page__powered-meta">
                Sourced from the UXBP Report — NewCo (Astound Digital UX
                Department).
              </p>
              <p className="proto-hub-page__powered-meta">
                © 2026 Astound Digital. All rights reserved.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
