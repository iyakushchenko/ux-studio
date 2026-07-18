import type { ProtoPersonaDefinition, ProtoProjectDefinition, ProtoProjectId, ProtoPersonaId } from "@/projects/types";
import { BOOTS_PHARMACY_PROJECT } from "@/projects/boots-pharmacy";
import { PUMA_PROJECT } from "@/projects/puma";
import * as bootsPharmacyContent from "@/projects/boots-pharmacy/content";
import * as pumaContent from "@/projects/puma/content";

export const PROTO_PROJECTS: ProtoProjectDefinition[] = [
  BOOTS_PHARMACY_PROJECT,
  PUMA_PROJECT,
];

const PROJECT_BY_ID = new Map<ProtoProjectId, ProtoProjectDefinition>(
  PROTO_PROJECTS.map((project) => [project.id, project])
);

const PROJECT_CONTENT_BY_ID: Record<ProtoProjectId, typeof bootsPharmacyContent | typeof pumaContent> = {
  [BOOTS_PHARMACY_PROJECT.id]: bootsPharmacyContent,
  [PUMA_PROJECT.id]: pumaContent,
};

export function getProjectContent(projectId: ProtoProjectId) {
  const project = getProjectById(projectId) ?? getDefaultProject();
  return PROJECT_CONTENT_BY_ID[project.id] ?? bootsPharmacyContent;
}

export function getProjectWire(projectId: ProtoProjectId) {
  return getProjectById(projectId)?.wireComponent;
}
export function getProjectById(projectId: ProtoProjectId): ProtoProjectDefinition | undefined {
  return PROJECT_BY_ID.get(projectId);
}

export function getDefaultProject(): ProtoProjectDefinition {
  return PROTO_PROJECTS[0]!;
}

export function getPersonaById(
  project: ProtoProjectDefinition,
  personaId: ProtoPersonaId
): ProtoPersonaDefinition | undefined {
  return project.personas.find((persona) => persona.id === personaId);
}

export function getDefaultPersona(
  project: ProtoProjectDefinition
): ProtoPersonaDefinition {
  return (
    getPersonaById(project, project.defaultPersonaId) ?? project.personas[0]!
  );
}
