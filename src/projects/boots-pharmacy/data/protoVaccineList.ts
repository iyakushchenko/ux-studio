export type VaccineItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  booster?: string;
  /** Label shown on Book Appointment summary rows */
  bookLabel: string;
};

const FALLBACK_VACCINES: VaccineItem[] = [
  {
    id: "chickenpox",
    title: "Chickenpox",
    subtitle: "Varicella-zoster virus",
    description:
      "Chickenpox spreads easily and can cause fever, tiredness, and an itchy blister-like rash. It can be more serious in adults, pregnancy, and people with weaker immunity.",
    price: "£75.00",
    booster: "Booster dose available",
    bookLabel: "Chickenpox / Varicella",
  },
  {
    id: "covid-19",
    title: "COVID-19",
    subtitle: "SARS-CoV-2 virus",
    description:
      "COVID-19 can cause respiratory illness and serious complications in higher-risk groups. Vaccination helps reduce the risk of severe disease and hospitalisation.",
    price: "£99.00",
    booster: "Booster dose available",
    bookLabel: "COVID-19",
  },
  {
    id: "typhoid",
    title: "Typhoid",
    subtitle: "Salmonella Typhi",
    description:
      "Typhoid is usually spread through contaminated food or water. It can cause high fever, stomach symptoms, weakness, and serious complications if untreated.",
    price: "£35.00",
    booster: "Booster dose available",
    bookLabel: "Typhoid",
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Book-flow summary uses “Chickenpox / Varicella” for the default PDP vaccine. */
export function bookVaccineLabel(plpTitle: string): string {
  if (/^chickenpox$/i.test(plpTitle.trim())) return "Chickenpox / Varicella";
  return plpTitle.trim();
}

function readPrice(tile: HTMLElement): string {
  const priceRoot = tile.querySelector('[data-name="component.product.price"]');
  if (!priceRoot) return "";
  const text = (priceRoot.textContent ?? "").replace(/\s+/g, "");
  if (!text) return "";
  return text.startsWith("£") ? text : `£${text.replace(/^£/, "")}`;
}

/** Pull vaccine cards from PLP (child 9) — same content as the simple listing. */
export function readVaccinesFromPlp(): VaccineItem[] {
  const tiles = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.proto-viewport > div > div:nth-child(9) [data-name="boots-pharmacy.service.tile"]'
    )
  );
  if (!tiles.length) return FALLBACK_VACCINES;

  const items: VaccineItem[] = [];
  tiles.forEach((tile) => {
    const title =
      Array.from(tile.querySelectorAll("p")).find((p) =>
        /text-\[24px\]|leading-\[38px\]/.test(p.className)
      )?.textContent?.trim() ?? "";
    if (!title) return;

    const subtitle =
      Array.from(tile.querySelectorAll("p")).find((p) =>
        /text-\[#7a7d87\]/.test(p.className)
      )?.textContent?.trim() ?? "";

    const description =
      Array.from(tile.querySelectorAll("p"))
        .map((p) => (p.textContent ?? "").trim())
        .find((t) => t.length > 60) ?? "";

    const booster = Array.from(tile.querySelectorAll("p")).find((p) =>
      /booster dose available/i.test(p.textContent ?? "")
    )?.textContent?.trim();

    items.push({
      id: slugify(title),
      title,
      subtitle,
      description,
      price: readPrice(tile),
      booster,
      bookLabel: bookVaccineLabel(title),
    });
  });

  return items.length ? items : FALLBACK_VACCINES;
}
