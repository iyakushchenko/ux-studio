import {
  computeOrderPricing,
  formatGbp,
  syncAccountOrderSummary,
  type OrderPricing,
} from "./orderPricing";

export type Appointment = {
  id: string;
  status: string;
  bookedAt: string;
  vaccine: string;
  recipient: string;
  email: string;
  phone: string;
  location: string;
  appointmentDate: string;
  total: number;
  cancellationReason?: string;
  /** Refund follow-up row shown under status on cancelled appointments. */
  refundPendingNote?: {
    prefix: string;
    linkLabel: string;
  };
  /** Chickenpox PDP pricing model */
  includeBooster?: boolean;
  /** Fixed summary when not using PDP pricing */
  pricing?: OrderPricing;
};

/** Sarah's demo appointment history — tab 8 list, tab 9 detail. */
export const APPOINTMENTS: Appointment[] = [
  {
    id: "1411527",
    status: "Appointment confirmed",
    bookedAt: "Monday, 9th June 2026, 11:42:18 BST",
    vaccine: "Chickenpox / Varicella",
    recipient: "Sarah Jenkins (you)",
    email: "sarah.jenkins@boots.com",
    phone: "07712 456 789",
    location: "107-115 Long Acre, WC2E 9NT, London, United Kingdom",
    appointmentDate: "Thursday, 26th June 2026, 10:30",
    total: computeOrderPricing(false).total,
    includeBooster: false,
  },
  {
    id: "1090595",
    status: "Completed",
    bookedAt: "Friday, 16th May 2026, 09:15:33 BST",
    vaccine: "Southeast Asia Travel Bundle",
    recipient: "Sarah Jenkins (you)",
    email: "sarah.jenkins@boots.com",
    phone: "07712 456 789",
    location: "426 Strand, London, Greater London WC2R 0QE",
    appointmentDate: "Monday, 2nd June 2026, 14:00",
    total: 189.0,
    pricing: {
      subtotal: 165.0,
      discount: 14.3,
      tax: 3.1,
      total: 189.0,
    },
  },
  {
    id: "990587",
    status: "Appointment confirmed",
    bookedAt: "Wednesday, 28th May 2026, 16:08:51 BST",
    vaccine: "Hepatitis A",
    recipient: "Sarah Jenkins (you)",
    email: "sarah.jenkins@boots.com",
    phone: "07712 456 789",
    location: "44–50 Regent Street, W1B 5RA, London, United Kingdom",
    appointmentDate: "Friday, 4th July 2026, 11:15",
    total: 65.0,
    pricing: {
      subtotal: 60.0,
      discount: 5.2,
      tax: 1.2,
      total: 65.0,
    },
  },
  {
    id: "8762341",
    status: "Cancelled",
    bookedAt: "Tuesday, 20th May 2026, 13:05:12 BST",
    vaccine: "Yellow Fever",
    recipient: "Sarah Jenkins (you)",
    email: "sarah.jenkins@boots.com",
    phone: "07712 456 789",
    location: "385 Oxford Street, W1C 2JS, London, United Kingdom",
    appointmentDate: "Saturday, 14th June 2026, 09:45",
    total: 72.0,
    pricing: {
      subtotal: 68.0,
      discount: 4.8,
      tax: 1.2,
      total: 72.0,
    },
    cancellationReason: "Booked location is temporarily closed",
    refundPendingNote: {
      prefix: "Refund Pending - ",
      linkLabel: "Discuss with Site Pilot",
    },
  },
];

export const APPOINTMENT_COUNT = APPOINTMENTS.length;

/** Prefill for Site Pilot when Sarah can't find an appointment in the list. */
export const APPOINTMENT_PILOT_QUERY =
  "I can't see my vaccination appointment in my Appointment History list. Please help me find it — I need to confirm my travel vaccinations and proceed as soon as possible.";

/** Prefill when Sarah follows up on a cancelled appointment with a pending refund. */
export function getAppointmentRefundPilotQuery(appt: Appointment): string {
  const reason = appt.cancellationReason
    ? ` The cancellation reason was: ${appt.cancellationReason}.`
    : "";
  return `My appointment #${appt.id} for ${appt.vaccine} was cancelled.${reason} A refund is pending — please help me understand the refund status and next steps.`;
}

let selectedAppointmentId = APPOINTMENTS[0]?.id ?? "";

export function getSelectedAppointmentId(): string {
  return selectedAppointmentId;
}

export function setSelectedAppointmentId(id: string): void {
  if (APPOINTMENTS.some((a) => a.id === id)) {
    selectedAppointmentId = id;
  }
}

export function getAppointment(id: string): Appointment | undefined {
  return APPOINTMENTS.find((a) => a.id === id);
}

function isTerminalAppointmentStatus(status: string): boolean {
  return /completed|cancelled|canceled|no[- ]?show|missed|attended/i.test(status);
}

type AppointmentStatusTone = "completed" | "active" | "cancelled";

function getAppointmentStatusTone(status: string): AppointmentStatusTone {
  if (/cancelled|canceled/i.test(status)) return "cancelled";
  if (/completed|attended/i.test(status)) return "completed";
  return "active";
}

function setStatusValue(card: HTMLElement, status: string): void {
  const row = findRow(card, "status");
  if (!row) return;
  const valueP = row.querySelectorAll("p")[1] as HTMLElement | undefined;
  if (!valueP) return;

  valueP.textContent = status;
  valueP.classList.remove(
    "proto-appointment-status--completed",
    "proto-appointment-status--active",
    "proto-appointment-status--cancelled"
  );
  valueP.classList.add(
    `proto-appointment-status--${getAppointmentStatusTone(status)}`
  );
}

const ICON_TEXT_BTN_CLASS =
  "content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[12px] py-[8px] relative rounded-[360px] shrink-0";

const ICON_TEXT_LABEL_WRAP_CLASS =
  "[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-end leading-[0] relative shrink-0 text-[#5c5c5c] text-[12px] text-center tracking-[-0.36px] whitespace-nowrap";

function findCtaButton(ctas: HTMLElement, label: RegExp): HTMLElement | null {
  return (
    Array.from(
      ctas.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) =>
      label.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
    ) ?? null
  );
}

function findAppointmentEditBtn(ctas: HTMLElement): HTMLElement | null {
  return (
    ctas.querySelector<HTMLElement>('[data-studio-appointment-edit="true"]') ??
    findCtaButton(ctas, /^edit(\s+appointment)?$/i)
  );
}

function findAppointmentCancelBtn(ctas: HTMLElement): HTMLElement | null {
  return (
    ctas.querySelector<HTMLElement>('[data-studio-appointment-cancel="true"]') ??
    findCtaButton(ctas, /^cancel(\s+appointment)?$/i)
  );
}

function hideAppointmentEditCancelBtns(ctas: HTMLElement): void {
  ctas.querySelectorAll<HTMLElement>('[data-name="component.input.button"]').forEach((btn) => {
    const text = (btn.textContent ?? "").replace(/\s+/g, " ").trim();
    if (
      btn.dataset.studioAppointmentEdit === "true" ||
      btn.dataset.studioAppointmentCancel === "true" ||
      /^edit(\s+appointment)?$/i.test(text) ||
      /^cancel(\s+appointment)?$/i.test(text)
    ) {
      btn.style.display = "none";
    }
  });
}

function cloneEditIcon(): HTMLElement {
  const src = document.querySelector<HTMLElement>(
    '.studio-viewport [data-name="icon=edit"]'
  );
  if (src) return src.cloneNode(true) as HTMLElement;
  const wrap = document.createElement("div");
  wrap.className = "relative shrink-0 size-[16px]";
  wrap.dataset.name = "icon=edit";
  wrap.innerHTML =
    '<svg class="absolute block inset-0 size-full" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill="#AFCCCA" d="M11.3 1.7a1.5 1.5 0 012.1 2.1L5.2 12 2 13l1-3.2L11.3 1.7z"/></svg>';
  return wrap;
}

function createCancelIcon(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "relative shrink-0 size-[16px]";
  wrap.dataset.name = "icon=cancel";
  wrap.innerHTML =
    '<svg class="absolute block inset-0 size-full" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path stroke="#AFCCCA" stroke-width="1.5" stroke-linecap="round" d="M4 4l8 8M12 4l-8 8"/></svg>';
  return wrap;
}

function buildIconTextLabel(text: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = ICON_TEXT_LABEL_WRAP_CLASS;
  const p = document.createElement("p");
  p.className = "leading-[16px]";
  p.textContent = text;
  wrap.appendChild(p);
  return wrap;
}

function convertToIconTextBtn(
  btn: HTMLElement,
  kind: "edit" | "cancel",
  label: string
): void {
  btn.dataset.studioAppointmentIconText = "true";
  delete btn.dataset.studioAppointmentCancel;
  delete btn.dataset.studioAppointmentEdit;
  if (kind === "cancel") {
    btn.dataset.studioAppointmentCancel = "true";
  } else {
    btn.dataset.studioAppointmentEdit = "true";
  }
  btn.setAttribute("data-name", "component.input.button");
  btn.className = ICON_TEXT_BTN_CLASS;
  btn.style.removeProperty("min-width");
  btn.querySelectorAll("[aria-hidden]").forEach((el) => el.remove());
  btn.replaceChildren(
    kind === "edit" ? cloneEditIcon() : createCancelIcon(),
    buildIconTextLabel(label)
  );
}

function ensureViewDetailsBtn(ctas: HTMLElement): HTMLButtonElement {
  let btn = ctas.querySelector<HTMLButtonElement>(
    '[data-studio-appointment-view-details="true"]'
  );
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.studioAppointmentViewDetails = "true";
    btn.className = "proto-avail-btn-primary proto-avail-btn-primary--sm";
    btn.textContent = "View Details";
  }
  ctas.insertBefore(btn, ctas.firstChild);
  return btn;
}

function wireViewDetailsBtn(
  viewBtn: HTMLButtonElement,
  appt: Appointment,
  onOpenDetails: () => void
): () => void {
  viewBtn.className = "proto-avail-btn-primary proto-avail-btn-primary--sm";
  viewBtn.textContent = "View Details";
  viewBtn.style.display = "";

  const open = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAppointmentId(appt.id);
    onOpenDetails();
  };
  viewBtn.addEventListener("click", open);
  return () => viewBtn.removeEventListener("click", open);
}

function syncAppointmentCardCtas(
  card: HTMLElement,
  appt: Appointment,
  opts: { onOpenDetails: () => void; isDetailsPage?: boolean }
): () => void {
  const ctas = card.querySelector<HTMLElement>('[data-name="CTAs"]');
  if (!ctas) return () => {};

  const terminal = isTerminalAppointmentStatus(appt.status);
  const editBtn = findAppointmentEditBtn(ctas);
  const cancelBtn = findAppointmentCancelBtn(ctas);
  const viewBtn = ensureViewDetailsBtn(ctas);
  const cleanups: Array<() => void> = [];

  const hide = (el: HTMLElement | null) => {
    if (el) el.style.display = "none";
  };
  const show = (el: HTMLElement | null) => {
    if (el) el.style.display = "";
  };

  if (opts.isDetailsPage) {
    hide(viewBtn);
    if (terminal) {
      hideAppointmentEditCancelBtns(ctas);
      ctas.style.display = "none";
    } else {
      ctas.style.display = "";
      if (editBtn) {
        show(editBtn);
        convertToIconTextBtn(editBtn, "edit", "Edit");
      }
      if (cancelBtn) {
        show(cancelBtn);
        convertToIconTextBtn(cancelBtn, "cancel", "Cancel");
      }
    }
    return () => {
      ctas.style.display = "";
      cleanups.forEach((fn) => fn());
    };
  }

  ctas.style.display = "";
  cleanups.push(wireViewDetailsBtn(viewBtn, appt, opts.onOpenDetails));

  if (terminal) {
    hideAppointmentEditCancelBtns(ctas);
  } else {
    if (editBtn) {
      show(editBtn);
      convertToIconTextBtn(editBtn, "edit", "Edit");
    }
    if (cancelBtn) {
      show(cancelBtn);
      convertToIconTextBtn(cancelBtn, "cancel", "Cancel");
    }
  }

  return () => cleanups.forEach((fn) => fn());
}

function findRow(card: HTMLElement, labelPrefix: string): HTMLElement | null {
  return (
    Array.from(card.querySelectorAll<HTMLElement>('[data-name="row"]')).find(
      (row) => {
        const label = row.querySelector("p")?.textContent?.trim() ?? "";
        return label.toLowerCase().startsWith(labelPrefix.toLowerCase());
      }
    ) ?? null
  );
}

function setRowValue(card: HTMLElement, labelPrefix: string, value: string): void {
  const row = findRow(card, labelPrefix);
  if (!row) return;
  const valueP = row.querySelectorAll("p")[1] as HTMLElement | undefined;
  if (valueP) valueP.textContent = value;
}

function setCardTotal(card: HTMLElement, amount: number): void {
  const priceRoot = card.querySelector('[data-name="component.product.price"]');
  if (!priceRoot) return;
  const amountP = priceRoot.querySelectorAll("p")[1];
  if (amountP) amountP.textContent = amount.toFixed(2);
}

function getRowsContainer(card: HTMLElement): HTMLElement | null {
  const statusRow = findRow(card, "status");
  return statusRow?.parentElement ?? null;
}

function syncOptionalDetailRow(
  card: HTMLElement,
  opts: {
    dataAttr: string;
    label: string;
    value?: string;
    insertAfter: HTMLElement | null;
    hideLabel?: boolean;
    valueClass?: string;
  }
): HTMLElement | null {
  const container = getRowsContainer(card);
  if (!container) return null;

  const selector = `[${opts.dataAttr}]`;
  let row = container.querySelector<HTMLElement>(selector);

  if (!opts.value) {
    row?.remove();
    return null;
  }

  if (!row) {
    const template =
      opts.insertAfter ??
      findRow(card, "status") ??
      container.querySelector<HTMLElement>('[data-name="row"]');
    if (!template) return null;
    row = template.cloneNode(true) as HTMLElement;
    row.setAttribute(opts.dataAttr, "true");
    const label = row.querySelector("p");
    if (label) {
      if (opts.hideLabel) {
        label.textContent = "";
        label.setAttribute("aria-hidden", "true");
      } else {
        label.textContent = opts.label;
      }
    }
  }

  if (opts.insertAfter) opts.insertAfter.after(row);

  const valueP = row.querySelectorAll("p")[1] as HTMLElement | undefined;
  if (valueP) {
    valueP.textContent = opts.value;
    valueP.classList.remove(
      "proto-appointment-status--completed",
      "proto-appointment-status--active",
      "proto-appointment-status--cancelled"
    );
    if (opts.valueClass) valueP.classList.add(opts.valueClass);
  }

  return row;
}

function syncRefundPendingNoteRow(
  card: HTMLElement,
  appt: Appointment,
  onDiscussSitePilot?: () => void
): () => void {
  const container = getRowsContainer(card);
  const statusRow = findRow(card, "status");
  if (!container || !statusRow) return () => {};

  let row = container.querySelector<HTMLElement>("[data-studio-refund-pending-row]");
  const note = appt.refundPendingNote;

  if (!note) {
    row?.remove();
    return () => {};
  }

  if (!row) {
    row = statusRow.cloneNode(true) as HTMLElement;
    row.setAttribute("data-studio-refund-pending-row", "true");
    const label = row.querySelector("p");
    if (label) {
      label.textContent = "";
      label.setAttribute("aria-hidden", "true");
    }
  }

  statusRow.after(row);

  const valueP = row.querySelectorAll("p")[1] as HTMLElement | undefined;
  if (!valueP) return () => {};

  valueP.classList.remove(
    "proto-appointment-status--completed",
    "proto-appointment-status--active",
    "proto-appointment-status--cancelled"
  );
  valueP.replaceChildren();

  const prefix = document.createElement("span");
  prefix.className = "proto-appointment-status--cancelled";
  prefix.textContent = note.prefix;

  const link = document.createElement("span");
  link.className = "proto-link proto-appointment-refund-pilot-link";
  link.textContent = note.linkLabel;
  link.setAttribute("role", "link");
  link.tabIndex = 0;

  valueP.append(prefix, link);

  if (!onDiscussSitePilot) return () => {};

  const open = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    onDiscussSitePilot();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    open(e);
  };

  link.addEventListener("click", open);
  link.addEventListener("keydown", onKey);

  return () => {
    link.removeEventListener("click", open);
    link.removeEventListener("keydown", onKey);
  };
}

function syncCancellationReasonRow(card: HTMLElement, appt: Appointment): void {
  const refundRow = card.querySelector<HTMLElement>("[data-studio-refund-pending-row]");
  const statusRow = findRow(card, "status");
  const insertAfter = refundRow ?? statusRow;

  syncOptionalDetailRow(card, {
    dataAttr: "data-studio-cancellation-reason-row",
    label: "Cancellation reason",
    value: appt.cancellationReason,
    insertAfter,
    valueClass: "proto-appointment-status--cancelled",
  });
}

function ensureHistoryCardCount(page: HTMLElement): () => void {
  const cards = Array.from(
    page.querySelectorAll<HTMLElement>(
      '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
    )
  );
  if (cards.length === 0) return () => {};

  const list = cards[0].parentElement;
  if (!list) return () => {};

  const needed = APPOINTMENTS.length;
  const template = cards[cards.length - 1];
  const loadMore = list.querySelector('[data-name="b2b.component.gse.load.more"]');

  while (
    list.querySelectorAll(
      '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
    ).length < needed
  ) {
    const clone = template.cloneNode(true) as HTMLElement;
    clone.dataset.studioAppointmentCardClone = "true";
    if (loadMore) list.insertBefore(clone, loadMore);
    else list.appendChild(clone);
  }

  return () => {
    list
      .querySelectorAll<HTMLElement>('[data-studio-appointment-card-clone="true"]')
      .forEach((el) => el.remove());
  };
}

function applyAppointmentToCard(
  card: HTMLElement,
  appt: Appointment,
  handlers?: { onDiscussRefundSitePilot?: () => void }
): () => void {
  setRowValue(card, "appointment number", appt.id);
  setRowValue(card, "order number", appt.id);
  setStatusValue(card, appt.status);
  setRowValue(card, "booked", appt.bookedAt);
  setRowValue(card, "placed", appt.bookedAt);
  setRowValue(card, "vaccine", appt.vaccine);
  setRowValue(card, "recipient", appt.recipient);
  setRowValue(card, "email", appt.email);
  setRowValue(card, "phone", appt.phone);
  setRowValue(card, "location", appt.location);
  setRowValue(card, "appointment date", appt.appointmentDate);
  setCardTotal(card, appt.total);
  const refundCleanup = syncRefundPendingNoteRow(
    card,
    appt,
    handlers?.onDiscussRefundSitePilot
  );
  syncCancellationReasonRow(card, appt);
  return refundCleanup;
}

function styleAppointmentTitleLink(titleEl: HTMLElement): void {
  titleEl.classList.add("proto-link", "proto-appointment-title-link");
  titleEl.style.cursor = "pointer";
  titleEl.style.userSelect = "none";
  titleEl.setAttribute("role", "link");
  titleEl.tabIndex = 0;
}

function wireAppointmentTitle(
  titleEl: HTMLElement,
  appt: Appointment,
  onOpenDetails: () => void
): () => void {
  titleEl.textContent = `Appointment #${appt.id}`;
  styleAppointmentTitleLink(titleEl);

  const open = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAppointmentId(appt.id);
    onOpenDetails();
  };

  titleEl.addEventListener("click", open);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    open(e);
  };
  titleEl.addEventListener("keydown", onKey);

  return () => {
    titleEl.removeEventListener("click", open);
    titleEl.removeEventListener("keydown", onKey);
    titleEl.classList.remove("proto-link", "proto-appointment-title-link");
    titleEl.removeAttribute("role");
    titleEl.removeAttribute("tabindex");
  };
}

function syncHistoryMeta(page: HTMLElement): void {
  const count = APPOINTMENT_COUNT;

  const sortingLabel = page.querySelector<HTMLElement>(
    '[data-name="Sorting"] > p'
  );
  if (sortingLabel) {
    sortingLabel.textContent = `${count} Appointments displayed`;
  }

  page.querySelectorAll("p").forEach((p) => {
    const text = p.textContent ?? "";
    if (/^\d+\s+(orders?|appointments?)$/i.test(text.trim())) {
      p.textContent = `${count} Appointments displayed`;
    }
    if (/you've viewed \d+ of \d+/i.test(text)) {
      p.textContent = `You've viewed ${count} of ${count} appointments`;
    }
  });

  const progressActive = page.querySelector(
    '[data-name="Progress"] [data-name="Active"]'
  ) as HTMLElement | null;
  if (progressActive?.parentElement) {
    progressActive.style.width = "100%";
    progressActive.style.maxWidth = "none";
  }
}

function wireAppointmentPilotHelp(
  page: HTMLElement,
  onAskSitePilot: () => void
): () => void {
  const titleBlock = page.querySelector<HTMLElement>('[data-name="Title"]');
  if (!titleBlock) return () => {};

  const helpLine = Array.from(titleBlock.querySelectorAll("p")).find((p) =>
    /see your (appointment|rental)|find it now|can't see your appointment/i.test(
      p.textContent ?? ""
    )
  );
  if (!helpLine) return () => {};

  const line = document.createElement("p");
  line.className = helpLine.className;
  line.style.cssText = helpLine.style.cssText;
  line.style.fontVariationSettings = helpLine.style.fontVariationSettings;
  line.style.fontFeatureSettings = helpLine.style.fontFeatureSettings;

  const prefix = document.createElement("span");
  prefix.className = "leading-[24px] text-[13px]";
  prefix.textContent = "Can't see your appointment in the list? ";

  const link = document.createElement("span");
  link.className =
    "proto-link leading-[24px] text-[13px] [text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid underline";
  link.textContent = "Ask Site Pilot";
  link.setAttribute("role", "link");
  link.tabIndex = 0;

  const open = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    onAskSitePilot();
  };
  link.addEventListener("click", open);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    open(e);
  };
  link.addEventListener("keydown", onKey);

  line.append(prefix, link);
  helpLine.replaceWith(line);

  return () => {
    link.removeEventListener("click", open);
    link.removeEventListener("keydown", onKey);
  };
}

function syncDetailPricing(page: HTMLElement, appt: Appointment): void {
  const summary = page.querySelector<HTMLElement>(
    '[data-name="Info Blocks / Order Summary/NO"]'
  );
  if (!summary) return;

  if (appt.pricing) {
    const setRow = (dataName: string, value: string) => {
      const row = summary.querySelector<HTMLElement>(`[data-name="${dataName}"]`);
      const ps = row ? Array.from(row.querySelectorAll("p")) : [];
      const valueP = ps[ps.length - 1];
      if (valueP) valueP.textContent = value;
    };
    setRow("Subtotal", formatGbp(appt.pricing.subtotal));
    setRow("Order Discount", formatGbp(appt.pricing.discount));
    setRow("Sales Tax", formatGbp(appt.pricing.tax));
    setRow("Total", formatGbp(appt.pricing.total));
    summary.querySelector('[data-studio-booster-line]')?.remove();
    return;
  }

  syncAccountOrderSummary(summary, appt.includeBooster ?? false);
}

/** Tab 8 — populate list cards and wire titles → tab 9. */
export function syncAppointmentHistory(
  page: HTMLElement,
  onOpenDetails: () => void,
  onAskSitePilot?: () => void,
  onSitePilotHome?: (query: string) => void
): () => void {
  syncHistoryMeta(page);

  const cleanups: Array<() => void> = [];

  if (onAskSitePilot) {
    cleanups.push(wireAppointmentPilotHelp(page, onAskSitePilot));
  }

  cleanups.push(ensureHistoryCardCount(page));

  const cards = Array.from(
    page.querySelectorAll<HTMLElement>(
      '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
    )
  );

  cards.forEach((card, index) => {
    const appt = APPOINTMENTS[index];
    if (!appt) return;

    cleanups.push(
      applyAppointmentToCard(card, appt, {
        onDiscussRefundSitePilot:
          appt.refundPendingNote && onSitePilotHome
            ? () => onSitePilotHome(getAppointmentRefundPilotQuery(appt))
            : undefined,
      })
    );

    const titleEl = card.querySelector<HTMLElement>(":scope > p");
    if (titleEl) {
      cleanups.push(wireAppointmentTitle(titleEl, appt, onOpenDetails));
    }

    cleanups.push(
      syncAppointmentCardCtas(card, appt, { onOpenDetails, isDetailsPage: false })
    );
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Tab 9 breadcrumbs — “Appointment history” → tab 8. */
export function wireAppointmentDetailsBreadcrumbs(
  page: HTMLElement,
  onGoHistory: () => void
): () => void {
  const crumbs = page.querySelector<HTMLElement>(
    '[data-name="component.breadcrumbs"]'
  );
  if (!crumbs) return () => {};

  const historyCrumb = Array.from(crumbs.querySelectorAll("p")).find((p) =>
    /^(appointment history|order history)$/i.test((p.textContent ?? "").trim())
  );
  if (!historyCrumb) return () => {};

  historyCrumb.classList.add("proto-link");
  historyCrumb.style.cursor = "pointer";
  historyCrumb.setAttribute("role", "link");
  historyCrumb.tabIndex = 0;

  const go = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    onGoHistory();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    go(e);
  };

  historyCrumb.addEventListener("click", go);
  historyCrumb.addEventListener("keydown", onKey);

  return () => {
    historyCrumb.removeEventListener("click", go);
    historyCrumb.removeEventListener("keydown", onKey);
    historyCrumb.classList.remove("proto-link");
    historyCrumb.style.cursor = "";
    historyCrumb.removeAttribute("role");
    historyCrumb.removeAttribute("tabindex");
  };
}

/** Tab 9 — show the selected appointment record. */
export function syncAppointmentDetails(
  page: HTMLElement,
  id?: string,
  onSitePilotHome?: (query: string) => void
): () => void {
  const appt = getAppointment(id || selectedAppointmentId) ?? APPOINTMENTS[0];
  if (!appt) return () => {};

  selectedAppointmentId = appt.id;

  const card = page.querySelector<HTMLElement>(
    '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
  );
  if (!card) return () => {};

  const cleanup = applyAppointmentToCard(card, appt, {
    onDiscussRefundSitePilot:
      appt.refundPendingNote && onSitePilotHome
        ? () => onSitePilotHome(getAppointmentRefundPilotQuery(appt))
        : undefined,
  });

  const titleEl = card.querySelector<HTMLElement>(":scope > p");
  if (titleEl) {
    titleEl.textContent = `Appointment #${appt.id}`;
    titleEl.classList.remove("proto-link", "proto-appointment-title-link");
    titleEl.style.cursor = "default";
    titleEl.removeAttribute("role");
    titleEl.removeAttribute("tabindex");
  }

  syncDetailPricing(page, appt);
  syncAppointmentCardCtas(card, appt, {
    onOpenDetails: () => {},
    isDetailsPage: true,
  });

  return cleanup;
}
