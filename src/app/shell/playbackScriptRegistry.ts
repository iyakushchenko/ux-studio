import type {
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  TabScriptId,
} from "@/app/orchestra/types";
import type { PlaybackScriptKind } from "@/app/shell/protoPlaybackDiagnostic";

export type PlaybackScriptSource = {
  file: string;
  symbol: string;
};

const TRADITIONAL = "src/projects/boots-pharmacy/playback/traditional.ts";
const AVAILABILITY = "src/projects/boots-pharmacy/playback/availability.ts";
const BOOK = "src/projects/boots-pharmacy/playback/book.ts";
const HOME = "src/projects/boots-pharmacy/playback/sitePilotHome.ts";

const TAB_SCRIPTS: Record<TabScriptId, PlaybackScriptSource> = {
  "plp-open-pdp": { file: TRADITIONAL, symbol: "runPlpOpenPdp" },
  "pdp-book-now": { file: TRADITIONAL, symbol: "runPdpBookNow" },
  "login-sign-in": { file: TRADITIONAL, symbol: "runLoginSignIn" },
  "book-location-pick": { file: TRADITIONAL, symbol: "runBookLocationPick" },
  "confirmation-open-appointments": {
    file: TRADITIONAL,
    symbol: "runConfirmationOpenAppointments",
  },
  "history-view-details": { file: TRADITIONAL, symbol: "runHistoryViewDetails" },
};

const AVAIL_SCRIPTS: Record<AvailabilityScriptId, PlaybackScriptSource> = {
  "select-location": { file: AVAILABILITY, symbol: "runSelectLocation" },
  "continue-from-date": { file: AVAILABILITY, symbol: "runContinueFromDate" },
  "select-time-slot": { file: AVAILABILITY, symbol: "runSelectTimeSlot" },
  "book-now": { file: AVAILABILITY, symbol: "runBookNow" },
};

const BOOK_SCRIPTS: Record<BookScriptId, PlaybackScriptSource> = {
  "select-book-date": { file: BOOK, symbol: "runSelectBookDate" },
  "select-book-time": { file: BOOK, symbol: "runSelectBookTime" },
  "reserve-appointment": { file: BOOK, symbol: "runReserveAppointment" },
};

const HOME_SCRIPTS: Record<HomeScriptId, PlaybackScriptSource> = {
  "sarah-query-submit": { file: HOME, symbol: "runSitePilotHomeScript" },
};

export function resolvePlaybackScriptSource(
  kind: PlaybackScriptKind | undefined,
  scriptId: string | undefined
): PlaybackScriptSource | undefined {
  if (!kind || !scriptId) return undefined;
  switch (kind) {
    case "tab":
      return TAB_SCRIPTS[scriptId as TabScriptId];
    case "avail":
      return AVAIL_SCRIPTS[scriptId as AvailabilityScriptId];
    case "book":
      return BOOK_SCRIPTS[scriptId as BookScriptId];
    case "home":
      return HOME_SCRIPTS[scriptId as HomeScriptId];
    default:
      return undefined;
  }
}

export function formatPlaybackScriptSource(
  kind: PlaybackScriptKind | undefined,
  scriptId: string | undefined
): string | undefined {
  const source = resolvePlaybackScriptSource(kind, scriptId);
  if (!source) return undefined;
  return `${source.file} → ${source.symbol}()`;
}
