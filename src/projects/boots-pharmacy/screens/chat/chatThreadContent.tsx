/** Scripted Chat thread — Make ComponentAppointmentSummary2 parity (Sarah SE Asia). */

import React, { type ReactNode } from "react";

/** Bubble CTA — always UXDS ButtonPrimary commerce (Make navy primary). */
export type ChatAgentCta = {
  label: string;
};

export type ChatThreadFrame =
  | {
      id: string;
      kind: "query";
      text: string;
    }
  | {
      id: string;
      kind: "reply";
      body: ReactNode;
      ctas: ChatAgentCta[];
      helpful?: boolean;
      thoughtLabel?: string;
    };

function Link({ children }: { children: ReactNode }) {
  return <span className="chat__link">{children}</span>;
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="chat__strong">{children}</strong>;
}

export const CHAT_THREAD_FRAMES: readonly ChatThreadFrame[] = [
  {
    id: "q0",
    kind: "query",
    text: "I need a full course of travel vaccinations for a three-week trip to Southeast Asia (Indonesia) starting next month, specifically looking to book and buy jabs as a bundle if possible.",
  },
  {
    id: "r0",
    kind: "reply",
    helpful: true, // Make `Reply` → `ComponentGseSystemMessage`
    ctas: [
      { label: "Book Southeast Asia Vaccine Bundle – £245" },
      { label: "Book Yellow Fever Vaccine only – £75" },
      { label: "Go to vaccines catalog" },
    ],
    body: (
      <>
        <p className="chat__para">
          <Strong>
            Welcome to Boots Pharmacy!
            <br />
            Good news!{" "}
          </Strong>
          We have everything needed to recommend your protection plan for
          Indonesia (Summer 2026).
        </p>
        <p className="chat__para">
          <Strong>Recommended Bundle</Strong>.
          <br />
          You can buy and book your complete course:
          <br />
          <Link>Southeast Asia Vaccine Bundle</Link> – <Strong>£245</Strong>
          <br />
          Covers: Hepatitis A, Typhoid, Tetanus, Diphtheria, and Polio.
          <br />
          Suitability: Teens and adults (Ages 13–64).
        </p>
        <p className="chat__para">
          <Strong>
            Individual Jabs &amp; Legal Entry
            <br />
          </Strong>
          Separate options (price per dose):
          <br />
          <Link>Hepatitis A</Link> – <Strong>£95.98</Strong>
          <br />
          <Link>Typhoid</Link> – <Strong>£95.98</Strong>
          <br />
          <Link>Tetanus Booster</Link> – <Strong>£95.98.</Strong>
        </p>
        <p className="chat__para">
          Requirement:
          <br />
          <Link>Yellow Fever Vaccine</Link> is only legally mandatory if
          transiting from a high-risk zone.
          <br />
          Boots Account is required to book an appointment. You can sign in or
          create one during the process.
        </p>
        <p className="chat__para">
          <Strong>Critical Timeline</Strong>.
          <br />
          Today is June 25. Immunity takes up to 14 days to develop. Use our
          28-day window to book your appointment by <Strong>July 23</Strong>.
        </p>
        <p className="chat__para chat__para--tight">
          <Strong>Next Steps:</Strong>
        </p>
      </>
    ),
  },
  {
    id: "q1",
    kind: "query",
    text: "Does the nearby Boots pharmacy have any available slots today?",
  },
  {
    id: "r1",
    kind: "reply",
    ctas: [
      { label: "Open Availability Checker Tool" },
      { label: "Check availability slot for me" },
    ],
    body: (
      <>
        <p className="chat__para">
          You can use our <Link>Availability Checker Tool</Link> to quickly
          verify the availability for today.
        </p>
        <p className="chat__para">
          <Strong>Step 1</Strong>. Open the{" "}
          <Link>
            Availability Checker Tool
            <br />
          </Link>
          <Strong>Step 2</Strong>. Choose pharmacy, enter your desired location
          or use Find Nearby option.
          <br />
          <Strong>Step 3</Strong>. See available Date. Click desired date and
          you will see available time slots
        </p>
        <p className="chat__para chat__para--tight">
          <Strong>Next Steps:</Strong>
        </p>
      </>
    ),
  },
  {
    id: "q2",
    kind: "query",
    text: "Check availability slot for me in the nearby Boots pharmacy",
  },
  {
    id: "r2",
    kind: "reply",
    ctas: [
      { label: "Find available slots for today" },
      { label: "Find available slots this week" },
      { label: "Find available slots this weekend" },
    ],
    body: (
      <>
        <p className="chat__para">Sure! I can check available slots for you.</p>
        <p className="chat__para chat__para--tight">
          <Strong>Next Steps:</Strong>
        </p>
      </>
    ),
  },
  {
    id: "q3",
    kind: "query",
    text: "Find available slots for today",
  },
  {
    id: "r3",
    kind: "reply",
    helpful: true, // latest assistant bubble — PO restore target
    thoughtLabel: "Thought for 12 seconds",
    ctas: [
      { label: "Choose Time Slot" },
      { label: "Choose Different Date" },
      { label: "Select Different Pharmacy" },
    ],
    body: (
      <>
        <p className="chat__para">
          Good news! There are{" "}
          <Strong>24 available slots for June 25</Strong>, 2026 nearby y our
          location.
        </p>
        <p className="chat__para">
          <Strong>Pharmacy: </Strong>
          <strong className="chat__strong chat__strong--bold">
            Covent Garden Long Acre{" "}
          </strong>
          (426 StrandLondon, Greater London WC2R 0QE). 1.5km from you.{" "}
          <Link>
            See on map
            <br />
          </Link>
          <Strong>Available time slots:</Strong> 10:00 - 18:00 (each slot is 15
          minutes)
        </p>
        <p className="chat__para chat__para--tight">
          <Strong>Next Steps:</Strong>
        </p>
      </>
    ),
  },
];

export const CHAT_CHIP_LABELS = [
  "Is it covered by NHS?",
  "Show available slots for today",
  "Elaborate on previous reply",
] as const;

export type ChatChipLabel = (typeof CHAT_CHIP_LABELS)[number];

export const CHAT_SUGGESTED_LABEL = "Next dialog options:";
export const CHAT_SUGGESTED_LABEL_ID = "chat-next-dialog-label";

export function chatChipSlug(label: ChatChipLabel): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function chatChipActionId(label: ChatChipLabel): string {
  return `agentic-chat-chip-${chatChipSlug(label)}`;
}
