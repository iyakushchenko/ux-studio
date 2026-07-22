import { describe, expect, it } from "vitest";
import {
  resolvePrerequisiteRoute,
  type PrerequisiteRouteReason,
} from "@/app/journey/prerequisiteRoute";

describe("resolvePrerequisiteRoute", () => {
  const destinations = {
    authenticationRequired: "authenticate",
    prerequisiteRequired: "collect-prerequisite",
    ready: "continue",
  } as const;

  it.each<{
    authenticated: boolean;
    prerequisiteUsable: boolean;
    destination: (typeof destinations)[keyof typeof destinations];
    reason: PrerequisiteRouteReason;
  }>([
    {
      authenticated: false,
      prerequisiteUsable: false,
      destination: "authenticate",
      reason: "authentication-required",
    },
    {
      authenticated: false,
      prerequisiteUsable: true,
      destination: "authenticate",
      reason: "authentication-required",
    },
    {
      authenticated: true,
      prerequisiteUsable: false,
      destination: "collect-prerequisite",
      reason: "prerequisite-required",
    },
    {
      authenticated: true,
      prerequisiteUsable: true,
      destination: "continue",
      reason: "ready",
    },
  ])(
    "routes authenticated=$authenticated prerequisiteUsable=$prerequisiteUsable to $destination",
    ({ authenticated, prerequisiteUsable, destination, reason }) => {
      expect(
        resolvePrerequisiteRoute({
          authenticated,
          prerequisiteUsable,
          destinations,
        })
      ).toEqual({ destination, reason });
    }
  );

  it("preserves an opaque project destination without engine coupling", () => {
    const ready = { screenId: "project-booking-ready", projectData: 42 };

    const resolution = resolvePrerequisiteRoute({
      authenticated: true,
      prerequisiteUsable: true,
      destinations: {
        authenticationRequired: { screenId: "project-auth" },
        prerequisiteRequired: { screenId: "project-prerequisite" },
        ready,
      },
    });

    expect(resolution.destination).toBe(ready);
    expect(resolution.reason).toBe("ready");
  });
});
