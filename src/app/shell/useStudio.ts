import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { getJourneyForMode } from "@/app/orchestra/journeyUtils";
import {
  getImportedJourneysSnapshot,
  resolveRuntimeJourneys,
  subscribeImportedJourneys,
} from "@/app/journey/journeyRuntimeStore";
import {
  ORCHESTRA_MODE_OPTIONS,
  readStoredOrchestraMode,
  storeOrchestraMode,
} from "@/app/orchestra/orchestraModes";
import type { OrchestraModeId } from "@/app/orchestra/types";
import type {
  PersonaDefinition,
  PersonaId,
  ProjectDefinition,
  ProjectId,
} from "@/projects/types";
import {
  getDefaultPersona,
  getDefaultProject,
  getPersonaById,
  getProjectById,
  getProjectContent,
  STUDIO_PROJECTS,
} from "@/projects/registry";
import { personaDisplayFirstName } from "@/app/shell/personaDisplayName";
import { parseStudioUrl } from "@/app/shell/studioUrl";

const PROJECT_STORAGE_KEY = "studio-project";
const PERSONA_STORAGE_KEY = "studio-persona";

function readStoredProjectId(): ProjectId {
  const fromUrl = parseStudioUrl().projectId;
  if (fromUrl && getProjectById(fromUrl)) return fromUrl;
  try {
    const raw = sessionStorage.getItem(PROJECT_STORAGE_KEY);
    if (raw && getProjectById(raw)) return raw;
  } catch {
    /* ignore */
  }
  return getDefaultProject().id;
}

function readStoredPersonaId(projectId: ProjectId): PersonaId {
  const fromUrl = parseStudioUrl().personaId;
  const project = getProjectById(projectId) ?? getDefaultProject();
  if (fromUrl && getPersonaById(project, fromUrl)) return fromUrl;
  try {
    const raw = sessionStorage.getItem(`${PERSONA_STORAGE_KEY}:${projectId}`);
    if (raw && getPersonaById(project, raw)) return raw;
  } catch {
    /* ignore */
  }
  return getDefaultPersona(project).id;
}

function storeProjectId(projectId: ProjectId): void {
  try {
    sessionStorage.setItem(PROJECT_STORAGE_KEY, projectId);
  } catch {
    /* ignore */
  }
}

function storePersonaId(projectId: ProjectId, personaId: PersonaId): void {
  try {
    sessionStorage.setItem(`${PERSONA_STORAGE_KEY}:${projectId}`, personaId);
  } catch {
    /* ignore */
  }
}

export function useStudio() {
  const [projectId, setProjectIdState] = useState<ProjectId>(readStoredProjectId);
  const project = useMemo(
    () => getProjectById(projectId) ?? getDefaultProject(),
    [projectId]
  );
  const content = useMemo(() => getProjectContent(project.id), [project.id]);

  const [personaId, setPersonaIdState] = useState<PersonaId>(() =>
    readStoredPersonaId(project.id)
  );
  const persona = useMemo(
    () => getPersonaById(project, personaId) ?? getDefaultPersona(project),
    [personaId, project]
  );

  const importVersion = useSyncExternalStore(
    subscribeImportedJourneys,
    getImportedJourneysSnapshot,
    getImportedJourneysSnapshot
  );

  const journeys = useMemo(
    () => resolveRuntimeJourneys(persona.journeys),
    [persona.journeys, importVersion]
  );

  const [modeId, setModeIdState] = useState<OrchestraModeId>(() => {
    const fromUrl = parseStudioUrl().modeId;
    if (fromUrl === "agentic-cjm" || fromUrl === "traditional-cjm") return fromUrl;
    return readStoredOrchestraMode();
  });
  const [beatIndex, setBeatIndex] = useState(0);

  const journey = useMemo(
    () => getJourneyForMode(journeys, modeId),
    [modeId, journeys]
  );

  const modeLabel =
    ORCHESTRA_MODE_OPTIONS.find((mode) => mode.id === modeId)?.label ?? "Agentic CJM";

  const setProjectId = useCallback((next: ProjectId) => {
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
    (next: PersonaId) => {
      if (!getPersonaById(project, next)) return;
      setPersonaIdState(next);
      storePersonaId(project.id, next);
      setBeatIndex(0);
    },
    [project]
  );

  const setModeId = useCallback((next: OrchestraModeId) => {
    setModeIdState(next);
    storeOrchestraMode(next);
    setBeatIndex(0);
  }, []);

  const resetBeatIndex = useCallback(() => {
    setBeatIndex(0);
  }, []);

  return {
    projects: STUDIO_PROJECTS,
    projectId: project.id,
    project,
    content,
    playback: project.playback,
    setProjectId,
    personaId: persona.id,
    persona,
    setPersonaId,
    journeys,
    modeId,
    setModeId,
    modeLabel,
    modes: ORCHESTRA_MODE_OPTIONS,
    journey,
    beatIndex,
    setBeatIndex,
    resetBeatIndex,
  };
}

export type StudioState = ReturnType<typeof useStudio>;

export { personaDisplayFirstName } from "@/app/shell/personaDisplayName";

export function createShouldSkipBeat(
  persona: PersonaDefinition,
  headerLoggedIn: boolean
): (beat: import("@/app/orchestra/types").JourneyBeat | undefined) => boolean {
  const hook = persona.journeyHooks?.shouldSkipBeat;
  if (!hook) return () => false;
  return (beat) => (beat ? hook(beat, { headerLoggedIn }) : false);
}

export function personaSelectOptions(project: ProjectDefinition) {
  return project.personas.map((persona) => ({
    id: persona.id,
    label: personaDisplayFirstName(persona.label),
  }));
}

function titleCaseProjectSlug(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Brand-only label for the collapsed project dropdown trigger. */
function projectTriggerLabel(project: ProjectDefinition): string {
  return titleCaseProjectSlug(project.brand);
}

/** Full project label for the dropdown panel (e.g. Boots - Pharmacy). */
function projectMenuLabel(project: ProjectDefinition): string {
  if (project.subbrand) {
    return `${titleCaseProjectSlug(project.brand)} - ${titleCaseProjectSlug(project.subbrand)}`;
  }
  return project.label;
}

export function projectSelectOptions(projects: ProjectDefinition[]) {
  return projects.map((project) => ({
    id: project.id,
    label: projectMenuLabel(project),
    shortLabel: projectTriggerLabel(project),
  }));
}
