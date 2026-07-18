export type FooterNavScreen = "plp";

export type FooterColumnLink =
  | string
  | { label: string; screen: FooterNavScreen };

export function footerLinkLabel(link: FooterColumnLink): string {
  return typeof link === "string" ? link : link.label;
}

export function footerLinkScreen(
  link: FooterColumnLink,
): FooterNavScreen | undefined {
  return typeof link === "string" ? undefined : link.screen;
}

export const FOOTER_UTILITY_LINKS = [
  "FAQs",
  "Delivery",
  "Returns",
  "Contact Us",
  "Privacy Policy",
] as const;

export const FOOTER_LINK_COLUMNS = [
  {
    title: "Health Services",
    links: [
      { label: "Vaccination", screen: "plp" },
      "NHS Stop Smoking Service",
      "Practice Plus",
      "Physiotherapist Online",
      "Online GP Appointment",
    ],
  },
  {
    title: "Acne & Skin",
    links: ["Skin Scanning", "Mole Scanning", "Help with problem skin"],
  },
  {
    title: "Patient services",
    links: [
      "FAQs",
      "Contact us",
      "Pick up and delivery",
      "Off-label medicines",
      "Store locator",
    ],
  },
  {
    title: "About us",
    links: [
      "Careers",
      "Meet the team",
      "Patient guide",
      "Terms and conditions",
      "Privacy policy",
    ],
  },
] as const;

export const FOOTER_PHARMACY_SERVICES_URL =
  "https://www.boots.com/boots-pharmacy-frequently-asked-questions-faqs";

export const FOOTER_COPYRIGHT_LINES = [
  "Copyright © The Boots Company PLC. All rights reserved. Boots.com is a trading name of Boots UK Limited.",
  "Registered office: Nottingham NG2 3AA.Registered in England: company number 928555. Registered VAT number 116300129.",
] as const;
