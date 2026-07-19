import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ProtoCloseIcon } from "@/app/chrome/ProtoCloseIcon";
import { useProtoOverlayDismiss } from "@/app/chrome/useProtoOverlayDismiss";
import { ProtoTertiaryCta } from "@/app/chrome/ProtoTertiaryCta";
import { ProtoWishlistHeart } from "@/projects/boots-pharmacy/chrome/ProtoWishlistHeart";
import {
  DisclosureContent,
  DisclosureTrigger,
  FilterChip,
  FilterChipGroup,
  FilterChipRow,
  useAccordion,
} from "@/uxds/interactions";
import iconSearch from "@/assets/avail/search.svg";
import iconMapPin from "@/assets/avail/map-pin.svg";
import iconCheckChosen from "@/assets/avail/check-chosen.svg";
import iconArrows from "@/assets/avail/arrows.svg";
import iconArrowsSecondary from "@/assets/avail/arrows-secondary.svg";
import accentEllipse from "@/assets/avail/accent-ellipse.svg";
import accentFace from "@/assets/avail/accent-face.png";
import accentMap from "@/assets/avail/accent-map.svg";
import accentGlyphCheck from "@/assets/avail/accent-glyph-check.svg";
import accentGlyphSearch from "@/assets/avail/accent-glyph-search.svg";
import promoAppointmentIcon from "@/projects/boots-pharmacy/frame/9d46d8f7966cc26795f1d8689d9132bdf6e13c15.png";
import { setupProtoMapView } from "@/projects/boots-pharmacy/dom/protoMap";
import {
  dismissLocationFieldFocus,
  isListSearchView,
  isNearMeMapView,
  PROTO_LOC_COUNT_NEAR,
  PROTO_LOC_SEARCH_DEFAULT,
  PROTO_LOC_SEARCH_NEAR,
  shouldShowLocationSearchClear,
} from "@/projects/boots-pharmacy/dom/protoLocationSearch";
import {
  AVAIL_STORES,
  formatAvailLocationCount,
  type AvailStore,
} from "@/projects/boots-pharmacy/data/availStores";
import {
  isInSavedLocations,
  SAVED_LOCATIONS_CHANGE_EVENT,
} from "@/projects/boots-pharmacy/data/protoSavedLocations";
import { toggleSavedLocationWithNotify } from "@/projects/boots-pharmacy/chrome/protoHeaderMount";

/** Native hover tooltip for the demo “today” cell (12 June 2026). */
export const PROTO_TODAY_TOOLTIP = "Today is June 12 2026";

export type { AvailStore } from "@/projects/boots-pharmacy/data/availStores";

export type AvailStep =
  | "start"
  | "list"
  | "map"
  | "noSlots"
  | "date"
  | "time";

export type ChosenBookingSlot = {
  month: "June" | "July";
  day: number;
  time: string;
};

export type AvailOpenIntent = {
  step: AvailStep;
  query?: string;
  nearMe?: boolean;
  storeId?: string;
  selectedDate?: { month: "June" | "July"; day: number };
  selectedTime?: string;
  /** Book / chat location picker — Choose Location closes tool, no date flow */
  pickLocation?: boolean;
  /** Show validation hint (Continue without a pharmacy on Book Step 1) */
  locationRequired?: boolean;
  /** CJM retreat — force re-apply intent even when the payload matches a prior open. */
  replayKey?: number;
};

type Props = {
  open: boolean;
  openIntent?: AvailOpenIntent;
  onClose: () => void;
  onBookNow: (store: AvailStore, slot: ChosenBookingSlot) => void;
  onChooseLocation?: (store: AvailStore) => void;
  loggedIn?: boolean;
  onOpenLogin?: () => void;
  onActiveStepChange?: (step: AvailStep) => void;
};

const STORES = AVAIL_STORES;

/** Shown on list cards for pharmacies with no bookable slots in the demo window. */
const NO_SLOTS_STATUS =
  "This location currently has no available slots for the upcoming 28 day period.";

const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const BOOKING_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const HOURS = [
  ["Monday", "09:00-21:00"],
  ["Tuesday", "09:00-21:00"],
  ["Wednesday", "09:00-21:00"],
  ["Thursday", "09:00-21:00"],
  ["Friday", "09:00-21:00"],
  ["Saturday", "09:00-21:00"],
  ["Sunday", "12:00-18:00"],
] as const;

/** June 2026 grid: leading May 31 + June 1–30 + trailing July 1–4 */
const JUNE_CELLS: { day: number; month: "May" | "June" | "July"; available: boolean }[] = [
  { day: 31, month: "May", available: false },
  ...Array.from({ length: 11 }, (_, i) => ({
    day: i + 1,
    month: "June" as const,
    available: false,
  })),
  { day: 12, month: "June", available: true },
  ...Array.from({ length: 18 }, (_, i) => ({
    day: i + 13,
    month: "June" as const,
    available: true,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    day: i + 1,
    month: "July" as const,
    available: false,
  })),
];

/** July 2026: leading Jun 28–30 + July 1–31 + trailing Aug 1 */
const JULY_CELLS: { day: number; month: "June" | "July" | "August"; available: boolean }[] = [
  { day: 28, month: "June", available: false },
  { day: 29, month: "June", available: false },
  { day: 30, month: "June", available: false },
  ...Array.from({ length: 10 }, (_, i) => ({
    day: i + 1,
    month: "July" as const,
    available: true,
  })),
  ...Array.from({ length: 21 }, (_, i) => ({
    day: i + 11,
    month: "July" as const,
    available: false,
  })),
  { day: 1, month: "August", available: false },
];

const MORNING = [
  { t: "09:20", ok: false },
  { t: "09:35", ok: false },
  { t: "09:50", ok: false },
  { t: "10:05", ok: true },
  { t: "10:20", ok: true },
  { t: "10:35", ok: true },
  { t: "10:50", ok: true },
  { t: "11:05", ok: false },
  { t: "11:20", ok: true },
  { t: "11:35", ok: false },
];
const AFTERNOON = [
  { t: "12:15", ok: false },
  { t: "12:30", ok: false },
  { t: "12:45", ok: false },
  { t: "13:00", ok: true },
  { t: "13:15", ok: true },
  { t: "13:30", ok: true },
  { t: "13:45", ok: true },
  { t: "14:00", ok: false },
  { t: "14:15", ok: false },
  { t: "14:30", ok: false },
  { t: "14:45", ok: false },
  { t: "15:00", ok: true },
  { t: "15:15", ok: true },
  { t: "15:30", ok: true },
  { t: "15:45", ok: true },
  { t: "16:00", ok: true },
  { t: "16:15", ok: true },
  { t: "16:30", ok: true },
  { t: "16:45", ok: true },
];
const EVENING = [
  { t: "17:00", ok: true },
  { t: "17:15", ok: true },
  { t: "17:30", ok: true },
  { t: "17:45", ok: true },
  { t: "18:00", ok: true },
  { t: "18:15", ok: true },
  { t: "18:30", ok: true },
  { t: "18:45", ok: true },
  { t: "19:00", ok: true },
  { t: "19:15", ok: false },
  { t: "19:30", ok: false },
  { t: "19:45", ok: true },
  { t: "20:00", ok: true },
  { t: "20:15", ok: true },
];

const SEARCH_DEFAULT = PROTO_LOC_SEARCH_DEFAULT;
const SEARCH_NEAR_PLACEHOLDER = PROTO_LOC_SEARCH_NEAR;
const COUNT_DEFAULT = formatAvailLocationCount();
const COUNT_NEAR = PROTO_LOC_COUNT_NEAR;

function AvailMapPanel({
  nearMe,
  onPinClick,
  pinLabels,
}: {
  nearMe: boolean;
  onPinClick: (pinIndex: number) => void;
  pinLabels: string[];
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapCtrlRef = useRef<ReturnType<typeof setupProtoMapView> | null>(null);
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    mapCtrlRef.current = setupProtoMapView(host, {
      onPinClick: (pinIndex) => onPinClickRef.current(pinIndex),
      pinLabels,
    });
    return () => {
      mapCtrlRef.current?.cleanup();
      mapCtrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapCtrlRef.current?.setNearMe(nearMe);
  }, [nearMe]);

  return <div ref={hostRef} className="proto-lb-map-view proto-avail-map-host" />;
}

function dayOrdinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatDateHeading(month: "June" | "July", day: number): string {
  const d = new Date(2026, month === "July" ? 6 : 5, day);
  return `${BOOKING_WEEKDAYS[d.getDay()]}, ${dayOrdinal(day)} ${month} 2026`;
}

function AccentIcon({
  variant,
}: {
  variant: "map" | "check" | "search";
}) {
  const glyph =
    variant === "map"
      ? accentMap
      : variant === "check"
        ? accentGlyphCheck
        : accentGlyphSearch;

  return (
    <div
      className={`proto-avail-accent proto-avail-accent--${variant}`}
      aria-hidden
    >
      <img className="proto-avail-accent__ellipse" src={accentEllipse} alt="" />
      <img className="proto-avail-accent__face" src={accentFace} alt="" />
      <div className={`proto-avail-accent__glyph-slot proto-avail-accent__glyph-slot--${variant}`}>
        <img className="proto-avail-accent__glyph" src={glyph} alt="" />
      </div>
    </div>
  );
}

function StoreCard({
  store,
  chosen,
  hoursOpen,
  loggedIn,
  isSaved,
  onToggleHours,
  onChoose,
  onShowMap,
  onOpenLogin,
  onToggleSaved,
}: {
  store: AvailStore;
  chosen: boolean;
  hoursOpen: boolean;
  loggedIn: boolean;
  isSaved: boolean;
  onToggleHours: () => void;
  onChoose: () => void;
  onShowMap: () => void;
  onOpenLogin?: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <div
      className={`proto-avail-store${chosen ? " proto-avail-store--chosen" : ""}`}
      data-proto-avail-store={store.id}
    >
      <div className="proto-avail-store__main">
        <div className="proto-avail-store__head">
          <p className="proto-avail-store__name">{store.name}</p>
          {loggedIn && isSaved ? (
            <p className="proto-avail-store__status proto-avail-store__status--saved" role="status">
              This location is saved in My Locations
            </p>
          ) : null}
          {!store.hasSlots ? (
            <p className="proto-avail-store__status" role="status">
              {NO_SLOTS_STATUS}
            </p>
          ) : null}
        </div>
        <div className="proto-avail-store__rows">
          <div className="proto-avail-store__row">
            <span>Location</span>
            <span>{store.address}</span>
          </div>
          <div className="proto-avail-store__row">
            <span>Contact number:</span>
            <span>{store.phone}</span>
          </div>
        </div>
        <div className="proto-avail-store__links">
          <DisclosureTrigger
            open={hoursOpen}
            onToggle={onToggleHours}
            className="proto-avail-link"
            data-proto-avail-hours-trigger={store.id}
          >
            {hoursOpen ? "Hide working hours" : "See working hours"}
          </DisclosureTrigger>
          <button type="button" className="proto-avail-link" onClick={onShowMap}>
            Show on map
          </button>
        </div>
        <DisclosureContent
          open={hoursOpen}
          className="proto-avail-hours"
          data-proto-avail-hours={store.id}
        >
          {HOURS.map(([day, hours]) => (
            <div key={day} className="proto-avail-store__row">
              <span>{day}</span>
              <span>{hours}</span>
            </div>
          ))}
        </DisclosureContent>
      </div>
      <div className="proto-avail-store__aside">
        <div className="proto-avail-store__meta">
          <span className="proto-avail-store__from">From you</span>
          <span className="proto-avail-store__distance">{store.distance}</span>
          <span className="proto-avail-store__access">Disabled access</span>
        </div>
        <div className="proto-avail-store__actions">
          <button
            type="button"
            className={
              chosen
                ? "proto-avail-btn-secondary proto-avail-btn-secondary--sm proto-avail-btn-secondary--chosen"
                : "proto-avail-btn-secondary proto-avail-btn-secondary--sm"
            }
            onClick={(e) => {
              e.stopPropagation();
              onChoose();
            }}
          >
            <img
              className={
                chosen
                  ? "proto-avail-check-icon"
                  : "proto-avail-check-icon proto-secondary-cta-icon"
              }
              src={iconCheckChosen}
              alt=""
              width={16}
              height={16}
            />
            {chosen ? "Chosen Location" : "Choose Location"}
          </button>
          <ProtoWishlistHeart
            active={loggedIn && isSaved}
            label={
              loggedIn && isSaved
                ? `Remove ${store.name} from My Locations`
                : `Save ${store.name} to My Locations`
            }
            onClick={() => {
              if (!loggedIn) {
                onOpenLogin?.();
                return;
              }
              onToggleSaved();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  label,
  cells,
  selected,
  onSelect,
}: {
  label: "June" | "July";
  cells: { day: number; month: string; available: boolean }[];
  selected: { month: "June" | "July"; day: number };
  onSelect: (month: "June" | "July", day: number) => void;
}) {
  const rows = useMemo(() => {
    const out: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  return (
    <div className="proto-avail-month">
      <p className="proto-avail-month__title">{label}</p>
      <div className="proto-avail-month__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="proto-avail-month__grid">
        {rows.map((row, ri) => (
          <div key={ri} className="proto-avail-month__row">
            {row.map((cell, ci) => {
              const inMonth = cell.month === label;
              const available = inMonth && cell.available;
              const isToday = label === "June" && cell.day === 12 && inMonth;
              const isSelected =
                available &&
                selected.month === label &&
                selected.day === cell.day;
              return (
                <button
                  key={`${cell.month}-${cell.day}-${ci}`}
                  type="button"
                  disabled={!available}
                  title={isToday ? PROTO_TODAY_TOOLTIP : undefined}
                  aria-label={isToday ? PROTO_TODAY_TOOLTIP : undefined}
                  className={[
                    "proto-avail-cal-cell",
                    !inMonth || !cell.available ? "proto-avail-cal-cell--disabled" : "",
                    isToday && !isSelected ? "proto-avail-cal-cell--today" : "",
                    isSelected ? "proto-avail-cal-cell--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (available) onSelect(label, cell.day);
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeSection({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: { t: string; ok: boolean }[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="proto-avail-time-section">
      <p className="proto-avail-time-section__label">{label}</p>
      <div className="proto-avail-time-grid">
        {slots.map(({ t, ok }) => (
          <button
            key={t}
            type="button"
            disabled={!ok}
            className={[
              "proto-avail-cal-cell proto-avail-cal-cell--time",
              !ok ? "proto-avail-cal-cell--disabled" : "",
              ok && selected === t ? "proto-avail-cal-cell--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => ok && onSelect(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AvailabilityTool({
  open,
  openIntent,
  onClose,
  onBookNow,
  onChooseLocation,
  loggedIn = false,
  onOpenLogin,
  onActiveStepChange,
}: Props) {
  const { mounted, scrimClassName, onScrimAnimationEnd } = useProtoOverlayDismiss(open);
  const [step, setStep] = useState<AvailStep>("start");
  const [query, setQuery] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [pickLocation, setPickLocation] = useState(false);
  const [locationRequiredHint, setLocationRequiredHint] = useState(false);
  const [showFoundDot, setShowFoundDot] = useState(false);
  const [store, setStore] = useState<AvailStore | null>(null);
  const [hoursOpenIds, setHoursOpenIds] = useState<string[]>([]);
  const hoursAccordion = useAccordion({
    type: "single",
    value: hoursOpenIds,
    onValueChange: setHoursOpenIds,
  });
  /** List filter: `all` | `slots` (UXDS FilterChipToggle, single mode). */
  const [storeFilter, setStoreFilter] = useState<string[]>(["all"]);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySent, setNotifySent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{
    month: "June" | "July";
    day: number;
  }>({ month: "June", day: 24 });
  const [selectedTime, setSelectedTime] = useState("16:30");
  const storeListRef = useRef<HTMLDivElement>(null);
  const pendingPinScrollRef = useRef<number | null>(null);
  const pendingStoreScrollIdRef = useRef<string | null>(null);
  const appliedIntentSigRef = useRef<string | null>(null);
  const foundCountRef = useRef<HTMLSpanElement>(null);
  const foundFlashTimerRef = useRef<number | undefined>(undefined);
  const [, setSavedLocationsTick] = useState(0);

  useEffect(() => {
    const onSavedChange = () => setSavedLocationsTick((n) => n + 1);
    document.addEventListener(SAVED_LOCATIONS_CHANGE_EVENT, onSavedChange);
    return () => {
      document.removeEventListener(SAVED_LOCATIONS_CHANGE_EVENT, onSavedChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    onActiveStepChange?.(step);
  }, [open, onActiveStepChange, step]);

  useEffect(() => {
    if (!open) {
      appliedIntentSigRef.current = null;
      return;
    }
    const intent: AvailOpenIntent = openIntent ?? { step: "start" };
    // replayKey forces re-apply on CJM step-back even when step/store/date match
    const sig = `${intent.replayKey ?? "static"}::${JSON.stringify(intent)}`;
    if (sig === appliedIntentSigRef.current) return;
    appliedIntentSigRef.current = sig;

    const resolvedStore =
      intent.storeId != null
        ? STORES.find((s) => s.id === intent.storeId) ?? null
        : intent.step === "date" || intent.step === "time"
          ? STORES.find((s) => s.hasSlots) ?? null
          : null;
    let resolvedStep = intent.step;
    if (
      !intent.pickLocation &&
      resolvedStore &&
      !resolvedStore.hasSlots &&
      (intent.step === "date" || intent.step === "time")
    ) {
      resolvedStep = "noSlots";
    }
    setPickLocation(Boolean(intent.pickLocation));
    setLocationRequiredHint(Boolean(intent.locationRequired));
    setStep(resolvedStep);
    setQuery(
      intent.nearMe
        ? ""
        : intent.query?.trim() ||
            (intent.step === "list" ||
            (intent.step === "map" && !intent.nearMe)
              ? SEARCH_DEFAULT
              : "")
    );
    setNearMe(intent.nearMe ?? false);
    setShowFoundDot(false);
    setHoursOpenIds([]);
    setStoreFilter(["all"]);
    setNotifyEmail("");
    setNotifySent(false);
    setStore(resolvedStore);
    setSelectedDate(intent.selectedDate ?? { month: "June", day: 24 });
    setSelectedTime(intent.selectedTime ?? "16:30");
  }, [open, openIntent]);

  useEffect(() => {
    if (step !== "noSlots") {
      setNotifyEmail("");
      setNotifySent(false);
    }
  }, [step]);

  useEffect(() => {
    if (step !== "list") return;

    const storeId = pendingStoreScrollIdRef.current;
    if (storeId) {
      pendingStoreScrollIdRef.current = null;
      requestAnimationFrame(() => {
        const card = storeListRef.current?.querySelector<HTMLElement>(
          `[data-proto-avail-store="${storeId}"]`
        );
        card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      return;
    }

    if (pendingPinScrollRef.current == null) return;
    const pinIndex = pendingPinScrollRef.current;
    pendingPinScrollRef.current = null;
    requestAnimationFrame(() => {
      const cards = storeListRef.current?.querySelectorAll<HTMLElement>(
        "[data-proto-avail-store]"
      );
      if (!cards?.length) return;
      const card = cards[pinIndex] ?? cards[0];
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [step]);

  useEffect(() => {
    if (open) return;
    if (foundFlashTimerRef.current != null) {
      window.clearTimeout(foundFlashTimerRef.current);
      foundFlashTimerRef.current = undefined;
    }
    setShowFoundDot(false);
  }, [open]);

  useEffect(() => {
    if (nearMe) return;
    if (foundFlashTimerRef.current != null) {
      window.clearTimeout(foundFlashTimerRef.current);
      foundFlashTimerRef.current = undefined;
    }
    setShowFoundDot(false);
  }, [nearMe]);

  if (!mounted) return null;

  const title =
    step === "start"
      ? "Find Pharmacy"
      : step === "date"
        ? "Choose Date"
        : step === "time"
          ? "Choose Time"
          : "Choose Pharmacy";

  const resetSearch = () => {
    setNearMe(false);
    setQuery(SEARCH_DEFAULT);
    setStep("list");
  };

  /** Map pin → List view + scroll to matching store card (same as Locations popup). */
  const handleMapPinClick = (pinIndex: number) => {
    pendingPinScrollRef.current = pinIndex;
    resetSearch();
  };

  const goList = (seed?: string) => {
    setNearMe(false);
    setQuery(seed?.trim() || SEARCH_DEFAULT);
    setStep("list");
  };

  /** Date step — open list view with the current pharmacy card in view. */
  const goListWithChosenStore = () => {
    if (store?.id) {
      pendingStoreScrollIdRef.current = store.id;
    }
    goList();
  };

  const goStart = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setNearMe(false);
    setQuery("");
    setStep("start");
  };

  const flashFoundCount = () => {
    setShowFoundDot(true);
    requestAnimationFrame(() => {
      const el = foundCountRef.current;
      if (!el) return;
      el.classList.remove("proto-avail-found-dot--flash");
      void el.offsetWidth;
      el.classList.add("proto-avail-found-dot--flash");
      if (foundFlashTimerRef.current != null) {
        window.clearTimeout(foundFlashTimerRef.current);
      }
      foundFlashTimerRef.current = window.setTimeout(() => {
        el.classList.remove("proto-avail-found-dot--flash");
        setShowFoundDot(false);
        foundFlashTimerRef.current = undefined;
      }, 900);
    });
  };

  const isListSearchScenario = isListSearchView({ step, nearMe });
  const showSearchClear = shouldShowLocationSearchClear(query);

  const dismissFieldFocus = dismissLocationFieldFocus;

  const handleSearchIconClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListSearchScenario) {
      dismissFieldFocus(e.currentTarget as HTMLElement);
      flashFoundCount();
      return;
    }
    if (nearMe || step === "map") {
      resetSearch();
    }
  };

  /** Same scenario as Locations popup: Map + 63 count + near-me search + extra pins. */
  const goNearMe = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isNearMeMapView({ step, nearMe })) {
      (e?.currentTarget as HTMLButtonElement | undefined)?.blur();
      flashFoundCount();
      return;
    }
    setNearMe(true);
    setQuery("");
    setStep("map");
  };

  const chooseStore = (s: AvailStore) => {
    if (pickLocation) {
      onChooseLocation?.(s);
      onClose();
      return;
    }
    setStore(s);
    setNotifyEmail("");
    setNotifySent(false);
    setStep(s.hasSlots ? "date" : "noSlots");
  };

  /** List view — resume booking with an already-chosen pharmacy. */
  const continueWithChosenStore = () => {
    if (!store) return;
    setNotifyEmail("");
    setNotifySent(false);
    setStep(store.hasSlots ? "date" : "noSlots");
  };

  const submitNotify = () => {
    setNotifySent(true);
  };

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={scrimClassName}
      role="presentation"
      onClick={onScrim}
      onAnimationEnd={onScrimAnimationEnd}
    >
      <div
        className="proto-avail-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proto-avail-title"
      >
        <div className="proto-avail-header">
          <h2 id="proto-avail-title" className="proto-avail-title">
            {title}
          </h2>
          <button
            type="button"
            className="proto-popup-close"
            aria-label="Close Availability Tool"
            onClick={onClose}
          >
            <ProtoCloseIcon />
          </button>
        </div>

        {step === "start" && (
          <div className="proto-avail-body proto-avail-body--panel">
            <div className="proto-avail-panel proto-avail-panel--center">
              <AccentIcon variant="map" />
              <p className="proto-avail-heading">Choose Location</p>
              <p className="proto-avail-copy">
                Explore available pharmacies near you or search for specific
                location
              </p>
              <div className="proto-avail-field-wrap proto-avail-field-wrap--stack">
                <label
                  className="proto-avail-field"
                  onClick={() => goList()}
                >
                  <input
                    type="text"
                    placeholder="Enter city, post code or any part of the address"
                    value={query}
                    readOnly
                    onFocus={() => goList()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") goList(query.trim() || undefined);
                    }}
                  />
                  <button
                    type="button"
                    className="proto-avail-field__icon"
                    aria-label="Search"
                    onClick={() => goList(query.trim() || undefined)}
                  >
                    <img src={iconSearch} alt="" width={24} height={24} />
                  </button>
                </label>
                <button
                  type="button"
                  className="proto-tertiary-cta proto-tertiary-cta--compact"
                  onClick={goNearMe}
                >
                  <img src={iconMapPin} alt="" width={16} height={16} />
                  See what&apos;s available near me
                </button>
              </div>
            </div>
          </div>
        )}

        {(step === "list" || step === "map") && (
          <div className="proto-avail-step">
          <div className="proto-avail-body proto-avail-body--stack">
            <div className="proto-avail-search-row">
              <label
                className={`proto-avail-field proto-avail-field--flex${nearMe ? " proto-avail-field--near" : ""}`}
                onClick={(e) => {
                  if (nearMe || step === "map") {
                    e.preventDefault();
                    resetSearch();
                  }
                }}
              >
                <input
                  type="text"
                  value={query}
                  placeholder={nearMe ? SEARCH_NEAR_PLACEHOLDER : undefined}
                  readOnly={nearMe}
                  onChange={(e) => {
                    if (nearMe) return;
                    setQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (nearMe || step === "map") resetSearch();
                  }}
                />
                <span className="proto-avail-field__actions">
                  {showSearchClear ? (
                    <button
                      type="button"
                      className="proto-popup-close"
                      aria-label="Clear search"
                      onClick={goStart}
                    >
                      <ProtoCloseIcon />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="proto-avail-field__icon"
                    aria-label="Search"
                    onClick={handleSearchIconClick}
                  >
                    <img src={iconSearch} alt="" width={24} height={24} />
                  </button>
                </span>
              </label>
              <button
                type="button"
                className="proto-tertiary-cta proto-tertiary-cta--compact"
                onClick={goNearMe}
              >
                <img src={iconMapPin} alt="" width={16} height={16} />
                See what&apos;s available near me
              </button>
            </div>

            {pickLocation && locationRequiredHint && (
              <div
                className="proto-promo-pill proto-promo-pill--amber"
                role="status"
              >
                <p>A pharmacy must be selected to proceed</p>
              </div>
            )}

            <div className="proto-avail-panel proto-avail-panel--fill">
              <div className="proto-avail-list-bar">
                <div className="proto-avail-found-wrap">
                  <p className="proto-avail-found">
                    {nearMe ? COUNT_NEAR : COUNT_DEFAULT}
                  </p>
                  {showFoundDot && (
                    <span
                      ref={foundCountRef}
                      className="proto-avail-found-dot"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="proto-avail-toggle" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={step === "list"}
                    className={
                      step === "list"
                        ? "proto-avail-toggle__tab proto-avail-toggle__tab--active"
                        : "proto-avail-toggle__tab"
                    }
                    onClick={() => goList()}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={step === "map"}
                    className={
                      step === "map"
                        ? "proto-avail-toggle__tab proto-avail-toggle__tab--active"
                        : "proto-avail-toggle__tab"
                    }
                    onClick={() => {
                      setNearMe(false);
                      setStep("map");
                    }}
                  >
                    Map
                  </button>
                </div>
              </div>

              {step === "list" ? (
                <div ref={storeListRef} className="proto-avail-store-list">
                  <FilterChipGroup
                    mode="single"
                    value={storeFilter}
                    onValueChange={(next) =>
                      setStoreFilter(next.length ? next : ["all"])
                    }
                    className="proto-avail-store-filters"
                    data-name="uxds.interaction.filter-chip-group"
                  >
                    {({ selected, toggle, isSelected }) => (
                      <FilterChipRow className="uxds-filter-chip-row proto-avail-store-filters__row">
                        <FilterChip
                          id="all"
                          selected={isSelected("all") || selected.length === 0}
                          onToggle={() => toggle("all")}
                        >
                          All locations
                        </FilterChip>
                        <FilterChip
                          id="slots"
                          selected={isSelected("slots")}
                          onToggle={() => toggle("slots")}
                        >
                          Slots available
                        </FilterChip>
                      </FilterChipRow>
                    )}
                  </FilterChipGroup>
                  {STORES.filter((s) =>
                    storeFilter.includes("slots") ? s.hasSlots : true
                  ).map((s) => (
                    <StoreCard
                      key={s.id}
                      store={s}
                      chosen={store?.id === s.id}
                      hoursOpen={hoursAccordion.isOpen(s.id)}
                      loggedIn={loggedIn}
                      isSaved={isInSavedLocations(s.id)}
                      onToggleHours={() => hoursAccordion.toggle(s.id)}
                      onChoose={() => chooseStore(s)}
                      onShowMap={() => {
                        setStore(s);
                        setNearMe(false);
                        setStep("map");
                      }}
                      onOpenLogin={onOpenLogin}
                      onToggleSaved={() => {
                        toggleSavedLocationWithNotify(s.id);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <AvailMapPanel
                  nearMe={nearMe}
                  onPinClick={handleMapPinClick}
                  pinLabels={STORES.map((s) => s.name)}
                />
              )}
            </div>
          </div>
          {step === "list" && store && !pickLocation ? (
            <div className="proto-avail-footer proto-avail-footer--end">
              <button
                type="button"
                className="proto-avail-btn-primary"
                onClick={continueWithChosenStore}
              >
                Continue
                <img
                  src={iconArrows}
                  alt=""
                  width={16}
                  height={16}
                  className="proto-avail-icon-flip"
                />
              </button>
            </div>
          ) : null}
          </div>
        )}

        {step === "noSlots" && store && (
          <div className="proto-avail-body proto-avail-body--stack">
            <div className="proto-avail-panel proto-avail-panel--center proto-avail-panel--grow">
              <AccentIcon variant="search" />
              <p className="proto-avail-heading">No available slots in</p>
              <ProtoTertiaryCta
                compact
                className="proto-avail-chosen-pharmacy-cta"
                icon={<img src={accentMap} alt="" width={16} height={16} />}
                aria-label={`View ${store.name} in pharmacy list`}
                onClick={goListWithChosenStore}
              >
                {store.name}
              </ProtoTertiaryCta>
              <button
                type="button"
                className="proto-avail-btn-primary"
                onClick={() => goList()}
              >
                <img src={iconArrows} alt="" width={16} height={16} />
                Back to List
              </button>
            </div>
            <div className="proto-avail-panel proto-avail-notify">
              <p className="proto-avail-copy">
                We can notify you when slots become available in this location.
                <br />
                Your email address will only be used for availability
                notification.
              </p>
              {notifySent ? (
                <div className="proto-promo-pill" role="status">
                  <p>
                    {notifyEmail.trim() ? (
                      <>
                        Confirmation email sent to{" "}
                        <span className="proto-promo-pill__email">
                          {notifyEmail.trim()}
                        </span>
                        . We&apos;ll notify you when slots become available.
                      </>
                    ) : (
                      <>We&apos;ll notify you when slots become available.</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="proto-avail-notify__row">
                  <label className="proto-avail-field proto-avail-field--flex">
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitNotify();
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="proto-avail-btn-secondary"
                    onClick={submitNotify}
                  >
                    Notify Me
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "date" && (
          <div className="proto-avail-step">
            <div className="proto-avail-body proto-avail-body--stack">
              <div className="proto-avail-hero">
                <AccentIcon variant="check" />
                <p className="proto-avail-heading">There are available slots!</p>
                {store ? (
                  <ProtoTertiaryCta
                    compact
                    className="proto-avail-chosen-pharmacy-cta"
                    icon={
                      <img src={accentMap} alt="" width={16} height={16} />
                    }
                    aria-label={`View ${store.name} in pharmacy list`}
                    onClick={goListWithChosenStore}
                  >
                    {store.name}
                  </ProtoTertiaryCta>
                ) : null}
                <p className="proto-avail-copy">
                  You can book appointments up to 28 days in advance
                </p>
              </div>
              <div className="proto-avail-panel">
                <div className="proto-avail-calendars">
                  <MonthGrid
                    label="June"
                    cells={JUNE_CELLS}
                    selected={selectedDate}
                    onSelect={(month, day) => setSelectedDate({ month, day })}
                  />
                  <MonthGrid
                    label="July"
                    cells={JULY_CELLS}
                    selected={selectedDate}
                    onSelect={(month, day) => setSelectedDate({ month, day })}
                  />
                </div>
              </div>
            </div>
            <div className="proto-avail-footer">
              <button
                type="button"
                className="proto-avail-btn-secondary"
                onClick={() => goList()}
              >
                <img
                  className="proto-secondary-cta-icon"
                  src={iconArrowsSecondary}
                  alt=""
                  width={16}
                  height={16}
                />
                Back to List
              </button>
              <button
                type="button"
                className="proto-avail-btn-primary"
                onClick={() => setStep("time")}
              >
                Continue
                <img
                  src={iconArrows}
                  alt=""
                  width={16}
                  height={16}
                  className="proto-avail-icon-flip"
                />
              </button>
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="proto-avail-step">
            <div className="proto-avail-body proto-avail-body--stack">
              <p className="proto-avail-date-heading">
                {formatDateHeading(selectedDate.month, selectedDate.day)}
              </p>
              <div className="proto-avail-panel proto-avail-panel--fill proto-avail-times">
                <TimeSection
                  label="Morning"
                  slots={MORNING}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                />
                <hr className="proto-avail-rule" />
                <TimeSection
                  label="Afternoon"
                  slots={AFTERNOON}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                />
                <hr className="proto-avail-rule" />
                <TimeSection
                  label="Evening"
                  slots={EVENING}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                />
              </div>
              <div className="proto-avail-banner">
                <img
                  className="proto-avail-banner__icon"
                  src={promoAppointmentIcon}
                  alt=""
                  width={30}
                  height={30}
                />
                <p>Typical appointment takes around 15 minutes</p>
              </div>
            </div>
            <div className="proto-avail-footer">
              <button
                type="button"
                className="proto-avail-btn-secondary"
                onClick={() => setStep("date")}
              >
                <img
                  className="proto-secondary-cta-icon"
                  src={iconArrowsSecondary}
                  alt=""
                  width={16}
                  height={16}
                />
                Back to Date
              </button>
              <button
                type="button"
                className="proto-avail-btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (store) {
                    onBookNow(store, {
                      month: selectedDate.month,
                      day: selectedDate.day,
                      time: selectedTime,
                    });
                  }
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
