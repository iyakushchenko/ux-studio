/**
 * NewCo homepage copy + IA — sourced from the live Figma file's own
 * variable defs (fileKey 63KkJOcSTcbK7pgcSlcmiP, node 12409:622533):
 * footer link labels, brand phone, and copyright are real design-system
 * tokens, not invented. Section body copy is a faithful paraphrase of the
 * screenshot where the design's own text wasn't exposed as a token.
 */

export const BRAND_PHONE = "1-866-422-4866";
export const BRAND_COPYRIGHT = "©2026 NewCo. All rights reserved.";

/** Account flyout — reuses the real footer link labels for the account-scoped items. */
export const ACCOUNT_MENU = [
  { label: "Check My Eligibility", icon: "eligibility" as const },
  { label: "Track Orders & Status", icon: "orders" as const },
  { label: "Pay My Bill / Online Payments", icon: "billing" as const },
  { label: "Sign Out", icon: "signout" as const },
];

export const HELP_CARDS = [
  {
    title: "Easy Refills",
    body: "Reorder your recurring supplies in a few taps — we track what you need and when.",
  },
  {
    title: "Simple, Transparent Billing",
    body: "See exactly what's covered and what you owe before we ship, with no surprise invoices.",
  },
  {
    title: "24/7 Care Management",
    body: "Speak with a real care specialist any time you have a question about your order or condition.",
  },
] as const;

export const PRODUCT_CATEGORIES = [
  "Diabetes Products",
  "Ostomy Care",
  "Urological Care",
  "Incontinence",
  "Wound Care",
  "Specialized Supplies",
] as const;

export const PRODUCTS_POINTS = [
  "Top-rated medical brands",
  "Seamless insurance coordination",
  "Fast, reliable home delivery",
] as const;

export const INSURANCE_POINTS = [
  "Major private plans covered",
  "Direct insurance billing",
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "My supplies always arrive right on time — I haven't had to think about reordering once since I switched.",
    name: "Linda C.",
    detail: "NewCo Customer",
  },
  {
    quote:
      "I was dreading dealing with insurance for this, but NewCo handled the whole thing and I just got a text when it shipped.",
    name: "Michele R.",
    detail: "NewCo Customer",
  },
] as const;

export const DAILY_CARE_POINTS = [
  "Trusted, high-quality supplies",
  "Clear, easy-to-follow instructions",
  "Personalized, 1-on-1 support",
] as const;

export const PARTNER_CARDS = [
  {
    title: "Providers",
    body: "Refer patients directly and track order status without leaving your workflow.",
  },
  {
    title: "Health Plans",
    body: "Integrate eligibility and claims data for a smoother member experience.",
  },
  {
    title: "Insurance Professionals",
    body: "Coordinate coverage verification and prior authorizations in real time.",
  },
  {
    title: "Pharmacy Professionals",
    body: "Partner with our fulfillment network for reliable, compliant delivery.",
  },
] as const;

/**
 * `image` keys map to real photos in `assets/` (Wikimedia Commons, verified
 * on-topic per article before download — not random stock like the rest of
 * the page's Picsum placeholders).
 */
export const ARTICLES = [
  {
    tag: "News · Product",
    title: "How our platform makes reordering supplies simple",
    date: "July 2026",
    excerpt: "A look at the refill engine behind every NewCo order.",
    image: "supplies",
  },
  {
    tag: "Insurance",
    title: "Explaining our network: what's covered and how",
    date: "June 2026",
    excerpt: "A plain-language breakdown of coverage and eligibility.",
    image: "insurance",
  },
  {
    tag: "Care Tips",
    title: "Everyday tips for managing your chronic condition",
    date: "June 2026",
    excerpt: "Small habits that make a big difference in daily care.",
    image: "caretips",
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    heading: "My Account & Portals",
    links: [
      "Patient Login",
      "Check My Eligibility",
      "Track Orders & Status",
      "Pay My Bill / Online Payments",
    ],
  },
  {
    heading: "Customer Support",
    links: [
      "Contact Us",
      "Help Center",
      "Medication Disposal",
      "Warranty & Return Policy",
      "Check Insurance Eligibility",
    ],
  },
  {
    // Reconciled with the site IA JSON's "About Us" (id 5) — the older
    // Figma footer tokens had a different, narrower About Us set (Why
    // NewCo, Careers, Accreditations, Partner With Us); the IA export is
    // the more complete, more recently supplied real source, and real
    // sites keep footer/nav About Us consistent.
    heading: "About Us",
    links: ["About NewCo", "Why Choose NewCo", "What We Do", "Contact Us", "Accreditations", "News"],
  },
  {
    heading: "Legal & Compliance",
    links: [
      "Privacy Policy",
      "Terms and Conditions",
      "Notice of Privacy Practices",
      "Complaint & Resolution Form",
      "HIPAA Notice",
    ],
  },
] as const;

export const NAV_LINKS = [
  "Products",
  "Digital Care",
  "Resources",
  "Healthcare & Insurance",
  "About Us",
] as const;

/**
 * Mega menu content — 2-level flyout matching the real Figma component
 * (fileKey 63KkJOcSTcbK7pgcSlcmiP, node 34392:186520,
 * component.header.mega.menu.flyout.custom) for structure, and the real
 * site IA export (newco_ia-json-07-24-2026-4_24-jul-2026.json, "Main v3",
 * 2026-07-24T08:26:17Z) for every category/sub-link label — not made up.
 * "About Us" is genuinely flat in the source IA (no 3rd level), so it
 * renders as a single link column instead of the 2-level pattern; a
 * category with zero children in the source (Resources > Welcome Guides)
 * renders an empty sub-link column when active, honestly, rather than
 * inventing filler. Promo card copy (title/cta) has no IA equivalent and
 * stays made up, using the real hero photo.
 */
export type MegaMenuCategory = { label: string; subLinks: string[] };
export type MegaMenuContent = {
  categories: MegaMenuCategory[];
  promo: { title: string; cta: string };
};

export const MEGA_MENU: Record<(typeof NAV_LINKS)[number], MegaMenuContent> = {
  Products: {
    categories: [
      {
        label: "Diabetes Products",
        subLinks: [
          "Continuous Glucose Monitors",
          "Insulin Pumps and Supplies",
          "Diabetes Testing Supplies",
          "Blood Glucose Meters",
          "Smart Insulin Pens",
        ],
      },
      {
        label: "Ostomy Care",
        subLinks: [
          "Pouches and Barriers",
          "Skin Barrier Accessories",
          "Pastes, Powders and Cements",
          "Belts and Binders",
          "Irrigation Sleeves and Cones",
          "Deodorants",
        ],
      },
      {
        label: "Urological Care",
        subLinks: [
          "Intermittent Catheters",
          "Foley Catheters",
          "External Catheters",
          "Leg Bags and Leg Straps",
          "Drainage Bags and Collection Pouches",
          "Irrigation Trays and Syringes",
        ],
      },
      {
        label: "Incontinence Support",
        subLinks: [
          "Briefs, Pads, Shields and Undergarments",
          "Protective Underwear",
          "Underpads and Mattress Protectors",
        ],
      },
      {
        label: "Wound Care",
        subLinks: [
          "Alginates, Hydrofibers and Super-Absorbers",
          "Hydrocolloids",
          "Gauze, Non-Impregnated",
          "Gauze Rolls and Elastic Bandages",
          "Foams",
          "Compression Stockings and Wraps",
        ],
      },
      {
        label: "Specialized Supplies",
        subLinks: ["Skin Care", "Breast Pumps", "Clinical Syringes and Trays", "Isolation and Infectious Control"],
      },
    ],
    promo: { title: "New Arrivals", cta: "Explore now" },
  },
  "Digital Care": {
    categories: [
      {
        label: "Getting Started",
        subLinks: ["New Patient Registration", "How Ordering Works", "Transfer a Prescription"],
      },
      {
        label: "Insurance & Coverage",
        subLinks: ["Insurance Plans We Serve", "Check My Eligibility", "Coverage & Cost Guides"],
      },
      {
        label: "Features",
        subLinks: ["Automated Refills & Tracking", "Self-Manage Your Care", "Caregiver Proxy Access"],
      },
    ],
    promo: { title: "Care in Your Pocket", cta: "Discover the NewCo" },
  },
  Resources: {
    categories: [
      {
        label: "Newly Diagnosed Guides",
        subLinks: [
          "Living With Diabetes",
          "Ostomy Care Basics",
          "Urological Care & Catheter Support",
          "Incontinence Management",
          "Wound Healing Stages",
        ],
      },
      {
        label: "Device Training & Support",
        subLinks: ["CGM & Insulin Pump User Manuals", "Video Tutorials & Onboarding", "Troubleshooting Device Errors"],
      },
      {
        label: "Welcome Guides",
        subLinks: [],
      },
    ],
    promo: { title: "New: Condition Library", cta: "Start Reading" },
  },
  "Healthcare & Insurance": {
    categories: [
      {
        label: "Healthcare Professionals",
        subLinks: [
          "Refer A Patient",
          "How To Prescribe",
          "Medicare and Payer Plans",
          "HCP Resources",
          "Find Your Representative",
        ],
      },
      {
        label: "Insurance Professionals",
        subLinks: ["Agent Support Program", "Become A Contracted Payer", "Plans We Serve"],
      },
      {
        label: "Pharmacy Professionals",
        subLinks: ["Pharmacy Support Program", "How We Help"],
      },
    ],
    promo: { title: "Verify Your Coverage", cta: "Verify Coverage" },
  },
  "About Us": {
    categories: [
      { label: "About NewCo", subLinks: [] },
      { label: "Why Choose NewCo", subLinks: [] },
      { label: "What We Do", subLinks: [] },
      { label: "Contact Us", subLinks: [] },
      { label: "Accreditations", subLinks: [] },
      { label: "News", subLinks: [] },
    ],
    promo: { title: "Join Our Team", cta: "View Careers" },
  },
};
