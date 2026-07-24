import type { PersonaDefinition, ProjectDefinition, ProjectId, PersonaId } from "@/projects/types";
import { BOOTS_PHARMACY_PROJECT } from "@/projects/boots-pharmacy";
import { PUMA_PROJECT } from "@/projects/puma";
import { NEWCO_PROJECT } from "@/projects/newco";

export const STUDIO_PROJECTS: ProjectDefinition[] = [
  BOOTS_PHARMACY_PROJECT,
  PUMA_PROJECT,
  NEWCO_PROJECT,
];

const PROJECT_BY_ID = new Map<ProjectId, ProjectDefinition>(
  STUDIO_PROJECTS.map((project) => [project.id, project])
);

export function getProjectContent(projectId: ProjectId) {
  const project = getProjectById(projectId) ?? getDefaultProject();
  return project.content;
}

export function getProjectWire(projectId: ProjectId) {
  return getProjectById(projectId)?.wireComponent;
}
export function getProjectById(projectId: ProjectId): ProjectDefinition | undefined {
  return PROJECT_BY_ID.get(projectId);
}

export function getDefaultProject(): ProjectDefinition {
  return STUDIO_PROJECTS[0]!;
}

export function getPersonaById(
  project: ProjectDefinition,
  personaId: PersonaId
): PersonaDefinition | undefined {
  return project.personas.find((persona) => persona.id === personaId);
}

export function getDefaultPersona(
  project: ProjectDefinition
): PersonaDefinition {
  return (
    getPersonaById(project, project.defaultPersonaId) ?? project.personas[0]!
  );
}
