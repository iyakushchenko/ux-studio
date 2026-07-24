export const HUB_LABEL = "Hub";

export const PROJECT_SCREENS = [
  { label: "Home", childIndex: 1, screenId: "home" },
] as const;

export type ProjectScreen = (typeof PROJECT_SCREENS)[number];

export function studioNavIndex(hubOpen: boolean, current: number): number {
  return hubOpen ? 0 : current + 1;
}

export function studioTabToIndex(tab: number): number {
  return Math.max(0, Math.min(PROJECT_SCREENS.length - 1, tab - 1));
}

export function studioScreenAtTab(tab: number): ProjectScreen | undefined {
  return PROJECT_SCREENS[studioTabToIndex(tab)];
}

export const SCENARIO_SCREENS: never[] = [];
