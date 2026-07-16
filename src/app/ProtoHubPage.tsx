import { useEffect, useRef, useState } from "react";
import {
  PROTO_HUB,
  PROTO_HUB_SCREEN_GUIDE,
  type HubSection,
} from "@/app/protoHubContent";
import ProtoHubChatDiagram from "@/app/ProtoHubChatDiagram";
import ProtoHubExperienceDiagram from "@/app/ProtoHubExperienceDiagram";
import ProtoHubImageLightbox, {
  type HubLightboxImage,
} from "@/app/ProtoHubImageLightbox";
import ProtoHubTabLink from "@/app/ProtoHubTabLink";
import { protoScreenAtTab, protoTabToIndex } from "@/app/protoScreens";

type Props = {
  onGoToTab: (screenIndex: number) => void;
};

function HubHighlights({ items }: { items: string[] }) {
  return (
    <ul className="proto-hub-page__highlights">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function HubScreenLinks({
  tabs,
  onGoToTab,
}: {
  tabs: number[];
  onGoToTab: (screenIndex: number) => void;
}) {
  return (
    <div className="proto-hub-page__screen-links">
      {tabs.map((tab) => {
        const guide = PROTO_HUB_SCREEN_GUIDE.find((item) => item.tab === tab);
        const screen = protoScreenAtTab(tab);
        return (
          <ProtoHubTabLink
            key={tab}
            tab={tab}
            onGoToTab={onGoToTab}
            className="proto-hub-page__screen-link"
          >
            <span className="proto-hub-tab-link__badge">{tab}</span>
            <span className="proto-hub-page__screen-link-title">
              {guide?.headline ?? screen?.label ?? `Tab ${tab}`}
            </span>
            {guide?.detail ? (
              <span className="proto-hub-page__screen-link-detail">
                {guide.detail}
              </span>
            ) : null}
          </ProtoHubTabLink>
        );
      })}
    </div>
  );
}

function HubFigureBlock({
  figure,
  onOpen,
}: {
  figure: NonNullable<HubSection["figure"]>;
  onOpen: (figure: NonNullable<HubSection["figure"]>) => void;
}) {
  return (
    <figure className="proto-hub-page__figure">
      <button
        type="button"
        className="proto-hub-page__img-btn"
        onClick={() => onOpen(figure)}
        aria-label={`Enlarge: ${figure.alt}`}
      >
        <img
          className="proto-hub-page__img"
          src={figure.src}
          alt={figure.alt}
          loading="lazy"
          draggable={false}
        />
        <span className="proto-hub-page__img-overlay" aria-hidden>
          <span className="proto-hub-page__img-zoom-icon" />
          Click to enlarge
        </span>
      </button>
      {figure.caption ? (
        <figcaption className="proto-hub-page__caption">{figure.caption}</figcaption>
      ) : null}
    </figure>
  );
}

export default function ProtoHubPage({ onGoToTab }: Props) {
  const { title, lead, tourIntro, sections } = PROTO_HUB;
  const [lightboxImage, setLightboxImage] = useState<HubLightboxImage | null>(
    null
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const navLockRef = useRef<string | null>(null);
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    const scrollRoot = bodyRef.current?.closest(
      ".proto-scroll"
    ) as HTMLElement | null;
    if (!scrollRoot) return;

    const sectionEls = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el != null);
    if (!sectionEls.length) return;

    const activationOffset = 96;
    const bottomThreshold = 80;

    const updateActiveSection = () => {
      if (navLockRef.current) {
        setActiveSectionId(navLockRef.current);
        return;
      }

      const rootRect = scrollRoot.getBoundingClientRect();
      const bottomGap =
        scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight;

      if (bottomGap <= bottomThreshold) {
        setActiveSectionId(sectionEls[sectionEls.length - 1].id);
        return;
      }

      let current = sectionEls[0].id;
      for (const el of sectionEls) {
        if (el.getBoundingClientRect().top - rootRect.top <= activationOffset) {
          current = el.id;
        }
      }

      setActiveSectionId(current);
    };

    const onScroll = () => {
      if (navLockRef.current) {
        setActiveSectionId(navLockRef.current);
      } else {
        updateActiveSection();
      }

      if (scrollSettleTimerRef.current) {
        clearTimeout(scrollSettleTimerRef.current);
      }
      scrollSettleTimerRef.current = setTimeout(() => {
        navLockRef.current = null;
        updateActiveSection();
      }, 140);
    };

    updateActiveSection();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    const resizeObserver = new ResizeObserver(updateActiveSection);
    resizeObserver.observe(scrollRoot);

    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      if (scrollSettleTimerRef.current) {
        clearTimeout(scrollSettleTimerRef.current);
      }
    };
  }, [sections]);

  const scrollToTarget = (
    targetId: string,
    sectionIdForNav = targetId
  ) => {
    const scrollRoot = bodyRef.current?.closest(
      ".proto-scroll"
    ) as HTMLElement | null;
    const targetEl = document.getElementById(targetId);
    if (!scrollRoot || !targetEl) return;

    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    const lastSectionId = sections[sections.length - 1]?.id;
    let top = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 24;

    if (sectionIdForNav === lastSectionId) {
      top = maxScroll;
    }

    top = Math.min(Math.max(0, top), maxScroll);

    navLockRef.current = sectionIdForNav;
    setActiveSectionId(sectionIdForNav);
    scrollRoot.scrollTo({ top, behavior: "smooth" });

    window.setTimeout(() => {
      if (navLockRef.current === sectionIdForNav) {
        navLockRef.current = null;
      }
    }, 700);
  };

  const openFigure = (figure: {
    src: string;
    alt: string;
    caption?: string;
  }) => {
    setLightboxImage({
      src: figure.src,
      alt: figure.alt,
      caption: figure.caption,
    });
  };

  return (
    <>
      <main className="proto-hub-page" id="proto-hub-main">
        <div className="proto-hub-page__inner">
          <header className="proto-hub-page__header">
            <h1 className="proto-hub-page__h1">{title}</h1>
            <div className="proto-hub-page__lead">
              {lead.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </header>

          <section className="proto-hub-page__tour" aria-labelledby="proto-hub-tour-heading">
            <h2 id="proto-hub-tour-heading" className="proto-hub-page__tour-title">
              Prototype at a glance
            </h2>
            <p className="proto-hub-page__tour-intro">{tourIntro}</p>
            <div className="proto-hub-page__tour-grid">
              {PROTO_HUB_SCREEN_GUIDE.map((item) => (
                <ProtoHubTabLink
                  key={item.tab}
                  tab={item.tab}
                  onGoToTab={onGoToTab}
                  className="proto-hub-page__tour-card"
                >
                  <span className="proto-hub-page__tour-card-num">{item.tab}</span>
                  <span className="proto-hub-page__tour-card-headline">
                    {item.headline}
                  </span>
                  <span className="proto-hub-page__tour-card-detail">
                    {item.detail}
                  </span>
                </ProtoHubTabLink>
              ))}
            </div>
            <div className="proto-hub-page__tour-cta">
              <button
                type="button"
                className="proto-hub-page__tour-cta-btn"
                onClick={() => scrollToTarget("user-flow-diagram", "user-flow")}
              >
                Jump to flow diagram
              </button>
            </div>
          </section>

          <div ref={bodyRef} className="proto-hub-page__body">
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
                      <HubHighlights items={section.highlights} />
                    ) : null}

                    {section.experienceDiagram ? (
                      <div
                        id="user-flow-diagram"
                        className="proto-hub-page__diagram-block"
                      >
                        {section.experienceDiagram.title ? (
                          <h3 className="proto-hub-page__h3">
                            {section.experienceDiagram.title}
                          </h3>
                        ) : null}
                        <ProtoHubExperienceDiagram
                          diagram={section.experienceDiagram}
                          onGoToTab={onGoToTab}
                        />
                      </div>
                    ) : null}

                    {section.chatDiagram ? (
                      <ProtoHubChatDiagram
                        diagram={section.chatDiagram}
                        onGoToTab={onGoToTab}
                      />
                    ) : null}

                    {section.figure ? (
                      <div className="proto-hub-page__figure-block">
                        {section.experienceDiagram ? (
                          <h3 className="proto-hub-page__h3">Reference image</h3>
                        ) : null}
                        <HubFigureBlock
                          figure={section.figure}
                          onOpen={openFigure}
                        />
                      </div>
                    ) : null}

                    {section.experienceDiagram?.referenceFigure ? (
                      <div className="proto-hub-page__figure-block">
                        <h3 className="proto-hub-page__h3">Guiding UX board</h3>
                        <HubFigureBlock
                          figure={section.experienceDiagram.referenceFigure}
                          onOpen={openFigure}
                        />
                      </div>
                    ) : null}

                    {section.screenLinks?.length ? (
                      <HubScreenLinks
                        tabs={section.screenLinks}
                        onGoToTab={onGoToTab}
                      />
                    ) : null}

                    {section.steps?.length ? (
                      <ol
                        className="proto-hub-page__steps"
                        aria-label="Booking steps"
                      >
                        {section.steps.map((step) => (
                          <li key={step.title} className="proto-hub-page__step">
                            <div className="proto-hub-page__step-head">
                              <h3 className="proto-hub-page__step-title">
                                {step.title}
                              </h3>
                              {step.protoTab != null ? (
                                <ProtoHubTabLink
                                  tab={step.protoTab}
                                  onGoToTab={onGoToTab}
                                  className="proto-hub-flow__node-tab proto-hub-tab-link proto-hub-tab-link--badge"
                                >
                                  Tab {step.protoTab}
                                </ProtoHubTabLink>
                              ) : null}
                            </div>
                            <p className="proto-hub-page__p">{step.detail}</p>
                          </li>
                        ))}
                      </ol>
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
                        className={
                          activeSectionId === section.id
                            ? "proto-hub-page__toc-link is-active"
                            : "proto-hub-page__toc-link"
                        }
                        aria-current={
                          activeSectionId === section.id ? "location" : undefined
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          scrollToTarget(section.id);
                        }}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="proto-hub-page__powered">
                <p className="proto-hub-page__powered-kicker">Powered by</p>
                <p className="proto-hub-page__powered-tools">Astound Digital</p>
                <p className="proto-hub-page__powered-byline">
                  AD UX Department · R&D Department
                </p>
                <p className="proto-hub-page__powered-detail">
                  Internal experience tools behind this concept, stakeholder
                  walkthrough, and persona journey.
                </p>
                <p className="proto-hub-page__powered-note">
                  AI-assisted content is grounded in real research and
                  human-reviewed before it is shared.
                </p>
              </div>

              <button
                type="button"
                className="proto-hub-page__open-cta"
                onClick={() => onGoToTab(protoTabToIndex(1))}
              >
                Open UX Concept
              </button>
            </aside>
          </div>
        </div>
      </main>

      <ProtoHubImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
}
