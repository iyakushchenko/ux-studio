# Cursor engine — enterprise demo hardening

**Status:** Active platform contract  
**Owner:** Arch / Finn / Uma / Quinn  
**Scope:** Every project and every recorded or built-in CJM

## Outcome

The robo-cursor must read like a real, confident mouse pointer in a live client demo: arrow in transit, hand as its hotspot enters an actionable tap area, stable hand through hover and press, then a clean release without flicker, teleport, stale state, or invented interaction.

## P0 acceptance

- One project-neutral actionability contract drives target resolution, early-hand feedback, hover, and click.
- `[data-studio-action]`, semantic buttons/links, and registered interaction roots receive the hand across their full hit area—not only over labels or icons.
- Disabled, `aria-disabled`, inert, hidden, pointer-blocked, modal-blocked, detached, covered, or degraded targets never show a hand or receive a click.
- Arrow→hand is monotonic at the destination edge. The hand latch transfers atomically to hover ownership and cannot blink hand→arrow→hand at settle.
- The hotspot remains on the live target through hover, 64ms press, release, and click; aborts clear hover/pressed/graphic residue.
- Modal/actionability state is rechecked after travel and hover, immediately before press.
- Step and Play share the same interaction engine. Step parks; Play stays at the last completed interaction; submit/send parks away.
- QA fails on off-target, blocked, disabled, duplicate, graphic-thrash, abrupt-park, or forbidden-rest evidence and records the precise cause.

## Premium guard rails

- Straight ease-in-out travel only: no bounce, trail, glow, spring, or cursor-effects zoo.
- Cursor graphics share one hotspot and do not shift position when arrow, hand, and carriage swap.
- Product hover/active styling remains the primary feedback; cursor feedback stays shell-neutral.
- Future projects opt in through semantic HTML or registered interaction metadata, never project-specific selector forks.

## Required proof

Focused units cover declared tap areas, disabled variants, atomic hand ownership, cancellation cleanup, modal re-check, on-target press, and Step/Play policy. Localhost proof runs with QA open and includes representative button, link, modal, scroll, text-entry, and full-CJM playback. Strict FE/UI/UX audit remains required before PROVEN.
