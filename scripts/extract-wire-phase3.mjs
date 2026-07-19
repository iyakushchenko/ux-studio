import fs from "fs";

const lines = fs.readFileSync("src/app/App.tsx", "utf8").split(/\r?\n/);
const helpers = lines
  .slice(99, 818)
  .filter((line) => !line.includes('const PROTO_NAV_KEY'))
  .join("\n");
let componentBody = lines.slice(836, 4753).join("\n");

const importBlock = `import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, type MutableRefObject } from "react";
import locationsMapChosen from "@/assets/locations-map-chosen.png";
import bootsAdvantageCard from "@/assets/boots-advantage-card.png";
import AvailabilityTool, {
  TODAY_TOOLTIP,
  type AvailOpenIntent,
  type AvailStep,
  type ChosenBookingSlot,
} from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import VaccinePickerPopup from "@/projects/boots-pharmacy/popups/VaccinePickerPopup";
import RecipientPickerPopup, {
  recipientModeLabel,
  type RecipientMode,
} from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import LoginPopup from "@/projects/boots-pharmacy/popups/LoginPopup";
import QuickViewPopup from "@/projects/boots-pharmacy/popups/QuickViewPopup";
import {
  collectSitePilotChatScenarioFrames,
  ensureSitePilotChatComposerDock,
  findSitePilotChatComposerCard,
  teardownSitePilotChatComposerDock,
} from "@/projects/boots-pharmacy/dom/sitePilotChatScenario";
import {
  abortSitePilotChatPlaybackPrelude,
  runSitePilotChatBeforeReveal,
  runSitePilotChatScenarioFinale,
  stripSitePilotChatDemoCursors,
} from "@/projects/boots-pharmacy/playback/sitePilotChat";
import { AGENTIC_HOME_DEMO_QUERY } from "@/projects/boots-pharmacy/playback/sitePilotHome";
import {
  beginSitePilotChatThinking,
  endSitePilotChatThinking,
  isSitePilotChatPlaybackThinking,
  isSitePilotChatSendThinking,
  isSitePilotChatThinking,
  setSitePilotChatSendThinkingMode,
  syncSitePilotChatThinkingHint,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import { resolveAvailStoreId, getDemoChosenLocation } from "@/projects/boots-pharmacy/data/availStores";
import iconArrowsSecondary from "@/assets/avail/arrows-secondary.svg";
import type { VaccineItem } from "@/projects/boots-pharmacy/data/vaccineList";
import { setupChosenPageMap } from "@/projects/boots-pharmacy/dom/locationsMap";
import {
  arePlpFiltersActive,
  ensurePlpFiltersDefault,
  ensurePlpTileTitleLinks,
  PLP_FILTERS_CHANGE_EVENT,
  resetPlpFilters,
  syncPlpListingFilters,
} from "@/projects/boots-pharmacy/data/plpListing";
import { initSearchFields, syncFigmaSearchClearIcons } from "@/projects/boots-pharmacy/dom/locationSearch";
import { setupFooters } from "@/projects/boots-pharmacy/chrome/footerMount";
import {
  setupHeader,
  syncHeaderLogin,
  syncMaAccountAvatars,
  setHeaderLoggedIn,
  isHeaderLoggedIn,
  toggleWishlist,
  isInWishlist,
  applyWishlistHeartVisual,
  syncChickenpoxWishlistHearts,
  PDP_WISHLIST_ID,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import { wireIconHits } from "@/projects/boots-pharmacy/dom/iconHitWire";
import { useScrollFill } from "@/app/scenario/useScrollFill";
import {
  boosterDoseSummaryLabel,
  PDP_CHECKBOX_LABEL,
  PDP_PRICE_WITH_BOOSTER,
  PDP_PRICE_WITHOUT_BOOSTER,
  syncAccountOrderSummary,
  syncConfirmationOrderSummary,
} from "@/projects/boots-pharmacy/data/orderPricing";
import {
  ensureCheckboxRow,
  handleProtoInputClick,
  initProtoInputControls,
  markBoosterCheckboxRow,
} from "@/projects/boots-pharmacy/dom/inputControls";
import {
  getSelectedAppointmentId,
  APPOINTMENT_PILOT_QUERY,
  syncAppointmentDetails,
  syncAppointmentHistory,
  wireAppointmentDetailsBreadcrumbs,
} from "@/projects/boots-pharmacy/data/appointments";
import type { ProjectShellBridge, ProjectWireApi } from "@/projects/types";

`;

componentBody = componentBody.replace(
  /^export default function App\(\) \{/,
  `export type BootsPharmacyProjectViewProps = {
  bridge: ProjectShellBridge;
  apiRef?: MutableRefObject<ProjectWireApi | null>;
};

export function BootsPharmacyProjectView({ bridge, apiRef }: BootsPharmacyProjectViewProps) {
  const {
    current,
    setCurrent,
    hubOpen,
    setHubOpen,
    studio,
    prototypeScrollElRef,
    hubScrollElRef,
    appContentRef,
    tabsScrollRef,
    tabBtnRefs,
    go,
    openHub,
    navPlaybackLockedRef,
    goRef,
    currentRef,
    studioNavKey,
    orchestra,
  } = bridge;

  const {
    content: projectContent,
    journey: activeJourney,
    beatIndex: journeyBeatIndex,
    setBeatIndex: setJourneyBeatIndex,
  } = studio;

  const {
    activeScreenScenario,
    scenarioPlayback,
    transport,
    journeyBeatIndexRef,
    setJourneyBeatIndexRef,
    activeJourneyRef,
    openAvailabilityToolRef,
    closeAvailabilityToolRef,
    screenFadeChildRef,
  } = orchestra;

  const {
    PROJECT_SCREENS: SCREENS,
    HUB_LABEL,
    SCENARIO_SCREENS,
    INDEX_APPOINTMENT_DETAILS,
    INDEX_APPOINTMENT_HISTORY,
    INDEX_PLP,
    studioTabToIndex,
    ProjectFrame,
    HubViewport,
  } = projectContent;`
);

const removals = [
  /  const studio = useStudio\(\);[\s\S]*?  \} = studio;\n\n/,
  /  const \{\n    PROJECT_SCREENS: SCREENS,[\s\S]*?  \} = projectContent;\n\n/,
  /  const journeyRuntime = useMemo[\s\S]*?  \);\n\n/,
  /  const activeScreenScenario = useMemo[\s\S]*?  \);\n\n/,
  /  const journeyBeatIndexRef = useRef[\s\S]*?activeJourneyRef\.current = activeJourney;\n/,
  /  const scenarioIsPlayingRef = useRef[\s\S]*?resumeJourneyPlayRef\.current[\s\S]*?;\n\n/,
  /  const collectScenarioFrames = useCallback[\s\S]*?  \);\n\n/,
  /  const sitePilotChatPlaybackHooks = useMemo[\s\S]*?  \);\n\n/,
  /  const scenarioPlayback = useScenarioPlayback\([\s\S]*?  \);\n\n/,
  /  const headerLoggedIn = loggedInFlag \|\| isHeaderLoggedIn\(\);\n\n/,
  /  const shouldSkipBeat = useMemo[\s\S]*?  \);\n\n/,
  /  const journeyPlayback = useJourneyPlayback\([\s\S]*?  \);\n\n/,
  /  const transport = journeyPlayback;\n  const navPlaybackLocked[\s\S]*?navPlaybackLockedRef\.current = navPlaybackLocked;\n\n/,
  /  const chatFramesForPlaylist[\s\S]*?;\n\n/,
  /  const studioPlaylist = useMemo[\s\S]*?  \);\n\n/,
  /  const studioTouchpoint = useMemo[\s\S]*?  \);\n\n/,
  /  const studioProgress = useMemo[\s\S]*?  \);\n\n/,
  /  const resetStudioPlayback = useCallback[\s\S]*?  \);\n\n/,
  /  const handleOrchestraModeChange = useCallback[\s\S]*?  \);\n\n/,
  /  const handleStudioProjectChange = useCallback[\s\S]*?  \);\n\n/,
  /  const handleStudioPersonaChange = useCallback[\s\S]*?  \);\n\n/,
  /  const showOrchestraControls = orchestraShowControls\([\s\S]*?\);\n\n/,
  /  const resetToEndRef = useRef[\s\S]*?availabilityWasOpenRef = useRef\(false\);\n\n/,
  /  \/\/ Closing Availability after frame 9[\s\S]*?\n  \]\);\n\n/,
  /  \/\/ Frame 1 ambient thinking hint[\s\S]*?\n  \]\);\n\n/,
  /  \/\/ Frame 1 — thread is short[\s\S]*?\n  \]\);\n\n/,
  /  \/\*\* Hide Reset when page states[\s\S]*?    !transport\.isDirty;\n\n/,
  /  \/\/ Remember global nav tab[\s\S]*?  \}, \[current, hubOpen\]\);\n\n/,
  /  const \[current, setCurrent\] = useState\(readInitialNavIndex\);\n/,
  /  const \[hubOpen, setHubOpen\] = useState\([\s\S]*?\);\n/,
  /  const hubScrollElRef = useRef<HTMLDivElement>\(null\);\n/,
  /  const prototypeScrollElRef = useRef<HTMLDivElement>\(null\);\n/,
  /  const appContentRef = useRef<HTMLDivElement>\(null\);\n/,
  /  const tabsScrollRef = useRef<HTMLDivElement>\(null\);\n/,
  /  const tabBtnRefs = useRef<\(HTMLButtonElement \| null\)\[\]>\(\[\]\);\n/,
  /  const goRef = useRef<\(i: number\) => void>\(\(\) => \{\}\);\n/,
  /  const openAvailabilityToolRef = useRef\(openAvailabilityTool\);\n  openAvailabilityToolRef\.current = openAvailabilityTool;\n/,
  /  const closeAvailabilityToolRef = useRef\(closeAvailabilityTool\);\n  closeAvailabilityToolRef\.current = closeAvailabilityTool;\n/,
];

for (const re of removals) {
  componentBody = componentBody.replace(re, "");
}

componentBody = componentBody.replace(/PROTO_NAV_KEY/g, "studioNavKey");

// Wire assigns availability tool callbacks to orchestra refs owned by App shell.
componentBody = componentBody.replace(
  /  const closeAvailabilityTool = \(\) => setAvailabilityOpen\(false\);\n/,
  `  const closeAvailabilityTool = () => setAvailabilityOpen(false);
  openAvailabilityToolRef.current = openAvailabilityTool;
  closeAvailabilityToolRef.current = closeAvailabilityTool;
`
);

componentBody = componentBody.replace(
  /  const go = \(i: number\) => \{[\s\S]*?  goRef\.current = go;\n\n/,
  "  goRef.current = go;\n\n"
);
componentBody = componentBody.replace(
  /  const openHub = \(\) => \{[\s\S]*?  \};\n\n/,
  ""
);

componentBody = componentBody.replace(
  /  return \(\n    <div\n      className="studio-app-root[\s\S]*?<StudioNavPanel[\s\S]*?\/>\n\n      <div/,
  "  return (\n    <>\n      <style>{dynamicCSS}</style>\n      <div"
);

componentBody = componentBody.replace(
  /      <style>\{dynamicCSS\}<\/style>\n\n      <div/,
  "      <div"
);

componentBody = componentBody.replace(/\n    <\/div>\n  \);\n\}$/, "\n    </>\n  );\n}");

const apiSync = `
  const headerLoggedIn = loggedInFlag || isHeaderLoggedIn();

  const wirePristine =
    !availabilityOpen &&
    !vaccinePickerOpen &&
    !recipientPickerOpen &&
    !quickViewOpen &&
    chosenLocation === null &&
    !homeQueryDirty &&
    !chatComposerDirty &&
    !plpFiltersDirty;

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      availabilityOpen,
      availActiveStep,
      availIntent,
      vaccinePickerOpen,
      recipientPickerOpen,
      loginPopupOpen,
      quickViewOpen,
      loggedInFlag,
      headerLoggedIn,
      chosenLocation,
      homeQueryDirty,
      chatComposerDirty,
      plpFiltersDirty,
      wirePristine,
      closeAllPopups,
      saveHubScroll,
      savePrototypeScroll,
      resetPrototypeScroll,
      resetPrototype,
      openAvailabilityTool,
      closeAvailabilityTool,
      handleAvailabilityBookNow,
      handleAvailabilityStepChange,
      activeChildIndex,
      popupOnScreen,
      childIndex,
      label,
      navLabel,
      isViewportLocked,
      isScreen1,
      isScreenChat,
      shouldFadeActiveScreen,
      dynamicCSS,
    };
  });
`;

componentBody = componentBody.replace(
  /  const dynamicCSS = `[\s\S]*?  `;\n\n  return \(/,
  (match) => match.replace(/\n\n  return \($/, `\n${apiSync}\n  return (`)
);

const out = importBlock + "\n" + helpers + "\n\n" + componentBody;
fs.mkdirSync("src/projects/boots-pharmacy/wire", { recursive: true });
fs.writeFileSync("src/projects/boots-pharmacy/wire/BootsPharmacyProjectView.tsx", out);
console.log("Wrote wire file, lines:", out.split("\n").length);
