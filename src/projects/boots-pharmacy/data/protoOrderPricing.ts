export type OrderPricing = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

/** Single-dose vaccine price (PDP + order summary subtotal line). */
const SINGLE_DOSE = 75;
const BOOSTER_ADDON = 75;

/** Figma confirmation reference — discount/tax rates applied to merchandise total. */
const REF_MERCHANDISE_WITH_BOOSTER = SINGLE_DOSE + BOOSTER_ADDON;
const REF_DISCOUNT = 12.96;
const REF_TAX = 2.99;
const REF_NET = REF_MERCHANDISE_WITH_BOOSTER - REF_DISCOUNT;
const DISCOUNT_RATE = REF_DISCOUNT / REF_MERCHANDISE_WITH_BOOSTER;
const TAX_RATE = REF_TAX / REF_NET;

export const PDP_CHECKBOX_LABEL =
  "Include booking second dose at a future date + £75.00";

export const BOOSTER_DOSE_SUMMARY_LABEL = "Booster dose (Full Course)";

export const PDP_PRICE_WITH_BOOSTER = SINGLE_DOSE + BOOSTER_ADDON;
export const PDP_PRICE_WITHOUT_BOOSTER = SINGLE_DOSE;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeOrderPricing(includeBooster: boolean): OrderPricing {
  const subtotal = SINGLE_DOSE;
  const merchandise = SINGLE_DOSE + (includeBooster ? BOOSTER_ADDON : 0);
  const discount = round2(merchandise * DISCOUNT_RATE);
  const net = merchandise - discount;
  const tax = round2(net * TAX_RATE);
  const total = round2(net + tax);
  return { subtotal, discount, tax, total };
}

export function formatGbp(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function setCoProductPrice(
  row: HTMLElement | null,
  amount: number
): void {
  if (!row) return;
  const root = row.querySelector('[data-name="component.product.price"]');
  if (!root) return;
  const amountEl = root.querySelectorAll("p")[1];
  if (amountEl) amountEl.textContent = formatAmount(amount);
}

export function setCoTotalPrice(
  totalRow: HTMLElement | null,
  amount: number
): void {
  if (!totalRow) return;
  const root = totalRow.querySelector('[data-name="component.product.price"]');
  if (!root) return;
  const ps = root.querySelectorAll("p");
  if (ps.length >= 2) ps[1].textContent = formatAmount(amount);
}

function syncBoosterDoseRow(list: HTMLElement, included: boolean) {
  let row = list.querySelector<HTMLElement>('[data-proto-booster-line]');
  if (!row) {
    const template = list.querySelector<HTMLElement>('[data-name="Shipping"]');
    if (!template) return;
    row = template.cloneNode(true) as HTMLElement;
    row.dataset.protoBoosterLine = "true";
    row.removeAttribute("data-name");
    list.querySelector('[data-name="Order Discount"]')?.after(row);
  }

  const label = row.querySelector<HTMLElement>('[data-name="Wording"] p');
  if (label) label.textContent = BOOSTER_DOSE_SUMMARY_LABEL;

  const value =
    row.querySelector<HTMLElement>(
      ':scope > div:last-child p, [data-name="component.product.price"] p'
    ) ?? row.querySelector<HTMLElement>("p:last-child");
  if (value && value !== label) {
    value.textContent = included ? "Included (+ £75.00)" : "Not included";
  }
}

export function syncConfirmationOrderSummary(
  summaryRoot: HTMLElement,
  includeBooster: boolean
) {
  const pricing = computeOrderPricing(includeBooster);
  const list = summaryRoot.querySelector<HTMLElement>('[data-name="list"]');
  if (!list) return;

  setCoProductPrice(list.querySelector('[data-name="Subtotal"]'), pricing.subtotal);
  setCoProductPrice(
    list.querySelector('[data-name="Order Discount"]'),
    pricing.discount
  );
  setCoProductPrice(list.querySelector('[data-name="Sales Tax"]'), pricing.tax);
  setCoTotalPrice(summaryRoot.querySelector('[data-name="Total"]'), pricing.total);
  syncBoosterDoseRow(list, includeBooster);
}

export function syncAccountOrderSummary(
  block: HTMLElement,
  includeBooster: boolean
) {
  const pricing = computeOrderPricing(includeBooster);
  const setRow = (dataName: string, value: string) => {
    const row = block.querySelector<HTMLElement>(`[data-name="${dataName}"]`);
    const ps = row ? Array.from(row.querySelectorAll("p")) : [];
    const valueP = ps[ps.length - 1];
    if (valueP) valueP.textContent = value;
  };

  setRow("Subtotal", formatGbp(pricing.subtotal));
  setRow("Order Discount", formatGbp(pricing.discount));
  setRow("Sales Tax", formatGbp(pricing.tax));
  setRow("Total", formatGbp(pricing.total));

  let boosterRow = block.querySelector<HTMLElement>('[data-proto-booster-line]');
  if (!boosterRow) {
    const template = block.querySelector<HTMLElement>('[data-name="Shipping"]');
    if (!template) return;
    boosterRow = template.cloneNode(true) as HTMLElement;
    boosterRow.dataset.protoBoosterLine = "true";
    boosterRow.removeAttribute("data-name");
    block.querySelector('[data-name="Order Discount"]')?.after(boosterRow);
  }

  const ps = Array.from(boosterRow.querySelectorAll("p"));
  if (ps[0]) ps[0].textContent = BOOSTER_DOSE_SUMMARY_LABEL;
  if (ps[1]) {
    ps[1].textContent = includeBooster
      ? "Included (+ £75.00)"
      : "Not included";
  }
}

export function boosterDoseSummaryLabel(included: boolean): string {
  return included ? "Included" : "Not included";
}
