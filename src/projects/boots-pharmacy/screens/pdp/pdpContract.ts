/** Studio / CJM contract for PDP React migration. */
export const PDP_CHILD_INDEX = 8;
export const PDP_REACT_SCREEN_ID = "pdp";
export const PDP_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${PDP_CHILD_INDEX})`;

/** L16 — Make Frame106 intro copy (864px band). */
export const PDP_INTRO_PARAGRAPHS = [
  "Chickenpox is a common viral infection caused by the varicella-zoster virus. It spreads easily through coughing, sneezing and direct contact, and can cause fever, tiredness and an itchy blister-like rash.",
  "The Boots Chickenpox Vaccination Service is a private service for eligible adults and children aged one to 65. A full course is two doses, with suitability checked by a healthcare professional before vaccination.",
] as const;

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
 * L19 — Static Make accordion (B1). No expand/collapse until PO says interactive.
 * Only “Who is at risk?” ships with body visible + up chevron.
 */
export const PDP_ACCORDION_PANELS = [
  { title: "How can Boots help?", expanded: false, body: null },
  {
    title: "Who is at risk?",
    expanded: true,
    body: "Chickenpox can affect any age, but complications are more likely in adults, pregnant women, newborn babies and people with a weakened immune system.",
  },
  { title: "What happens at the appointment?", expanded: false, body: null },
  { title: "Can I get vaccinated on the NHS?", expanded: false, body: null },
  { title: "What if I already have chickenpox?", expanded: false, body: null },
  { title: "How we use your personal data", expanded: false, body: null },
] as const;
