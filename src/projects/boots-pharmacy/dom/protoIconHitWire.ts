const ICON_ONLY_BUTTON =
  '[data-name="component.input.button"][class*="h-[32px]"]:not(:has(p))';

const FOOTER_SOCIAL_ICON =
  '[data-name="icon / footer / social media"] [data-name^="icon / socials /"]';

const FOOTER_FIND_STORE =
  '[data-name="component.footer.action.ctas"] [data-name="component.input.button"]';

/** Tag Figma “Find a store” footer CTAs with tertiary icon+link styling. */
export function wireFooterFindStoreTertiary(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(FOOTER_FIND_STORE).forEach((btn) => {
    if (!/find a store/i.test(btn.textContent ?? "")) return;
    btn.classList.add("proto-tertiary-cta");
  });
}

/** Tag Figma icon-only CTAs (share, heart, etc.) with the shared hit-target class. */
export function wireProtoIconHitButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(ICON_ONLY_BUTTON).forEach((btn) => {
    btn.classList.add("proto-icon-hit");
  });
}

/** Tag native footer social glyphs with the same hit-target hover as PDP share. */
export function wireFooterSocialIconHits(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(FOOTER_SOCIAL_ICON)
    .forEach((iconEl) => {
      if (iconEl.classList.contains("proto-icon-hit")) return;
      iconEl.classList.add("proto-icon-hit", "proto-icon-hit--figma-glyph-24");
      iconEl.setAttribute("role", "button");
      iconEl.setAttribute("tabindex", "0");
    });
}

export function wireProtoIconHits(root: ParentNode = document): void {
  wireProtoIconHitButtons(root);
  wireFooterSocialIconHits(root);
  wireFooterFindStoreTertiary(root);
}
