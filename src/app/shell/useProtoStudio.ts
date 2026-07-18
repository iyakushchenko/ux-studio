import { useCallback, useMemo, useState } from "react";
import { getJourneyForMode } from "@/app/orchestra/journeyUtils";
import {
  PROTO_ORCHESTRA_MODE_OPTIONS,
  readStoredOrchestraMode,
  storeOrchestraMode,
} from "@/app/orchestra/protoOrchestraModes";
import type { ProtoOrchestraModeId } from "@/app/orchestra/types";
import type {
  ProtoPersonaDefinition,
  ProtoPersonaId,
  ProtoProjectDefinition,
  ProtoProjectId,
} from "@/projects/types";
import {
  getDefaultPersona,
  getDefaultProject,
  getPersonaById,
  getProjectById,
  getProjectContent,
  PROTO_PROJECTS,
} from "@/projects/registry";
import { personaDisplayFirstName } from "@/app/shell/personaDisplayName";

const PROJECT_STORAGE_KEY = "proto-studio-project";
const PERSONA_STORAGE_KEY = "proto-studio-persona";

function readStoredProjectId(): ProtoProjectId {
  try {
    const raw = sessionStorage.getItem(PROJECT_STORAGE_KEY);
    if (raw && getProjectById(raw)) return raw;
  } catch {
    /* ignore */
  }
  return getDefaultProject().id;
}

function readStoredPersonaId(projectId: ProtoProjectId): ProtoPersonaId {
  try {
    const raw = sessionStorage.getItem(`${PERSONA_STORAGE_KEY}:${projectId}`);
    const project = getProjectById(projectId);
    if (raw && project && getPersonaById(project, raw)) return raw;
  } catch {
    /* ignore */
  }
  const project = getProjectById(projectId) ?? getDefaultProject();
  return getDefaultPersona(project).id;
}

function storeProjectId(projectId: ProtoProjectId): void {
  try {
    sessionStorage.setItem(PROJECT_STORAGE_KEY, projectId);
  } catch {
    /* ignore */
  }
}

function storePersonaId(projectId: ProtoProjectId, personaId: ProtoPersonaId): void {
  try {
    sessionStorage.setItem(`${PERSONA_STORAGE_KEY}:${projectId}`, personaId);
  } catch {
    /* ignore */
  }
}

export function useProtoStudio() {
  const [projectId, setProjectIdState] = useState<ProtoProjectId>(readStoredProjectId);
  const project = useMemo(
    () => getProjectById(projectId) ?? getDefaultProject(),
    [projectId]
  );
  const content = useMemo(() => getProjectContent(project.id), [project.id]);

  const [personaId, setPersonaIdState] = useState<ProtoPersonaId>(() =>
    readStoredPersonaId(project.id)
  );
  const persona = useMemo(
    () => getPersonaById(project, personaId) ?? getDefaultPersona(project),
    [personaId, project]
  );

  const [modeId, setModeIdState] = useState<ProtoOrchestraModeId>(readStoredOrchestraMode);
  const [beatIndex, setBeatIndex] = useState(0);

  const journey = useMemo(
    () => getJourneyForMode(persona.journeys, modeId),
    [modeId, persona.journeys]
  );

  const modeLabel =
    PROTO_ORCHESTRA_MODE_OPTIONS.find((mode) => mode.id === modeId)?.label ?? "Agentic CJM";

  const setProjectId = useCallback((next: ProtoProjectId) => {
    const nextProject = getProjectById(next);
    if (!nextProject) return;
    setProjectIdState(next);
    storeProjectId(next);
    const nextPersona = getDefaultPersona(nextProject);
    setPersonaIdState(nextPersona.id);
    storePersonaId(next, nextPersona.id);
    setBeatIndex(0);
  }, []);

  const setPersonaId = useCallback(
    (next: ProtoPersonaId) => {
      if (!getPersonaById(project, next)) return;
      setPersonaIdState(next);
      storePersonaId(project.id, next);
      setBeatIndex(0);
    },
    [project]
  );

  const setModeId = useCallback((next: ProtoOrchestraModeId) => {
    setModeIdState(next);
    storeOrchestraMode(next);
    setBeatIndex(0);
  }, []);

  const resetBeatIndex = useCallback(() => {
    setBeatIndex(0);
  }, []);

  return {
    projects: PROTO_PROJECTS,
    projectId: project.id,
    project,
    content,
    playback: project.playback,
    setProjectId,
    personaId: persona.id,
    persona,
    setPersonaId,
    modeId,
    setModeId,
    modeLabel,
    modes: PROTO_ORCHESTRA_MODE_OPTIONS,
    journey,
    beatIndex,
    setBeatIndex,
    resetBeatIndex,
  };
}

export type ProtoStudioState = ReturnType<typeof useProtoStudio>;

export { personaDisplayFirstName } from "@/app/shell/personaDisplayName";

export function createShouldSkipBeat(
  persona: ProtoPersonaDefinition,
  headerLoggedIn: boolean
): (beat: import("@/app/orchestra/types").JourneyBeat | undefined) => boolean {
  const hook = persona.journeyHooks?.shouldSkipBeat;
  if (!hook) return () => false;
  return (beat) => (beat ? hook(beat, { headerLoggedIn }) : false);
}

export function personaSelectOptions(project: ProtoProjectDefinition) {
  return project.personas.map((persona) => ({
    id: persona.id,
    label: personaDisplayFirstName(persona.label),
  }));
}

function titleCaseProjectSlug(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Brand-only label for the collapsed project dropdown trigger. */
function projectTriggerLabel(project: ProtoProjectDefinition): string {
  return titleCaseProjectSlug(project.brand);
}

/** Full project label for the dropdown panel (e.g. Boots - Pharmacy). */
function projectMenuLabel(project: ProtoProjectDefinition): string {
  if (project.subbrand) {
    return `${titleCaseProjectSlug(project.brand)} - ${titleCaseProjectSlug(project.subbrand)}`;
  }
  return project.label;
}

export function projectSelectOptions(projects: ProtoProjectDefinition[]) {
  return projects.map((project) => ({
    id: project.id,
    label: projectMenuLabel(project),
    shortLabel: projectTriggerLabel(project),
  }));
}
