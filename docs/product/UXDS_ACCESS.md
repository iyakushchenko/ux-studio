# UXDS access — what the agent needs (and when)

**Audience:** Product Owner  
**Goal:** Minimize friction between your Figma/UXDS mindset and the Cursor agent rebuilding concept pages.

---

## When it matters

| Workstream | UXDS needed? |
|------------|--------------|
| Engine: recording UI, playback guards, journey JSON | **No** — proceed |
| Rebuild / new concept **pages** in React | **Yes** |
| Multi-project packaging with brand-faithful UI | **Yes** |

**Commander sequence (2026-07-19):** UXDS Larkin inventoried; thin CSS bridge + kits live under `src/uxds/`. Next: full Boots screen React pilot. See [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md).

### Delivered sources

| Asset | Link |
|-------|------|
| Styleguide | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=12336-192215 |
| Components library | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=12336-188269 |
| Inventory | [../uxds/VARIABLES.md](../uxds/VARIABLES.md) |

---

## Why access helps

Without UXDS, the agent guesses names (`--color-primary` vs `--brand-boots-red`) and invents patterns. That creates:

- Renames later when you open Figma and say “wrong token”
- Components that don’t match your styleguide
- Extra review cycles

With UXDS, the agent can mirror **your** variable names, component taxonomy, and allowed patterns — same language you already use.

---

## Access pack checklist (give as much as you can)

Copy this into a chat message when ready; tick what you can provide.

### Must-have (minimum for a pilot screen)

- [ ] **Figma file link** to UXDS (or the library file that owns variables + components)
- [ ] Confirmation the agent can use **Figma MCP** on that file (you logged into Figma in Cursor / plugin authorized)
- [ ] Pointer to **Variables** collection(s) that matter for web concepts (color, type, space, radius)
- [ ] One **approved concept screen** in Figma (not Make) to use as the rebuild pilot

### Strongly recommended

- [ ] Styleguide / patterns pages (buttons, forms, modals, navigation)
- [ ] Naming convention notes (if not obvious from variables)
- [ ] Brand vs product tokens (what is global UXDS vs Boots-only)
- [ ] Any “do not use” / deprecated components

### Nice to have

- [ ] Exported token JSON / Style Dictionary dump (if you already have one)
- [ ] Code Connect maps (if any exist)
- [ ] Summarizer UXDS audit docs you trust as naming truth (optional cross-check with `E:\UX\Summarizer\docs\uxds\`)

---

## How you grant access (practical, non-technical)

1. Open Cursor with workspace **`E:\UX\ux-studio`**.
2. Ensure Figma MCP / plugin is connected (same way you use it in Summarizer).
3. Paste the UXDS file URL in chat:  
   `https://www.figma.com/design/<fileKey>/...`
4. Say: “This is the UXDS source of truth for UX Studio pages.”
5. Optionally restrict: “Pilot only the Vaccines booking flow for now.”

You do **not** need to export everything by hand if Figma MCP can read variables and components from the file.

---

## What the agent will do with it

1. Inventory variables + key components (document under `docs/uxds/` in this repo).
2. Propose a **token bridge** (UXDS name → CSS variable in Studio).
3. Rebuild **one** Boots screen as the pilot against that bridge.
4. Extend the contract so future screens follow the same map.

---

## What we will not do with UXDS

- Replace your Figma file as the design authority.
- Fork a conflicting token set “because React prefers it.”
- Block the recorder on waiting for a perfect token export.

---

## Related

- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
