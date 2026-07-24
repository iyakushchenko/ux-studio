# File hygiene — UX Studio

**Status:** Locked (Tech Director, 2026-07-19)  
**Gate:** `npm run check:hygiene` → `scripts/check-file-hygiene.mjs` (wired into `npm test`)  
**Inspired by:** Summarizer CSS/LOC ratchets — **lean** copy only (no Actions burn, no micro-file zoo).

---

## Thresholds

| Rule | Value | Notes |
|------|-------|--------|
| Default max lines | **1600** | `src/app`, `src/uxds`, `src/projects`, `src/styles`, `scripts` |
| Allowlist | Per-file ceiling in the script | LEGACY dumps + current engine monsters |
| Fragmentation | **Not gated** | Prefer domain cohesion over tiny-file sprawl |

**Bump policy:** Prefer splitting by **business/domain verb** over raising a ceiling. If you must bump, add a one-line rationale next to the allowlist entry.

---

## Excluded from the gate

- `src/app/components/**` (shadcn kit)
- `**/frame/**`, `src/imports/**` (Legacy dumps)
- `**/__tests__/**`
- One-shot `scripts/inspect-*.mjs`, playwright-out, domain codemod

---

## Agent rules

1. Do **not** grow allowlisted LEGACY globals (`globals-screens.css`, etc.) for new React pages.
2. Do **not** create a micro-file zoo to dodge the ceiling — extract a cohesive subdomain module.
3. New PANEL/chrome CSS classes use `.studio-*` / `.studio-nav-*` — never new `.proto-*` ([NAMING.md](./NAMING.md)).

---

## Related

- [NAMING.md](./NAMING.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md)
