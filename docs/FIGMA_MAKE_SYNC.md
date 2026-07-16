# Sync local hub work into Figma Make (cloud)

Use this when stakeholders need the **Figma Make share link**, not just local `npm run dev`.

## Fastest path (one prompt + one zip)

### Step 1 — Build the sync package (local)

From the repo root in PowerShell:

```powershell
.\scripts\export-figma-make-sync.ps1
```

This creates **`figma-make-sync.zip`** in the repo root.

### Step 2 — Open your Figma Make file

Open the existing Make file:  
https://www.figma.com/design/doliUpuE3J5sa5M3e1I0GP/-UX--CJM---Boots-Health---Vaccine--Concept-

### Step 3 — Paste ONE prompt in Make chat

Attach **`figma-make-sync.zip`** to the prompt (drag into chat), then paste:

```
Sync this Make project with the attached figma-make-sync.zip.

1. Unzip and REPLACE every file that exists in the zip at the same path (overwrite completely).
2. CREATE any file paths that do not exist yet in this Make project.
3. Do NOT change src/imports/, src/app/components/, package.json, vite.config.ts, or main.tsx unless the preview fails to build.
4. Keep @/ path aliases as they are.

After applying files, fix any import errors and confirm the preview runs.

Sanity check:
- Click the nav logo → Hub wiki opens (tab 0)
- Hub has sticky "On this page" nav, tour tiles, "Jump to flow diagram" CTA (#36565d)
- Sidebar has "Open UX Concept" → tab 1
- Primary hub color is #36565d (UX dept), not Boots navy #012169
```

### Step 4 — Share with team / Boots

- **Figma Make**: Share → invite viewers (stakeholders open the live preview in browser)
- Optional backup: push this repo to GitHub so engineering has the same code

---

## Files included in the zip

| Path | Action |
|------|--------|
| `src/app/App.tsx` | Replace |
| `src/app/ProtoHubPage.tsx` | **New** |
| `src/app/ProtoHubViewport.tsx` | **New** |
| `src/app/ProtoHubTabLink.tsx` | **New** |
| `src/app/ProtoHubImageLightbox.tsx` | **New** |
| `src/app/ProtoHubExperienceDiagram.tsx` | **New** |
| `src/app/ProtoHubChatDiagram.tsx` | **New** |
| `src/app/ProtoNavChrome.tsx` | **New** |
| `src/app/ProtoNavLogo.tsx` | **New** |
| `src/app/protoScreens.ts` | **New** |
| `src/app/protoHubContent.ts` | **New** |
| `src/styles/globals.css` | Replace |
| `src/assets/hub/*.jpg` (3 images) | **New** folder |
| `src/assets/ux-dpt-logo.svg` | **New** |

---

## GitHub path (recommended alongside Make)

Repo: https://github.com/iyakushchenko/UXCJM-BootsHealth-VaccineConcept

Commit and push hub changes so your team has a second source of truth.  
**Note:** Figma’s “Push to GitHub” from Make is **one-way (Make → GitHub)**. Your Cursor repo should be the master; update Make via the zip prompt above.

---

## Future: no zip (Figma Beta desktop, Mac)

If you get **Make in your local codebase** beta access:

1. Open **Figma Beta desktop (Mac)**
2. Make → **Open a folder** → select this repo (or **Clone** from GitHub)
3. `.figma/make` is already configured in this repo

Waitlist: https://www.figma.com/join-waitlist-make/

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Preview blank after sync | Ask Make: “Run npm install and fix build errors” |
| Hub images missing | Ensure `src/assets/hub/` has the 3 `.jpg` files from the zip |
| Logo doesn’t open hub | Confirm `App.tsx` and `ProtoNavChrome.tsx` were replaced |
| Old navy CTAs in hub | Confirm `globals.css` was fully replaced |
