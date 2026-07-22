# FE/UI/UX audit — Traditional saved-location route — 2026-07-22

## Result: PROVEN

Authenticated Sarah now bypasses both prerequisite beats already satisfied by her account: Login and Choose location. PDP Book now and post-login continuation commit directly to Book Step 2 while hydrating the saved Covent Garden location. Guests and authenticated users without a usable saved store retain Step 1.

## Interaction matrix

| State | Result |
|---|---|
| Signed in + usable saved location | PDP → Book Step 2; Login and Step 1 absent from playable timeline |
| Signed out | Login retained |
| Signed in + no usable saved location | Book Step 1 retained |
| Direct Step 1 navigation | Still supported |
| Recorded CJM with its own location events | Recording beats remain unchanged |

## Evidence

- Localhost Traditional playback recomputed to `1 / 10` after Sarah authenticated, confirming the two conditional prerequisites were removed from the live playlist.
- Route handlers for React PDP, legacy PDP, Quick View, and successful PDP sign-in share the same saved-location branch and land on Step 2 without first setting Step 1.
- Focused account-branch tests pass for authenticated/saved, authenticated/no-location, and guest states.
- Full suite: 141 files, 816 tests passed; 11 static gates passed.
- Production build passed.

## Fidelity checklist

- One destination per action: PASS
- No CSS concealment or delayed repair: PASS
- URL/page/nav route source is one `setCurrent` commit: PASS
- Guest/no-location recovery preserved: PASS
- No new DS styling or visual pattern: PASS

Knowledge used: auth SSoT; Play = Step; beat-owned navigation; no hidden intermediate page; recorded CJMs remain faithful to captured events.
