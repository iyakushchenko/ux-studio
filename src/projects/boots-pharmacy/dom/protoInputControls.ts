import {
  handlePlpFilterViewAllClick,
  isByTypeFilterRadio,
  isPlpFilterCheckboxDisabled,
  isPlpFilterPanelTarget,
  syncPlpListingFilters,
} from "@/projects/boots-pharmacy/data/protoPlpListing";

export const PROTO_CHECKMARK_HTML = `<div class="absolute inset-0 flex items-center justify-center" data-name="element. gse. checkbox. check mark"><svg width="14" height="10" viewBox="0 0 13.4079 10.1151" fill="none"><path clip-rule="evenodd" d="M0 5.49077L1.40162 4.06407L4.69457 7.29914L11.9937 0L13.4079 1.41421L4.70705 10.1151L0 5.49077Z" fill="#305854" fill-rule="evenodd"/></svg></div>`;

export const PROTO_RADIO_DOT_HTML = `<div class="absolute inset-0 flex items-center justify-center" data-name="element. gse. radio. circle"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#305854"/></svg></div>`;

export function isBoxCheckedFromFigma(box: HTMLElement): boolean {
  return (
    box.className.includes("bg-[#afccca]") ||
    box.className.includes("bg-[#c6e5e1]")
  );
}

export function isBoosterCheckboxRow(row: HTMLElement): boolean {
  return row.dataset.protoBooster === "true";
}

export function markBoosterCheckboxRow(row: HTMLElement): void {
  row.dataset.protoBooster = "true";
}

function standardizeCheckboxBox(box: HTMLElement): void {
  box.className = "absolute left-0 top-0 size-[24px] rounded-[2px]";
  box.replaceChildren();
  box.insertAdjacentHTML("beforeend", PROTO_CHECKMARK_HTML);
  box.dataset.protoStandardized = "1";
}

function standardizeRadioBox(box: HTMLElement): void {
  box.className = "absolute left-0 top-0 size-[24px] rounded-[360px]";
  box.replaceChildren();
  box.insertAdjacentHTML("beforeend", PROTO_RADIO_DOT_HTML);
  box.dataset.protoStandardized = "1";
}

function findCheckboxRow(target: HTMLElement): HTMLElement | null {
  const direct = target.closest<HTMLElement>(
    '[data-name="component.input.checkbox"]'
  );
  if (direct) return direct;

  const filterItem = target.closest<HTMLElement>(
    '[data-name="component.plp.filter.checkbox.item"]'
  );
  return (
    filterItem?.querySelector<HTMLElement>(
      '[data-name="component.input.checkbox"]'
    ) ?? null
  );
}

export function ensureCheckboxRow(row: HTMLElement): void {
  const box = row.querySelector<HTMLElement>('[data-name="box"]');
  if (!box) return;

  if (box.dataset.protoStandardized !== "1") {
    if (row.dataset.checkboxChecked === undefined && !isBoosterCheckboxRow(row)) {
      const plpFilterPanel = row.closest('[data-name="module.plp.filters"]');
      row.dataset.checkboxChecked = plpFilterPanel
        ? "false"
        : String(isBoxCheckedFromFigma(box));
    }
    standardizeCheckboxBox(box);
  }

  row.style.cursor = "pointer";
}

export function ensureRadioRow(row: HTMLElement): void {
  const box = row.querySelector<HTMLElement>('[data-name="box"]');
  if (!box) return;

  if (box.dataset.protoStandardized !== "1") {
    if (row.dataset.radioChecked === undefined) {
      row.dataset.radioChecked = String(isBoxCheckedFromFigma(box));
    }
    standardizeRadioBox(box);
  }

  row.style.cursor = "pointer";
}

function isMixedRadioCheckboxFilterList(list: HTMLElement): boolean {
  return (
    list.querySelector('[data-name="component.plp.filter.checkbox.item"]') !==
      null &&
    list.querySelector('[data-name="component.input.radio"]') !== null
  );
}

function radioLabel(row: HTMLElement): string {
  return (row.querySelector("p")?.textContent ?? "").trim();
}

function hasAnyCheckedCheckboxInMixedList(list: HTMLElement): boolean {
  return Array.from(
    list.querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
  ).some(
    (row) =>
      !isBoosterCheckboxRow(row) && row.dataset.checkboxChecked === "true"
  );
}

function selectDefaultRadioInMixedFilterList(checkboxRow: HTMLElement): void {
  const list = checkboxRow.closest<HTMLElement>('[data-name="list"]');
  if (!list || !isMixedRadioCheckboxFilterList(list)) return;
  if (hasAnyCheckedCheckboxInMixedList(list)) return;

  list
    .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    .forEach((row) => {
      ensureRadioRow(row);
      row.dataset.radioChecked = String(/all age groups/i.test(radioLabel(row)));
    });
}

function unselectRadiosInMixedFilterList(checkboxRow: HTMLElement): void {
  const list = checkboxRow.closest<HTMLElement>('[data-name="list"]');
  if (!list || !isMixedRadioCheckboxFilterList(list)) return;

  list
    .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    .forEach((row) => {
      ensureRadioRow(row);
      row.dataset.radioChecked = "false";
    });
}

function unselectCheckboxesInMixedFilterList(radioRow: HTMLElement): void {
  const list = radioRow.closest<HTMLElement>('[data-name="list"]');
  if (!list || !isMixedRadioCheckboxFilterList(list)) return;

  list
    .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
    .forEach((row) => {
      if (isBoosterCheckboxRow(row)) return;
      ensureCheckboxRow(row);
      row.dataset.checkboxChecked = "false";
    });
}

export const PLP_FILTER_VIEW_ALL_SELECTOR =
  '[data-name="component.plp.filter.view-all"]';

const PLP_FILTER_VIEW_ALL = PLP_FILTER_VIEW_ALL_SELECTOR;

function wirePlpFilterViewAllLink(el: HTMLElement): void {
  if (el.dataset.protoViewAllWired === "2") return;

  let link: HTMLAnchorElement;
  if (el instanceof HTMLAnchorElement) {
    link = el;
  } else {
    link = document.createElement("a");
    link.href = "#";
    link.className = `${el.className} proto-link block`.trim();
    link.textContent = (el.textContent ?? "View all").trim();
    link.setAttribute("data-name", "component.plp.filter.view-all");
    if (el.getAttribute("style")) {
      link.setAttribute("style", el.getAttribute("style") ?? "");
    }
    el.replaceWith(link);
  }

  link.classList.add("proto-link");
  if (!link.classList.contains("block")) link.classList.add("block");
  link.addEventListener("click", (e) => {
    e.preventDefault();
    handlePlpFilterViewAllClick(link);
  });
  link.dataset.protoViewAllWired = "2";
}

export function wirePlpFilterViewAllLinks(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(PLP_FILTER_VIEW_ALL)
    .forEach(wirePlpFilterViewAllLink);
}

export function initProtoInputControls(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
    .forEach(ensureCheckboxRow);

  root
    .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    .forEach(ensureRadioRow);

  root
    .querySelectorAll<HTMLElement>(
      '[data-name="component.plp.filter.checkbox.item"]'
    )
    .forEach((item) => {
      item.style.cursor = "pointer";
    });

  wirePlpFilterViewAllLinks(root);
}

export function handleProtoInputClick(target: HTMLElement): boolean {
  const checkboxRow = findCheckboxRow(target);
  if (checkboxRow) {
    if (isBoosterCheckboxRow(checkboxRow)) return false;
    if (isPlpFilterCheckboxDisabled(checkboxRow)) return false;

    ensureCheckboxRow(checkboxRow);
    const wasChecked = checkboxRow.dataset.checkboxChecked === "true";
    const isNowChecked = !wasChecked;
    checkboxRow.dataset.checkboxChecked = String(isNowChecked);
    if (isNowChecked) {
      unselectRadiosInMixedFilterList(checkboxRow);
    } else {
      selectDefaultRadioInMixedFilterList(checkboxRow);
    }
    if (isPlpFilterPanelTarget(checkboxRow)) {
      syncPlpListingFilters();
    }
    return true;
  }

  const radioRow = target.closest<HTMLElement>(
    '[data-name="component.input.radio"]'
  );
  if (!radioRow) return false;

  ensureRadioRow(radioRow);

  const list = radioRow.closest<HTMLElement>('[data-name="list"]');
  if (list) {
    list
      .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
      .forEach((row) => {
        ensureRadioRow(row);
        row.dataset.radioChecked = "false";
      });
  }

  radioRow.dataset.radioChecked = "true";
  unselectCheckboxesInMixedFilterList(radioRow);
  if (isByTypeFilterRadio(radioRow) || isPlpFilterPanelTarget(radioRow)) {
    syncPlpListingFilters();
  }
  return true;
}
