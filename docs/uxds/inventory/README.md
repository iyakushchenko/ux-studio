# UXDS inventory (machine)

**HARD contract:** [UXDS_MAP.md](../UXDS_MAP.md) — full naming law, regeneration steps, and agent rules.

| Artifact | Path |
|----------|------|
| Variables (exhaustive) | [variables.json](./variables.json) |
| Components (exhaustive) | [components.json](./components.json) |
| React ↔ Figma kits | [react-kit-map.json](./react-kit-map.json) · [REACT_KIT_MAP.md](../REACT_KIT_MAP.md) |
| Raw Figma dumps | [raw/](./raw/) (`setup-a.txt`, `setup-b.txt`, `non-setup.json`, `sets.txt`, `orphans.txt`) |

Regenerate: Figma MCP `use_figma` (skill `figma-use`) on fileKey `myqzp3KRc1pxKDOv8RfTsl` → update `raw/` → `node scripts/assemble-uxds-inventory.mjs` → `npm run check:uxds-inventory`.
