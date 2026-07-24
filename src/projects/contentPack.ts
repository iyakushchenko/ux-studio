/**
 * Content pack — the copy equivalent of `ProjectContentDefinition`.
 * See docs/product/PROJECT_CONTRACT.md § Content/copy layer.
 *
 * Shape is deliberately structurally compatible with X-Suite's real IA/PD
 * export (verified against source 2026-07-24, not guessed):
 * `E:\UX\Summarizer\src\ui\components\settings\iaPdAi\iaPdAiSchema.ts`
 * (`iaPdAiIaNodeSchema`, `iaPdAiProductDataJsonSchema`). Saved-IA bundle on
 * that side is `{ iaJson: IaNode[], productDataJson: {...}, meta: { name } }`
 * — an X-Suite export like "Main Nav & Product Data - English
 * (ia-json-02-26-2026-1)" is one `iaJson` array. `IaNode` below is that same
 * shape, so a real export maps in with a thin adapter, not a rewrite.
 *
 * Not wired to any project yet — Boots' copy still lives inline in
 * headerContent.ts / footerContent.ts / hub/hubContent.ts.
 */

/** Matches X-Suite's `nodeBase` + recursive `children` exactly (5 levels
 * deep on their side via unrolled Zod; left unbounded here — TS recursion
 * doesn't need the FSM-compiler workaround their Zod schema does). */
export type IaNode = {
  /** "0" = Home (X-Suite convention: Home is always id "0", a leaf sibling
   * of the real nav roots — never a wrapper around them). Real roots are
   * "1", "2", …; children are path-joined ("1_1", "1_2", …). */
  id: string;
  label: string;
  type: string;
  /** URL, short description, or (Parse mode) the full absolute URL. */
  note: string;
  linkType?: "anchor" | "page";
  children: IaNode[];
};

/** One IA export = one nav tree. A project may hold >1 (primary + named
 * secondaries, X-Suite's "menu 2" / "menu 3" concept) — keyed by name. */
export type ContentPackNav = Record<string, IaNode[]>;

/** Structurally matches `iaPdAiProductDataJsonSchema` — length-10 slot
 * groups, not arbitrary arrays, because that's the real wire format. Kept
 * optional/separate from nav: catalog shape is genuinely project-specific
 * (Boots' vaccines vs. a future Puma sneaker line), unlike nav/copy. */
export type ProductDataGroup = { "group-title": string; values: string[] };

export type ProjectContentPack = {
  projectId: string;
  /** Wordmark text / brand name shown in chrome + document title. */
  brandName: string;
  /** Persona display name(s), keyed by PersonaId — not hardcoded "Sarah". */
  personaNames: Record<string, string>;
  /** Primary nav + any named secondaries — IA-shaped (see `ContentPackNav`). */
  nav: ContentPackNav;
  /** Footer link tree — same IA node shape as `nav` (X-Suite's footer
   * assistant produces a dedicated footer-scoped IA tree, not a different
   * format), plus copyright lines which are UXML chrome, not IA content. */
  footer: {
    tree: IaNode[];
    copyrightLines: string[];
  };
  /** Per-screen title/heading copy — screenId → display strings. */
  pages: Record<string, { title: string; heading?: string }>;
  /** Optional — only when a project's catalog data should ride the same
   * pack rather than living in its own project-specific shape. */
  productData?: {
    base?: { name?: ProductDataGroup; sku?: ProductDataGroup };
    attributes?: Record<string, ProductDataGroup>;
  };
};
