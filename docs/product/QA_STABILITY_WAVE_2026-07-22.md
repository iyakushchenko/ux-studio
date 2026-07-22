# QA stability wave — lifecycle, routing, frame alignment

**Status:** In progress · **Owner:** Arch · **Proof:** Quinn + Uma

## Outcome

Make the QA tool catch state regressions before an agent spends tokens investigating them. The engine must fail fast when session ownership leaks, prerequisites route to the wrong page, or playback chrome and the rendered product disagree.

## Contracts

1. **QA lifecycle:** a terminal RESULT seal belongs only to its completed session. Fresh Manual/Observe/Agent sessions clear stale seals, latches and ghost chrome; pause/resume and handoff preserve only explicitly allowed context.
2. **Prerequisite routing:** projects provide authentication and prerequisite truth; the engine resolves the first unsatisfied destination without project IDs or page assumptions.
3. **Frame alignment:** after transitions settle, actual address-bar screen, rendered screen, active tab, beat, touchpoint and counter must describe one state. A mismatch raises the existing blocking playback diagnostic and stops autonomous execution.

## Acceptance

- Playback finale → Close → Manual → CAPTURE accepts and displays the first interaction.
- Authenticated + usable prerequisite bypasses completed prerequisite pages; missing/invalid prerequisite fails safe to its collection page.
- Recorded journeys retain explicit captured beats unless they opt into dynamic eligibility.
- Transient URL synchronization within one animation frame is tolerated; a settled mismatch is not.
- Autonomous suites stop on the first lifecycle, route or alignment failure and preserve compact evidence.
