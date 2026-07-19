import { useEffect, useRef } from "react";
import {
  applyStudioScreen,
  isStudioPostAgentResetSyncLocked,
  parseStudioUrl,
  resolveScreenIdFromNav,
  stripEphemeralStudioQuery,
  writeStudioUrl,
  type StudioUrlState,
} from "@/app/shell/studioUrl";
import { captureScreenChange } from "@/app/recording/recordingCapture";

type ScreenRow = { screenId?: string; childIndex: number };

export type StudioUrlSyncOptions = {
  projectId: string;
  personaId?: string;
  modeId?: string;
  /** CJM playback switch — synced to `&cjm=on|off`. */
  journeyMode?: boolean;
  /** Blocking lightbox id (e.g. choose-pharmacy) — synced to `&modal=`. */
  modalId?: string;
  screens: ReadonlyArray<ScreenRow>;
  current: number;
  hubOpen: boolean;
  setProjectId: (id: string) => void;
  setPersonaId?: (id: string) => void;
  setModeId?: (id: string) => void;
  setJourneyMode?: (enabled: boolean) => void;
  setCurrent: (index: number) => void;
  setHubOpen: (open: boolean) => void;
  /** Open/close concept lightbox from URL / popstate / replay. */
  applyModal?: (modalId: string | undefined) => void;
};

/**
 * Keeps the address bar aligned with studio nav + modal + restores deep links.
 * URL wins on first paint when `screen` / `project` / `modal` / `cjm` / `experience` present;
 * then replaceState sync. Boot / popstate share `applyStudioScreen` with recording replay.
 */
export function useStudioUrlSync(options: StudioUrlSyncOptions): void {
  const {
    projectId,
    personaId,
    modeId,
    journeyMode,
    modalId,
    screens,
    current,
    hubOpen,
    setProjectId,
    setPersonaId,
    setModeId,
    setJourneyMode,
    setCurrent,
    setHubOpen,
    applyModal,
  } = options;

  const applyingUrlRef = useRef(false);
  const lastHrefRef = useRef("");
  const lastModalRef = useRef<string | undefined>(undefined);
  const bootDoneRef = useRef(false);
  const applyModalRef = useRef(applyModal);
  applyModalRef.current = applyModal;
  const setJourneyModeRef = useRef(setJourneyMode);
  setJourneyModeRef.current = setJourneyMode;

  // Boot: strip leftovers, apply deep link once.
  useEffect(() => {
    if (bootDoneRef.current) return;
    bootDoneRef.current = true;
    stripEphemeralStudioQuery();

    const parsed = parseStudioUrl();
    applyingUrlRef.current = true;
    try {
      applyStudioScreen({
        ...parsed,
        screens,
        currentProjectId: projectId,
        setProjectId,
        setPersonaId,
        setModeId,
        setJourneyMode: (enabled) => setJourneyModeRef.current?.(enabled),
        setCurrent,
        setHubOpen,
        applyModal: (id) => applyModalRef.current?.(id),
        syncUrl: false,
      });
      lastModalRef.current = parsed.modalId;
    } finally {
      // Defer clear so the write effect does not fight the apply.
      queueMicrotask(() => {
        applyingUrlRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  // Reflect nav + modal + cjm/experience → address bar + recording screen markers.
  useEffect(() => {
    if (applyingUrlRef.current) return;
    // Post-agent clean slate owns the bar until reload / lock expiry.
    if (isStudioPostAgentResetSyncLocked()) return;
    const screenId = resolveScreenIdFromNav({ hubOpen, current, screens });
    const state: StudioUrlState = {
      projectId,
      screenId,
      personaId,
      modeId: modeId as StudioUrlState["modeId"],
      cjm: journeyMode,
      modalId,
    };
    const modalChanged = lastModalRef.current !== modalId;
    lastModalRef.current = modalId;
    const search = writeStudioUrl(state, { push: modalChanged && Boolean(lastHrefRef.current) });
    const href = search || "?";
    if (href !== lastHrefRef.current) {
      const prev = lastHrefRef.current;
      lastHrefRef.current = href;
      if (prev) {
        captureScreenChange({
          screenId,
          projectId,
          studioUrl: search || undefined,
        });
      }
    }
  }, [projectId, personaId, modeId, journeyMode, modalId, screens, current, hubOpen]);

  // Back/forward.
  useEffect(() => {
    const onPopState = () => {
      stripEphemeralStudioQuery();
      const parsed = parseStudioUrl();
      applyingUrlRef.current = true;
      try {
        applyStudioScreen({
          ...parsed,
          screens,
          currentProjectId: projectId,
          setProjectId,
          setPersonaId,
          setModeId,
          setJourneyMode: (enabled) => setJourneyModeRef.current?.(enabled),
          setCurrent,
          setHubOpen,
          applyModal: (id) => applyModalRef.current?.(id),
          syncUrl: false,
        });
        lastModalRef.current = parsed.modalId;
        lastHrefRef.current = window.location.search || "?";
      } finally {
        queueMicrotask(() => {
          applyingUrlRef.current = false;
        });
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [
    projectId,
    screens,
    setProjectId,
    setPersonaId,
    setModeId,
    setCurrent,
    setHubOpen,
  ]);
}
