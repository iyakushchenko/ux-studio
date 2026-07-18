import hubOverview from "@/assets/hub/vaccine-appointment-ui-overview.jpg";
import personaJourneyMap from "@/assets/hub/persona-and-journey-map.jpg";
import personaPath from "@/assets/hub/xe-card-persona-path.jpg";

export type HubFigure = {
  src: string;
  alt: string;
  caption?: string;
};

export type HubStep = {
  title: string;
  detail: string;
  protoTab?: number;
};

export type HubFlowNode = {
  label: string;
  detail?: string;
  protoTab?: number;
};

export type HubExperienceDiagram = {
  title?: string;
  intent: string;
  lanes: {
    id: string;
    title: string;
    subtitle: string;
    variant: "agentic" | "traditional";
    nodes: HubFlowNode[];
  }[];
  shared: {
    title: string;
    subtitle: string;
    nodes: HubFlowNode[];
  };
  notes?: string[];
  referenceFigure?: HubFigure;
};

export type HubScreenGuide = {
  tab: number;
  headline: string;
  detail: string;
};

export type HubSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  highlights?: string[];
  figure?: HubFigure;
  steps?: HubStep[];
  screenLinks?: number[];
  experienceDiagram?: HubExperienceDiagram;
  chatDiagram?: HubChatDiagram;
};

export type HubChatAction = {
  label: string;
  outcome: string;
  protoTab?: number;
  variant: "cta" | "link" | "chip";
};

export type HubChatTurn = {
  turn: number;
  user: string;
  assistantSummary: string;
  assistantDetails?: string[];
  actions?: HubChatAction[];
};

export type HubChatDiagram = {
  title: string;
  intro: string;
  protoTab: number;
  home: {
    query: string;
    suggestedChips: string[];
    sendAction: string;
  };
  turns: HubChatTurn[];
  composer: {
    placeholder: string;
    nextDialogChips: string[];
    chipBehavior: string;
  };
  patterns: { title: string; detail: string }[];
};

export const PROTO_HUB_SCREEN_GUIDE: HubScreenGuide[] = [
  {
    tab: 1,
    headline: "Agentic home",
    detail:
      "Natural language entry point. See how a customer states intent without knowing catalogue structure.",
  },
  {
    tab: 2,
    headline: "Agentic chat",
    detail:
      "Guided conversation with smart next steps into browse, product detail, or book now.",
  },
  {
    tab: 3,
    headline: "Vaccinations listing (PLP)",
    detail:
      "Filter jabs or travel bundles, compare realistic pack copy and price, then open PDP from tile titles or Book now.",
  },
  {
    tab: 4,
    headline: "Vaccine details",
    detail:
      "Product detail with recipient choice, dosing options, and the primary book CTA.",
  },
  {
    tab: 5,
    headline: "Book: location",
    detail:
      "Availability Tool with search, near me, list and map, and pharmacy selection.",
  },
  {
    tab: 6,
    headline: "Book: date and time",
    detail:
      "Calendar and slot pick at the chosen store, with summary pills carried forward.",
  },
  {
    tab: 7,
    headline: "Book: confirmation",
    detail:
      "Final review of vaccine, recipient, location, and appointment before completion.",
  },
  {
    tab: 8,
    headline: "Appointment history",
    detail: "Post booking view of upcoming and past vaccination appointments.",
  },
  {
    tab: 9,
    headline: "Appointment details",
    detail:
      "Single appointment record with status, location, and follow up actions.",
  },
];

export const PROTO_HUB = {
  title: "Boots Health Vaccine Appointment Prototype",
  lead: [
    "This prototype shows how Boots Health can take Sarah from travel vaccine intent to a confirmed appointment, whether she starts in conversation or in browse, without breaking trust at checkout.",
    "This page explains what each part of the concept is for and why it matters. Open any numbered tab in the nav when you want to see the live screen behind the story.",
  ],
  tourIntro:
    "All nine screens in one place. Start with the persona and reading order below, then open tabs 2, 3, and 5 to 7 when you want to follow Sarah's journey end to end.",
  sections: [
    {
      id: "persona",
      title: "Who we are designing for",
      paragraphs: [
        "Every screen in this prototype is anchored to a single primary persona so product, clinical, and commercial teams can judge decisions against a real customer need rather than abstract wireframes.",
        "Sarah Jenkins represents a busy, health conscious B2C customer. She expects Boots to make eligibility, pricing, and booking feel straightforward in one coherent journey.",
      ],
      highlights: [
        "Primary job: book the right travel vaccination with confidence.",
        "Scenario in this concept: three week Indonesia trip, wants a bundle, needs pricing and timing upfront.",
        "Success looks like: no dead ends between discovery, comparison, and checkout.",
      ],
      figure: {
        src: personaJourneyMap,
        alt: "Persona and journey map showing profile, customer journey map, user story, and user flow",
        caption:
          "Research artefact: persona profile, journey map across touchpoints, narrative user story, and high level flow into the appointment experience.",
      },
    },
    {
      id: "reading-order",
      title: "How to explore this prototype",
      paragraphs: [
        "The sections on this page follow the same order as Sarah's journey. Each step below links to the tab where that part of the experience lives in the clickable build.",
      ],
      steps: [
        {
          title: "1. Understand Sarah's goal",
          detail:
            "Sarah Jenkins, described above, is planning a three week Southeast Asia trip centred on Indonesia. She wants a travel vaccine bundle, clear pricing, and a single path to book without repeating her itinerary at every step.",
        },
        {
          title: "2. Agentic entry on tabs 1 and 2",
          detail:
            "On tabs 1 and 2, SitePilot responds with a recommended travel pack, booking timeline guidance, and clear routes into the catalogue, product detail, or book flow without keeping the conversation in chat alone.",
          protoTab: 2,
        },
        {
          title: "3. Comparison on tab 3",
          detail:
            "On tab 3, switch to Bundles, filter by region or disease, read what each pack covers, adjust filters with chips or Reset Filters, and open a bundle from the tile title or Book now into product detail.",
          protoTab: 3,
        },
        {
          title: "4. Shared booking on tabs 5 to 7",
          detail:
            "On tabs 5 to 7, Sarah uses the same Availability Tool, date and time selection, and confirmation whether she arrived from chat or from browse. One funnel protects operational consistency and customer trust.",
          protoTab: 5,
        },
      ],
    },
    {
      id: "user-flow",
      title: "Two ways in, one booking funnel",
      paragraphs: [
        "The strategic question is not agentic versus traditional in isolation. It is whether Boots can shorten early discovery while keeping the same transactional UI at checkout.",
        "The diagram below shows how both paths converge. Tab badges jump straight into the live screen.",
      ],
      highlights: [
        "Agentic path: intent captured in one query, then routed into familiar Boots UI.",
        "Traditional path: full listing comparison before commit, including bundles and filters on tab 3.",
        "Shared funnel from recipient choice onward: one checkout experience.",
      ],
      figure: {
        src: personaPath,
        alt: "Sarah Jenkins persona card with vaccination booking user flow diagram",
        caption:
          "Persona path card: search intents, jobs to be done, and the eight screen happy path for Sarah Jenkins.",
      },
      experienceDiagram: {
        title: "Interactive flow diagram",
        intent:
          "Find and book the right vaccination with clear pricing, eligibility, and a single coherent journey.",
        lanes: [
          {
            id: "agentic",
            title: "Agentic experience",
            subtitle:
              "Intent first. Conversation guides the customer into the right next action.",
            variant: "agentic",
            nodes: [
              {
                label: "Agentic home",
                detail:
                  "Seeded vaccination query, suggested intents, and send into chat.",
                protoTab: 1,
              },
              {
                label: "Agentic chat",
                detail:
                  "Pharmacy aware replies with chips for catalog, product detail, availability, and book now.",
                protoTab: 2,
              },
              {
                label: "Route to browse or book",
                detail:
                  "Chat routes into PLP (tab 3), PDP (tab 4), or book now into the shared funnel.",
              },
            ],
          },
          {
            id: "traditional",
            title: "Traditional experience",
            subtitle:
              "Browse led. Full comparison before the customer commits to book.",
            variant: "traditional",
            nodes: [
              {
                label: "Vaccination category",
                detail:
                  "Entry from site navigation or search into the vaccinations category.",
              },
              {
                label: "Vaccination listing (PLP)",
                detail:
                  "Filter by age, disease, region, and country. Compare individual jabs or region specific travel packs before product detail.",
                protoTab: 3,
              },
              {
                label: "Vaccination details (PDP)",
                detail:
                  "Pricing, recipient toggle, dosing options, and book now into the funnel.",
                protoTab: 4,
              },
              {
                label: "Log in or register",
                detail:
                  "Boots Account required before checkout. Quick sign in or create account.",
              },
            ],
          },
        ],
        shared: {
          title: "Shared booking funnel",
          subtitle:
            "One checkout experience for every entry path. Click any tab badge to open that screen.",
          nodes: [
            {
              label: "Choose recipient",
              detail:
                "Myself or someone else. Summary pills on book steps reflect this choice.",
            },
            {
              label: "Choose location",
              detail:
                "Search or near me, pick a pharmacy in the Availability Tool, then continue.",
              protoTab: 5,
            },
            {
              label: "Choose date and time",
              detail: "Calendar and slot selection at the chosen store.",
              protoTab: 6,
            },
            {
              label: "Confirmation",
              detail:
                "Review vaccine, recipient, location, and appointment time before completing.",
              protoTab: 7,
            },
            {
              label: "Appointment history",
              detail: "Past and upcoming visits after booking is complete.",
              protoTab: 8,
            },
            {
              label: "Appointment details",
              detail: "Single record with status, location, and actions.",
              protoTab: 9,
            },
          ],
        },
        notes: [
          "Click a tab badge in the diagram to jump directly to that prototype screen.",
          "The Guiding UX board below is the design source of truth for this logic.",
        ],
        referenceFigure: {
          src: hubOverview,
          alt: "Guiding UX board showing agentic pilot, browse, book funnel, and appointment history",
          caption:
            "Guiding UX overview board: agentic home and chat on the left, PLP and PDP in the centre, shared book steps and post appointment screens on the right.",
        },
      },
    },
    {
      id: "agentic",
      title: "How the chat experience is designed",
      paragraphs: [
        "SitePilot is not a replacement for Boots UI. It structures a conversation that resolves into familiar screens, links, and the Availability Tool.",
        "The diagram below documents each chat turn on tab 2: what Sarah asks, what SitePilot returns, and what each control does in the prototype.",
      ],
      highlights: [
        "Turn 1 recommends a travel pack and surfaces booking timeline guidance.",
        "Turns 2 to 4 hand off into the real Availability Tool, not a chat only simulation.",
        "Composer chips prefill the next question or open a tool step directly.",
      ],
      chatDiagram: {
        title: "SitePilot chat conversation map",
        intro:
          "Four turns illustrate the pattern: a structured assistant reply, explicit next steps, then a transactional handoff that stays inside Boots.",
        protoTab: 2,
        home: {
          query:
            "I need a full course of travel vaccinations for a three week trip to Southeast Asia (Indonesia) starting next month, specifically looking to book and buy jabs as a bundle if possible.",
          suggestedChips: [
            "Vaccine services",
            "Skin health services",
            "Other Health services",
          ],
          sendAction: "Send or a suggested chip opens tab 2 (Chat) with the query carried in.",
        },
        turns: [
          {
            turn: 1,
            user: "Travel vaccinations for Southeast Asia, book as a bundle.",
            assistantSummary:
              "SitePilot recommends the Southeast Asia Travel Vaccination Pack (£245) with jab coverage, eligibility notes, Yellow Fever guidance, and a critical booking timeline (book by July 23).",
            assistantDetails: [
              "Inline links for Southeast Asia Travel Vaccination Pack, Hepatitis A, Typhoid, Tetanus Booster, and Yellow Fever Vaccine open tab 4 (product detail).",
              "Go to vaccines catalog opens tab 3 (listing) to compare bundles with live filters.",
              "Boots Account sign in appears before checkout.",
            ],
            actions: [
              {
                label: "Book Southeast Asia Travel Vaccination Pack at £245",
                outcome: "Opens tab 4 (product detail) for bundle booking.",
                protoTab: 4,
                variant: "cta",
              },
              {
                label: "Book Yellow Fever Vaccine only at £75",
                outcome: "Opens tab 4 (product detail) for a single vaccine.",
                protoTab: 4,
                variant: "cta",
              },
              {
                label: "Go to vaccines catalog",
                outcome: "Opens tab 3 (listing) to compare all services.",
                protoTab: 3,
                variant: "cta",
              },
            ],
          },
          {
            turn: 2,
            user: "Does the nearby Boots pharmacy have any available slots today?",
            assistantSummary:
              "SitePilot explains the Availability Checker Tool in three steps: open tool, choose pharmacy (location or near me), pick date then time.",
            assistantDetails: [
              "Inline link for Availability Checker Tool opens the Availability Tool at Find Pharmacy.",
            ],
            actions: [
              {
                label: "Open Availability Checker Tool",
                outcome: "Opens Availability Tool at Find Pharmacy step.",
                variant: "cta",
              },
              {
                label: "Check availability slot for me",
                outcome: "Highlights the matching user query bubble in the thread.",
                variant: "cta",
              },
            ],
          },
          {
            turn: 3,
            user: "Check availability slot for me in the nearby Boots pharmacy",
            assistantSummary:
              "SitePilot offers to check slots on Sarah's behalf and presents time window options.",
            actions: [
              {
                label: "Find available slots for today",
                outcome: "Chip in the composer prefills the query; the dedicated chip opens the Availability Tool on today's date.",
                variant: "cta",
              },
              {
                label: "Find available slots this week",
                outcome: "Opens Availability Tool on calendar (June 24).",
                variant: "cta",
              },
              {
                label: "Find available slots this weekend",
                outcome: "Opens Availability Tool on calendar (June 27).",
                variant: "cta",
              },
            ],
          },
          {
            turn: 4,
            user: "Find available slots for today",
            assistantSummary:
              "SitePilot returns 24 slots for June 25 at Covent Garden Long Acre (1.5km), with pharmacy detail and slot window 10:00 to 18:00.",
            assistantDetails: [
              "See on map is shown in the reply (design placeholder).",
            ],
            actions: [
              {
                label: "Choose Time Slot",
                outcome: "Opens Availability Tool at time selection (16:30 preset).",
                variant: "cta",
              },
              {
                label: "Choose Different Date",
                outcome: "Opens Availability Tool on alternate date (June 25 picker).",
                variant: "cta",
              },
              {
                label: "Select Different Pharmacy",
                outcome: "Opens Availability Tool location list for store change.",
                variant: "cta",
              },
            ],
          },
        ],
        composer: {
          placeholder: "Ask Boots SitePilot",
          nextDialogChips: [
            "Is it covered by NHS?",
            "Show available slots for today",
            "Elaborate on previous reply",
          ],
          chipBehavior:
            "Most chips prefill the composer. Show available slots for today also opens the Availability Tool on today's date when selected from the composer row.",
        },
        patterns: [
          {
            title: "Structured reply blocks",
            detail:
              "Each assistant turn uses headings (Recommended Bundle, Critical Timeline, Next Steps) so long clinical copy stays scannable.",
          },
          {
            title: "Inline catalogue links",
            detail:
              "Underlined product names route to PDP without breaking the conversation layout.",
          },
          {
            title: "Primary navy CTAs",
            detail:
              "Book and catalog actions use the same navy pill as transactional Boots UI for trust continuity.",
          },
          {
            title: "Tool handoff, not chat trap",
            detail:
              "Availability actions open the real Availability Tool overlay on the correct step rather than simulating slots only in chat.",
          },
        ],
      },
      screenLinks: [1, 2],
    },
    {
      id: "browse",
      title: "Browse: listing and product detail",
      paragraphs: [
        "Sarah's comparison path is on tab 3. Even when chat recommends a pack, she still needs to validate coverage, price, and trip fit before she commits.",
        "The listing is interactive in this prototype: filters narrow results, bundle cards use realistic UK travel clinic pack naming and disease level copy, and tile titles route to the same product detail page as Book now.",
      ],
      highlights: [
        "On tab 3, open Bundles and filter by South East Asia or Indonesia to match Sarah's trip.",
        "Cards explain which jabs are included, who the pack is for, and when to book, for example Indonesia and Bali Explorer Pack for island hopping.",
        "Active filters appear as removable chips; Reset Filters clears the set in one action.",
        "Tab 4 carries recipient choice, dosing, and book now into the shared funnel.",
      ],
      screenLinks: [3, 4],
    },
    {
      id: "book",
      title: "Book appointment",
      paragraphs: [
        "Pharmacy operations, slot logic, and confirmation copy stay consistent regardless of how Sarah arrived, whether from chat, the listing, or product detail.",
        "Three live steps keep summary context visible so she never loses track of vaccine, recipient, or store.",
      ],
      highlights: [
        "Availability Tool replaces a static store list with search, near me, and map.",
        "Progress column supports step back without breaking context.",
        "Recipient and vaccine pickers are editable from summary pills.",
      ],
      steps: [
        {
          title: "Location",
          detail:
            "Summary pills for vaccine and recipient, location search or near me, Availability Tool for store pick, then continue.",
          protoTab: 5,
        },
        {
          title: "Date and time",
          detail:
            "Calendar and slot selection on the chosen pharmacy. The progress column links back to location.",
          protoTab: 6,
        },
        {
          title: "Confirmation",
          detail: "Review selections before completing the booking.",
          protoTab: 7,
        },
      ],
      screenLinks: [5, 6, 7],
    },
    {
      id: "after",
      title: "After booking",
      paragraphs: [
        "The journey continues after confirmation. Appointment history and detail views show how Boots can support retention, rescheduling, and post visit follow up in the same account experience.",
      ],
      highlights: [
        "History gives a single place to manage upcoming and past visits.",
        "Detail view supports status, location, and next best action.",
        "Tabs 8 and 9 show post booking states.",
      ],
      screenLinks: [8, 9],
    },
  ] satisfies HubSection[],
};
