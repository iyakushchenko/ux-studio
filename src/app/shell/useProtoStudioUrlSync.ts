import { useEffect, useRef } from "react";
import {
  applyStudioScreen,
  parseStudioUrl,
  resolveScreenIdFromNav,
  stripEphemeralStudioQuery,
  writeStudioUrl,
  type StudioUrlState,
} from "@/app/shell/protoStudioUrl";
import { captureScreenChange } from "@/app/recording/protoRecordingCapture";

type ScreenRow = { screenId?: string; childIndex: number };

export type ProtoStudioUrlSyncOptions = {
  projectId: string;
  personaId?: string;
  modeId?: string;
  screens: ReadonlyArray<ScreenRow>;
  current: number;
  hubOpen: boolean;
  setProjectId: (id: string) => void;
  setPersonaId?: (id: string) => void;
  setModeId?: (id: string) => void;
  setCurrent: (index: number) => void;
  setHubOpen: (open: boolean) => void;
};

/**
 * Keeps the address bar aligned with studio nav + restores deep links.
 * URL wins on first paint when `screen` / `project` present; then replaceState sync.
 * Boot / popstate share `applyStudioScreen` with recording replay.
 */
export function useProtoStudioUrlSync(options: ProtoStudioUrlSyncOptions): void {
  const {
    projectId,
    personaId,
    modeId,
    screens,
    current,
    hubOpen,
    setProjectId,
    setPersonaId,
    setModeId,
    setCurrent,
    setHubOpen,
  } = options;

  const applyingUrlRef = useRef(false);
  const lastHrefRef = useRef("");
  const bootDoneRef = useRef(false);

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
        setCurrent,
        setHubOpen,
        syncUrl: false,
      });
    } finally {
      // Defer clear so the write effect does not fight the apply.
      queueMicrotask(() => {
        applyingUrlRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  // Reflect nav → address bar + recording screen markers.
  useEffect(() => {
    if (applyingUrlRef.current) return;
    const screenId = resolveScreenIdFromNav({ hubOpen, current, screens });
    const state: StudioUrlState = {
      projectId,
      screenId,
      personaId,
      modeId,
    };
    const search = writeStudioUrl(state);
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
  }, [projectId, personaId, modeId, screens, current, hubOpen]);

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
          setCurrent,
          setHubOpen,
          syncUrl: false,
        });
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
