# Versioning + changelog (UX Studio)

**Status:** Skeleton + chrome version chip — 2026-07-19  
**Inspired by:** Summarizer `release.mjs` + `scripts/release-notes.mjs` + `docs/RELEASE.md`  
**Do not:** add GitHub Release / tag CI until criteria below are met (Actions budget).

---

## 0. Role ownership (versioning)

Callsigns: [TEAM.md](./TEAM.md).

| Callsign | Owns |
|----------|------|
| **Ben** (BE) | Semver bumps (`npm run release:*`), CHANGELOG promote, `check:version` / `check:felonies` green, post-push `gh run list` |
| **Finn / Uma** | Top-bar version chip (tabs row, sticky right, overflow wins); match Studio PANEL aesthetic |
| **Quinn** (QA) | Prove chip readable when tabs overflow; no tab/version collision; channel label correct |
| **Pax** (PO sim) | **Whether/when** to bump + push on user-visible ships (human PO overrides) |
| **Arch / Bea** | Advise bump class (see §6); default channel for maturity |
| **Human PO** | Accepts **channel** (`alpha` \| `beta` \| `rc` \| `stable`) — not the semver digit; may override Pax |

---

## 0.1 Chrome version chip (how-to)

| Piece | Source |
|-------|--------|
| Semver display `v0.0.1` | `package.json` `version` → Vite/Vitest `define` `__STUDIO_PACKAGE_VERSION__` → `getStudioRelease()` |
| Channel badge | `STUDIO_RELEASE_CHANNEL` in `src/app/shell/studioRelease.ts` (**alpha** while on `0.0.x`) |
| UI | `StudioNavVersionChip` — right of page tabs (`.studio-nav-tabs-row`) |
| Overflow | Chip `flex-shrink: 0`, solid `#2e2e2e` fill, `z-index: 3`, left shadow so scrolling tabs never cover it |

**No hardcoded drift:** never paste a version string into JSX. Change semver only via `release.mjs` / `package.json`.

---

## 1. How Summarizer does it (evidence)

| Piece | Path / trigger | Role |
|-------|----------------|------|
| Semver in `package.json` | `version` field | Source of truth for shipped number |
| In-flight notes | `CHANGELOG.md` → `## Current (in flight)` | Agents append bullets as they commit |
| Append / catchup / gate | `scripts/release-notes.mjs` (`npm run notes:*`) | Lane taxonomy + push coverage check |
| Storytelling lint | `scripts/check-changelog-storytelling.mjs` + `docs/CHANGELOG_STORYTELLING.md` | Quality of curated release prose |
| Bump + promote | `release.mjs` via `npm run release:patch\|minor\|major` | Bumps semver, promotes `## Current` → `## vX.Y.Z - DDMMYY`, runs build, rolls back on failure |
| Sync gate | `scripts/check-release-version-changelog-sync.mjs` | `package.json` version == latest changelog `## v…` heading |
| Tag → GitHub Release | `.github/workflows/release.yml` on `v*.*.*` | Zips plugin artifacts + CHANGELOG body (Actions cost) |
| CI note | Summarizer `ci.yml` is **`workflow_dispatch` only** | Billing block — local husky/pre-push is the real gate |

**Not conventional-commits-as-automation:** commits are free-form; agents are expected to append changelog bullets (lanes). Release body can also be a one-line CLI note.

---

## 2. When UX Studio should start the *full* practice

Start **habit now** (notes + local bump). Turn on **tag / GitHub Release CI** only when **all** are true:

1. **Maturity** — Engine chrome + ≥1 project page are PO-accepted and Pages deploys are routine (not every WIP push).
2. **Release cadence** — You want named milestones for humans (PO demos, stakeholder handoffs), not every green commit.
3. **Multi-project** — A second concept project lands **or** journey bundles need “shipped with Studio vX” labels.
4. **Actions headroom** — Account is not near Summarizer’s billing failure mode; release job stays tag-only (never on every push).

Until then: `0.x` local bumps + `CHANGELOG.md` are enough. Pages deploy on `main` already publishes the tip — versioning is for **human-readable history**, not deploy plumbing.

---

## 3. Reuse plan (copy vs adapt)

| Summarizer | UX Studio | Action |
|------------|-----------|--------|
| `CHANGELOG.md` + `## Current` | Same shape | **Copy pattern** |
| `scripts/release-notes.mjs` | Lean append/list/check/preview | **Adapt** (no catchup / storytelling yet) |
| `release.mjs` | `scripts/release.mjs` | **Adapt** (no build-counter / no plugin zip) |
| `check-release-version-changelog-sync.mjs` | Same contract | **Copy lightly** |
| Lane taxonomy + storytelling | Later | **Defer** |
| `release.yml` GitHub Release | — | **Defer** (Actions cost; no zip product yet) |
| Husky notes-on-push gate | — | **Defer** until notes habit sticks |

**Lean Actions:** keep versioning **local**. No new workflow in this skeleton.

---

## 4. Commands (implemented)

```bash
npm run notes:list                          # show ## Current bullets
npm run notes:append -- --lane=engine --intent="…"
npm run notes:preview                       # next release body draft
npm run notes:check                         # ## Current present; sync hint
npm run release:patch                       # local bump + promote CHANGELOG
npm run release:minor
npm run release:major
npm run check:version                       # package.json ↔ latest ## v heading
```

Optional: `SKIP_BUILD=1 npm run release:patch` skips `npm run build` after bump (emergency only).

**After a release (manual, later):** `git tag vX.Y.Z && git push origin vX.Y.Z` — only when tag→Release CI exists.

---

## 5. Agent habit (cheap)

On coherent commits that ship user-visible or engine behavior: append one bullet:

```bash
npm run notes:append -- --lane=project --intent="Book Step 1: location screen UXDS mount"
```

Lanes: `engine` · `project` · `shell` · `uxds` · `docs` · `chore`

Do **not** invent a GitHub Release workflow “to be helpful.”

---

## 6. When to bump (Director lock)

| Change | Bump | Notes |
|--------|------|-------|
| User-visible ship (chrome, page, REC behavior PO can see) | Consider **patch** after notes habit; or keep notes in `## Current` until a named demo | Chip updates when `package.json` bumps |
| Engine-breaking API / journey schema / URL contract break | **minor** (still 0.x) | Document in CHANGELOG |
| Impossible without PO / public promise break | **major** | Rare at 0.x |
| Docs-only / felony gate / rename with no user delta | Usually **no bump** — notes optional |

### Channel policy

| Channel | Meaning | Who |
|---------|---------|-----|
| **alpha** | Default for `0.0.x` — unstable, agent-heavy | Director sets; **current** |
| **beta** | Feature-complete enough for wider internal demos | PO accepts |
| **rc** | Release candidate for a named milestone | PO accepts |
| **stable** | PO-accepted production channel | PO accepts |

Change channel by editing `STUDIO_RELEASE_CHANNEL` in `studioRelease.ts` (not by inventing a second config file).

---

## Related

- [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) — no expensive release CI yet  
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) — when to note + test  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) — felony = CI/test fail  
- Summarizer: `docs/RELEASE.md`, `docs/CHANGELOG_STORYTELLING.md`, `release.mjs`  
