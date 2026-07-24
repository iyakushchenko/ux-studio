/**
 * Sourced from "UXBP Report — NewCo" (Astound Digital UX Department,
 * generated 24 Jul 2026, UXBP v2.3.1.5). Content below is paraphrased from
 * that report's Project Information / UX Strategy / Discovery / UX
 * Assumptions / UX Risks sections — not invented. First-draft basic wiki:
 * NewCo has one screen (Home) and zero CJMs so far, so this intentionally
 * skips the diagrams / screen-tour / lightbox machinery Boots' hub has.
 */

export type HubSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  highlights?: string[];
};

export const HUB_CONTENT: {
  title: string;
  lead: string[];
  sections: HubSection[];
} = {
  title: "NewCo — Project Hub",
  lead: [
    "NewCo is a Salesforce Storefront Next (SFCC / L360) rebuild for a diabetes-supply and medical-equipment retailer, built on UXDS B2C.",
    "This hub is a first-draft basic wiki — NewCo has one live screen (Home) and no recorded CJMs yet, so this page stays intentionally light: project facts and UX-strategy context, not a full prototype tour.",
  ],
  sections: [
    {
      id: "project-overview",
      title: "Project Overview",
      paragraphs: [
        "UX Team of 1, at 95% allocation. Estimated at 599–600 hours across 16 weeks / 8 sprints. Estimation status: In Progress (as of 25 Jun 2026).",
      ],
      highlights: [
        "UX Operating Model: CXM — coordinated, shared UX direction with partial alignment across streams.",
        "UX Process: CXP — modular, flexible, context-driven; only essential activities executed.",
        "Methodology: JTBD — Jobs-to-Be-Done, mapping user progress, motivations, and obstacles.",
        "Design System: UXDS B2C.",
      ],
    },
    {
      id: "persona",
      title: "Persona",
      paragraphs: [
        "Rick McGown — a 45-year-old newly diagnosed diabetes patient who values clear pricing, privacy, and an administrative-free digital ordering path.",
      ],
      highlights: [
        "No CJMs are recorded for this persona yet — the nav's Create CJM flow is the entry point once one is ready.",
      ],
    },
    {
      id: "discovery",
      title: "Discovery Process",
      paragraphs: [
        "The discovery process establishes a clear understanding of user needs and experience gaps to set project direction before design begins.",
      ],
      highlights: [
        "Review current experiences, competitor insights, and user interviews to identify gaps.",
        "Translate insights into a complete end-to-end user journey with key touchpoints.",
        "Establish UX direction — interaction principles and layout logic.",
        "Finalize and validate concepts with the client.",
      ],
    },
    {
      id: "assumptions",
      title: "UX Assumptions",
      paragraphs: [
        "Patient Persona is the baseline experience for storefront workshops; Provider Persona is covered as a \"delta.\" edgeparkrx.com and advanceddiabetessupply.com serve as benchmark experiences. Build target: Salesforce Storefront Next, launching in English and Spanish.",
      ],
      highlights: [
        "2 persona alignment sessions (1.5h each) + 9 workshop sessions (3h each).",
        "4 primary-persona product demos + 2 delta-persona demos.",
        "Design adaptations across 3 viewports: Small, Medium, Large.",
      ],
    },
    {
      id: "risks",
      title: "UX Risks & Bottom Line",
      paragraphs: [
        "No active non-prototype risks are currently identified — Total Risk Count: 0 (excluding prototype scope). One prototype-scope risk is tracked separately (1h).",
        "Bottom line: the CXP framework and CXM model guide partial alignment across B2C/B2B streams while JTBD maps functional patient goals during core workshops.",
        "Watch-out: merging B2C and B2B streams under one coordinated framework risks overlooking specialized multi-role validation flows for healthcare providers.",
      ],
    },
  ],
};
