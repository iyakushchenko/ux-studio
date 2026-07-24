import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { OrchestraModeOption, OrchestraModeId } from "@/app/orchestra/types";
import {
  CREATE_NEW_CJM_MODE_ID,
  CREATE_NEW_CJM_OPTION,
  resolveFirstSavedCjmModeId,
} from "@/app/orchestra/orchestraModes";
import { StudioNavStudioSelect } from "@/app/nav/StudioNavStudioSelect";
import { StudioNavDeleteRecordedCjm } from "@/app/nav/StudioNavDeleteRecordedCjm";
import { StudioNavCjmMetadata } from "@/app/nav/StudioNavCjmMetadata";
import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";
import {
  clearStagedRecordingSession,
  getActiveRecordingSession,
  subscribeRecordingSession,
} from "@/app/recording/recordingSession";
import { registerCreateNewCjmSelector } from "@/app/recording/createNewCjmApi";
import { logControlPanel } from "@/app/shell/controlPanelLog";

type Props = {
  modes: OrchestraModeOption[];
  value: OrchestraModeId;
  onChange: (modeId: OrchestraModeId) => void;
  isPlaying?: boolean;
  /** Locks mode switch during cursor / type-in animations. */
  controlsLocked?: boolean;
  /**
   * Idle CREATE NEW CJM selection (Import path). Live REC also reports true
   * **only while REC mode is on** — never leave CREATE NEW selected outside Rec.
   */
  onCreateNewSelectedChange?: (selected: boolean) => void;
  /** Controlled REC mode from scenario deck (guiding UX). */
  recMode?: boolean;
  /** Enter Rec when user picks CREATE NEW (XOR with CJM handled by parent). */
  onRequestRecMode?: (enabled: boolean) => void;
  /** REC locked (CJM on / AIR) — CREATE NEW cannot stick. */
  recModeLocked?: boolean;
  onDeleteMode?: (modeId: OrchestraModeId) => void;
  metadataById?: Readonly<Record<string, CjmOptionMetadata>>;
  /** File-backed project/persona catalog entries; never deletable in-browser. */
  deployedJourneyIds?: readonly string[];
};

function useRecordingSessionLive(): boolean {
  return useSyncExternalStore(
    subscribeRecordingSession,
    () => getActiveRecordingSession() != null,
    () => false
  );
}

export function StudioNavJourneyMenu({
  modes,
  value,
  onChange,
  isPlaying,
  controlsLocked = false,
  onCreateNewSelectedChange,
  recMode = false,
  onRequestRecMode,
  recModeLocked = false,
  onDeleteMode,
  metadataById = {},
  deployedJourneyIds = [],
}: Props) {
  /** REC ● start → live/paused session while Rec deck is open. */
  const recordingLive = useRecordingSessionLive();
  const [idleCreateNew, setIdleCreateNew] = useState(false);
  const priorPickerRef = useRef<{ createNew: boolean } | null>(null);
  const wasLiveRef = useRef(false);
  const lastSavedModeRef = useRef<OrchestraModeId>(value);
  const idleCreateNewRef = useRef(idleCreateNew);
  idleCreateNewRef.current = idleCreateNew;
  const onCreateNewSelectedChangeRef = useRef(onCreateNewSelectedChange);
  onCreateNewSelectedChangeRef.current = onCreateNewSelectedChange;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onRequestRecModeRef = useRef(onRequestRecMode);
  onRequestRecModeRef.current = onRequestRecMode;
  const valueRef = useRef(value);
  valueRef.current = value;
  const modesRef = useRef(modes);
  modesRef.current = modes;
  const recModeRef = useRef(recMode);
  recModeRef.current = recMode;
  const recModeLockedRef = useRef(recModeLocked);
  recModeLockedRef.current = recModeLocked;

  // Imperative CREATE NEW — same path as picker (agent REC arm).
  useEffect(() => {
    registerCreateNewCjmSelector(() => {
      if (recModeLockedRef.current) {
        logControlPanel("studio:create-new-cjm", {
          blocked: true,
          blockReason: "rec-mode-locked",
          source: "imperative",
        });
        return;
      }
      // Freshly entering CREATE NEW (not just re-affirming an already-selected
      // draft) — discard any leftover staged/stopped session so the STEPS
      // counter starts at 0 for the new, empty CJM (no-ops while REC is live).
      const enteringFresh = !createNewSelectedRef.current;
      setIdleCreateNew(true);
      if (enteringFresh) {
        clearStagedRecordingSession();
      }
      logControlPanel("studio:create-new-cjm", {
        autoRecOn: true,
        previousRecMode: recModeRef.current,
        source: "imperative",
      });
      if (!recModeRef.current) {
        onRequestRecModeRef.current?.(true);
      }
    });
    return () => registerCreateNewCjmSelector(null);
  }, []);

  // CREATE NEW only while Rec mode is on (live session alone must not gold-lock
  // the picker after the user leaves Rec).
  // `noRealModes`: when a persona has zero CJMs, CREATE NEW is the only
  // selectable option and the dropdown already shows it via `value` alone
  // (no explicit dropdown pick ever happened, so `idleCreateNew` stays
  // false). Without this, arming REC directly from that default state left
  // `createNewSelected` false until the user re-picked CREATE NEW from the
  // dropdown even though it was already showing as selected (PO, 2026-07-24).
  const noRealModes = modes.length === 0;
  const createNewSelected =
    recMode && (recordingLive || idleCreateNew || noRealModes);
  const createNewSelectedRef = useRef(createNewSelected);
  createNewSelectedRef.current = createNewSelected;

  useEffect(() => {
    onCreateNewSelectedChangeRef.current?.(createNewSelected);
  }, [createNewSelected]);

  // Remember last non–CREATE NEW catalog selection for snap-back.
  useEffect(() => {
    if (!createNewSelected && !isCreateNewLike(value)) {
      lastSavedModeRef.current = value;
    }
  }, [value, createNewSelected]);

  useEffect(() => {
    if (recordingLive && !wasLiveRef.current) {
      priorPickerRef.current = { createNew: idleCreateNewRef.current };
      if (recModeRef.current) {
        setIdleCreateNew(true);
      }
    } else if (!recordingLive && wasLiveRef.current) {
      const prior = priorPickerRef.current;
      priorPickerRef.current = null;
      // After Stop: stay on CREATE NEW only if Rec is still on and user was
      // already on that path; otherwise snap (handled by REC-off effect).
      if (recModeRef.current) {
        setIdleCreateNew(prior?.createNew ?? true);
      } else {
        setIdleCreateNew(false);
      }
    }
    wasLiveRef.current = recordingLive;
  }, [recordingLive]);

  // Rec ON + existing paused/live session → force CREATE NEW surface.
  useEffect(() => {
    if (!recMode || recModeLocked) return;
    if (getActiveRecordingSession() != null) {
      setIdleCreateNew(true);
    }
  }, [recMode, recModeLocked]);

  // Rec OFF → never leave CREATE NEW selected; snap to first-saved rule.
  useEffect(() => {
    if (recMode) return;
    if (!idleCreateNewRef.current && !recordingLive) return;
    setIdleCreateNew(false);
    const snapTo = resolveFirstSavedCjmModeId(
      modesRef.current,
      lastSavedModeRef.current
    );
    if (snapTo && snapTo !== valueRef.current) {
      logControlPanel("studio:cjm-snap-first-saved", {
        from: "create-new-cjm",
        to: snapTo,
        reason: "rec-mode-off",
      });
      onChangeRef.current(snapTo);
    } else if (snapTo) {
      lastSavedModeRef.current = snapTo;
    }
  }, [recMode, recordingLive]);

  const options = useMemo(
    () => [CREATE_NEW_CJM_OPTION, ...modes],
    [modes]
  );

  const menuValue = createNewSelected
    ? CREATE_NEW_CJM_MODE_ID
    : value;

  const handleChange = (id: OrchestraModeId) => {
    if (id === CREATE_NEW_CJM_MODE_ID) {
      if (recModeLocked) {
        logControlPanel("studio:create-new-cjm", {
          blocked: true,
          blockReason: "rec-mode-locked",
        });
        return;
      }
      // Freshly entering CREATE NEW (not just re-affirming an already-selected
      // draft) — discard any leftover staged/stopped session so the STEPS
      // counter starts at 0 for the new, empty CJM (no-ops while REC is live).
      const enteringFresh = !createNewSelected;
      setIdleCreateNew(true);
      if (enteringFresh) {
        clearStagedRecordingSession();
      }
      logControlPanel("studio:create-new-cjm", {
        autoRecOn: true,
        previousRecMode: recMode,
      });
      // Guiding: CREATE NEW always enters the Rec surface.
      if (!recMode) {
        onRequestRecModeRef.current?.(true);
      }
      return;
    }
    const metadata = metadataById[id];
    if (metadata && !metadata.playable) {
      logControlPanel("studio:cjm-preflight-blocked", {
        journeyId: id,
        issues: metadata.issues.map((issue) => issue.code),
        selectionAllowedForInspection: true,
      });
    }
    setIdleCreateNew(false);
    lastSavedModeRef.current = id;
    onChange(id);
  };

  return (
    <StudioNavStudioSelect
      options={options}
      value={menuValue}
      onChange={handleChange}
      ariaLabel="Orchestra mode"
      logAction="studio:orchestra-mode"
      isPlaying={isPlaying}
      controlsLocked={controlsLocked || (recordingLive && recMode)}
      highlightGold={recordingLive && recMode}
      separatorAfterId={CREATE_NEW_CJM_MODE_ID}
      disabledTitle={
        recordingLive && recMode
          ? "CJM picker locked while recording"
          : undefined
      }
      renderOptionMeta={(option) =>
        option.id === CREATE_NEW_CJM_MODE_ID
          ? null
          : metadataById[option.id]?.summary ?? null
      }
      renderOptionAction={(option) => {
        if (option.id === CREATE_NEW_CJM_MODE_ID) return null;
        const metadata = metadataById[option.id];
        const deployed = deployedJourneyIds.includes(option.id);
        return <>
          {metadata ? <StudioNavCjmMetadata metadata={metadata} /> : null}
          <StudioNavDeleteRecordedCjm
              journeyId={option.id}
              label={option.label}
              disabled={deployed || controlsLocked || (recordingLive && recMode)}
              disabledTitle={deployed ? `${option.label} is a deployed project CJM` : "Stop playback or recording before deleting this CJM"}
              onConfirmDelete={() => onDeleteMode?.(option.id)}
            />
        </>;
      }}
    />
  );
}

function isCreateNewLike(id: string): boolean {
  return id === CREATE_NEW_CJM_MODE_ID;
}
