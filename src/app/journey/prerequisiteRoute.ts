/**
 * Project-neutral route decision for flows whose destination depends on both
 * authentication and one account-owned prerequisite.
 *
 * Authentication is evaluated first: account data must never be consumed for
 * a guest, even when a project adapter can see persisted prerequisite state.
 */
export type PrerequisiteRouteReason =
  | "authentication-required"
  | "prerequisite-required"
  | "ready";

export interface PrerequisiteRouteDestinations<TDestination> {
  authenticationRequired: TDestination;
  prerequisiteRequired: TDestination;
  ready: TDestination;
}

export interface PrerequisiteRouteInput<TDestination> {
  authenticated: boolean;
  prerequisiteUsable: boolean;
  destinations: PrerequisiteRouteDestinations<TDestination>;
}

export interface PrerequisiteRouteResolution<TDestination> {
  destination: TDestination;
  reason: PrerequisiteRouteReason;
}

export function resolvePrerequisiteRoute<TDestination>(
  input: PrerequisiteRouteInput<TDestination>
): PrerequisiteRouteResolution<TDestination> {
  if (!input.authenticated) {
    return {
      destination: input.destinations.authenticationRequired,
      reason: "authentication-required",
    };
  }

  if (!input.prerequisiteUsable) {
    return {
      destination: input.destinations.prerequisiteRequired,
      reason: "prerequisite-required",
    };
  }

  return {
    destination: input.destinations.ready,
    reason: "ready",
  };
}
