/** Studio / CJM contract for PDP React migration. */

export const PDP_CHILD_INDEX = 8;

export const PDP_REACT_SCREEN_ID = "pdp";

export const PDP_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${PDP_CHILD_INDEX})`;

/** L16 — Make Frame106 intro copy (864px band). */
export const PDP_INTRO_PARAGRAPHS = [
  "Chickenpox is a common viral infection caused by the varicella-zoster virus. It spreads easily through coughing, sneezing and direct contact, and can cause fever, tiredness and an itchy blister-like rash.",
  "The Boots Chickenpox Vaccination Service is a private service for eligible adults and children aged one to 65. A full course is two doses, with suitability checked by a healthcare professional before vaccination.",
] as const;

/**
 * Make RTB service blurb (Frame PDP body) — also used as FAQ “How can Boots help?”
 * body (Make accordion Description missing for that panel; RTB is same-page Make copy).
 */
export const PDP_SERVICE_BLURB =
  "Our private Chickenpox Vaccination Service is suitable for adults and children aged between one and 65 years. A full course consists of two doses given 4 to 6 weeks apart. Eligibility criteria apply and suitability will be checked before each vaccination is given.";

/** Make appointment strip copy (Frame). */
export const PDP_APPOINTMENT_STRIP =
  "Typical appointment takes around 15 minutes";

/** L18 — Make laptop specs table rows. */
export const PDP_SPECS_ROWS = [
  { label: "Vaccine", value: "Varicella-zoster virus vaccine" },
  { label: "Course", value: "Two doses, usually 4 to 6 weeks apart" },
  {
    label: "Administration",
    value:
      "Given in the upper arm or thigh by a trained healthcare professional",
  },
  {
    label: "Eligibility",
    value: "Adults and children aged 1 to 65, subject to suitability checks",
  },
  {
    label: "Price",
    value: "£98.95 per dose, £190.00 for the full two-dose course",
  },
  {
    label: "Availability",
    value: "Private service available at selected Boots pharmacies",
  },
] as const;

/**
 * L19 — FAQ accordion (PO go: interactive UXDS Accordion kit).
 *
 * Make `ComponentPdpAccordion` only ships a `Description` node for “Who is at risk?”.
 * Other bodies reuse same-page Make strings where they answer the header, or
 * Bea-sourced Boots-plausible copy when Make has header-only residuals (PO ask).
 *
 * Default open matches Make static frame.
 */
export const PDP_ACCORDION_DEFAULT_OPEN = ["who-is-at-risk"] as const;

const PDP_SPECS_ADMINISTRATION =
  PDP_SPECS_ROWS.find((r) => r.label === "Administration")?.value ?? "";

export const PDP_ACCORDION_PANELS = [
  {
    id: "how-can-boots-help",
    title: "How can Boots help?",
    /** Make RTB service blurb + booking cue (accordion Description absent in export). */
    body: `${PDP_SERVICE_BLURB} You can book online and choose a convenient Boots pharmacy for your appointment. Your healthcare professional will confirm suitability before each dose.`,
    source: "make+bea" as const,
  },
  {
    id: "who-is-at-risk",
    title: "Who is at risk?",
    /** Make `Description` under ComponentPdpAccordion + brief context. */
    body: "Chickenpox can affect any age, but complications are more likely in adults, pregnant women, newborn babies and people with a weakened immune system. Vaccination can help reduce the risk of infection and severe illness for eligible people who have not had chickenpox. A healthcare professional will advise whether this service is right for you or the person you are booking for.",
    source: "make+bea" as const,
  },
  {
    id: "what-happens-at-appointment",
    title: "What happens at the appointment?",
    /** Make appt strip + specs Administration + visit flow (no dedicated Description). */
    body: `${PDP_APPOINTMENT_STRIP}. ${PDP_SPECS_ADMINISTRATION}. Before vaccination, a Boots healthcare professional will ask about your medical history and check suitability. After the dose you may be asked to wait briefly so they can make sure you feel well before you leave.`,
    source: "make+bea" as const,
  },
  {
    id: "nhs-vaccination",
    title: "Can I get vaccinated on the NHS?",
    /**
     * Bea-sourced — Make header only; Boots-plausible private-vs-NHS framing.
     * No invented NHS entitlement claims beyond routine programme contrast.
     */
    body: "Chickenpox vaccination is not routinely offered on the NHS to healthy children or adults. NHS provision focuses on people at higher risk of complications under national guidance. Our private Boots Chickenpox Vaccination Service is available for eligible customers aged 1 to 65 who want protection outside that programme. A healthcare professional will confirm suitability before any dose is given.",
    source: "bea" as const,
  },
  {
    id: "already-have-chickenpox",
    title: "What if I already have chickenpox?",
    /** Bea-sourced — Make header only. */
    body: "If you have already had chickenpox, you will usually have natural immunity and may not need vaccination. Some people are unsure whether they have had it before, or only remember a mild illness. Our healthcare professional can discuss your history and advise whether vaccination is still appropriate. Do not attend for vaccination if you currently have chickenpox symptoms — wait until you have fully recovered and seek advice if you are unsure.",
    source: "bea" as const,
  },
  {
    id: "personal-data",
    title: "How we use your personal data",
    /** Bea-sourced — Make header only; privacy tone aligned with Boots services. */
    body: "When you book or receive a vaccination service with Boots, we collect personal and health information needed to provide care safely and meet our professional and legal duties. We use this information to check eligibility, deliver your appointment, keep clinical records, and contact you about your booking where needed. We handle your data in line with UK data protection law and Boots privacy notices. You can ask about your rights and how to access or update your information through the privacy details available on boots.com.",
    source: "bea" as const,
  },
] as const;
