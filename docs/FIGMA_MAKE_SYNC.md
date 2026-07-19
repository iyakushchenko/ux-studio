# Sync local work into Figma Make (cloud)

Step-by-step. Say **next** in Cursor after each step is done.

---

## Step 1 — Build the sync package (local)

From repo root in PowerShell:

```powershell
.\scripts\export-figma-make-sync.ps1
```

Confirm this file exists:

`figma-make-sync.zip` (repo root, 65 files)

---

## Step 2 — Open your Figma Make file

https://www.figma.com/design/doliUpuE3J5sa5M3e1I0GP/-UX--CJM---Boots-Health---Vaccine--Concept-

---

## Step 3 — Upload zip + paste prompt in Make chat

Attach **`figma-make-sync.zip`** (drag into chat), then paste:

```
Sync this Make project with the attached figma-make-sync.zip.

1. Unzip and REPLACE every file that exists in the zip at the same path (overwrite completely).
2. CREATE any file paths that do not exist yet in this Make project.
3. Do NOT change src/imports/, src/app/components/, package.json, vite.config.ts, or main.tsx unless the preview fails to build.
4. Keep @/ path aliases as they are.

After applying files, fix any import errors and confirm the preview runs.
```

---

## Step 4 — Fix build (only if preview fails)

Ask Make:

```
Run npm install if needed, then fix all build/import errors until the preview runs.
```

---

## Step 5 — Sanity check in Make preview

- Logo → Hub (tab 0) opens
- Hub: reading order, **Open UX Concept**, Persona Deck + Visual Flow Deck links, credits below CTA
- Tab 3: Bundles, filters, Reset Filters trash icon, bundle descriptions
- Tab 1–2: agentic home + chat still load
- Tabs 5–7: booking funnel still loads

---

## What is in the zip (65 files)

| Area | Paths |
|------|--------|
| App shell | `App.tsx`, `useProtoScrollFill.ts` |
| Hub | `ProtoHub*.tsx`, `protoHubContent.ts`, `protoScreens.ts`, `src/assets/hub/*.jpg` |
| Nav | `ProtoNavChrome.tsx`, `ProtoNavLogo.tsx`, `ProtoNavPanel.tsx`, `protoNavPanel.css`, `protoNavZoom.ts` |
| Header / footer / auth | `protoHeaderMount.tsx`, `LoginPopup.tsx`, `protoFooter*`, `ProtoTertiaryCta.tsx`, `ProtoIconHit.tsx`, `protoIconHitWire.ts`, `ProtoSocialIcons.tsx`, `BootsPharmacyLogo.tsx`, `ProtoCloseIcon.tsx` |
| PLP | `protoPlpListing.ts`, `protoInputControls.ts`, `protoLocationSearch.ts`, `proto-trash-icon.svg` |
| Popups / booking | `QuickViewPopup.tsx`, `AvailabilityTool.tsx`, pickers, `protoPdpRtb.ts`, `protoOrderPricing.ts`, `protoMap.ts`, `protoVaccineList.ts` |
| Styles | `globals.css` |
| Assets | `ux-dpt-logo.svg`, `user-avatar.jpg`, maps, avail icons, hub images |

**Do not sync:** `src/imports/`, `src/app/components/`, `package.json`, `vite.config.ts`, `main.tsx` (unless build breaks).

---

## GitHub (optional second source of truth)

https://github.com/iyakushchenko/ux-studio

Figma Make → GitHub is one-way. This repo is master; update Make via the zip above.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Preview blank after sync | Step 4 prompt |
| Missing hub images | Zip includes `src/assets/hub/` (3 JPGs) |
| PLP filters dead | Confirm `protoPlpListing.ts` + `protoInputControls.ts` were created |
| Reset icon missing | Confirm `src/assets/proto-trash-icon.svg` was created |
| Import errors for `@/app/...` | Ask Make to keep `@/` aliases; do not rewrite paths |
