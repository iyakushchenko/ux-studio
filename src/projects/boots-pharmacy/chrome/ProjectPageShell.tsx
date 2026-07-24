/**
 * Project page-shell substrate — erase-Legacy Phase E (complete, 2026-07-23).
 *
 * Replaced `frame/index.tsx`'s `Frame219` (the former Figma export) as the
 * thing rendered directly inside `.studio-viewport`. `frame/index.tsx` is
 * deleted (NEXT_STEPS.md Phase E item 8b, hard-green) — only `frame/`'s
 * image/SVG asset files remain, still legitimately imported as a shared
 * asset library. This component is the *live* substrate every screen mount /
 * `dynamicCSS` rule / `footerMount` depends on.
 *
 * Contract every consumer relies on (`BootsPharmacyProjectView.tsx`
 * `dynamicCSS`, every `screens/*Contract.ts` `SCREEN_SELECTOR`,
 * `chrome/footerMount.tsx`):
 *
 *   .studio-viewport > div > div:nth-child(N)
 *
 * i.e. exactly one wrapper div directly under `.studio-viewport` (rendered
 * below), containing exactly `PAGE_SHELL_COLUMNS.length` ordered child divs.
 * Each screen's React mount (`mountPlpScreen`, `mountBookStep1Screen`, etc.)
 * appends its own `.studio-react-screen-host` into the matching column — the
 * columns themselves never need Legacy-sourced markup, since `dynamicCSS`
 * already overrides every column's layout via `!important` regardless of
 * what (if anything) is inside it.
 *
 * Columns 5 and 6 are unused legacy slots (formerly a guide/tutorial frame
 * and a product-specs modal overlay in Frame219) — kept as empty placeholders
 * so every other column's 1-based index stays stable. Do not repack indices.
 */

/** nth-child(N) → screenId, 1-indexed. `null` = unused legacy slot. */
export const PAGE_SHELL_COLUMNS: readonly (string | null)[] = [
  "appointment-details", // 1
  "appointment-history", // 2
  "book-step-3", // 3
  "book-step-2", // 4
  null, // 5 — unused (was Frame219's guide/tutorial frame)
  null, // 6 — unused (was Frame219's product-specs modal overlay)
  "book-step-1", // 7
  "pdp", // 8
  "plp", // 9
  "chat", // 10
  "site-pilot", // 11
];

export default function ProjectPageShell() {
  return (
    <div className="relative size-full" data-studio-page-shell="true">
      {PAGE_SHELL_COLUMNS.map((screenId, i) => (
        <div
          key={screenId ?? `unused-${i}`}
          data-studio-page-shell-column={i + 1}
        />
      ))}
    </div>
  );
}
