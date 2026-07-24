import type { IaNode } from "@/projects/contentPack";
import type { JourneyBeat } from "@/app/orchestra/types";

/**
 * Adapter: X-Suite Persona export's `happy-path-json` → a draft UXML
 * `JourneyBeat[]`. See docs/product/CX_CONVEYOR.md Stage 4.
 *
 * Deliberately does NOT guess a screenId when the caller's map has no entry
 * for a node's `type` — X-Suite's happy-path vocabulary is e-commerce-generic
 * ("HOMEPAGE"/"PLP"/"PDP"/"CART"/"CHECKOUT"); a given project's real
 * screenIds may not line up 1:1 (Boots has no literal "cart"/"checkout" —
 * it has "book-step-1/2/3"). Silently mismapping here would repeat exactly
 * the class of bug PP-49 spent a session fixing (invented, unverified
 * identity). Unmapped nodes come back flagged, not faked.
 */

export type HappyPathTypeMap = Record<string, string>;

export type HappyPathAdaptResult = {
  beats: JourneyBeat[];
  /** Node `type` values with no entry in the caller's map — resolve these
   * before treating the result as record-ready, don't ship them silently. */
  unmapped: string[];
  /**
   * `JourneyBeat` has no narration/intent field, but the persona's stated
   * intent per step (node.note — e.g. "Check specs and select the extended
   * warranty service option.") is real, usable copy. Carried here, keyed by
   * beat id, instead of forced into a field the type doesn't have.
   */
  notes: Record<string, string>;
};

function flattenHappyPath(nodes: readonly IaNode[]): IaNode[] {
  const out: IaNode[] = [];
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) out.push(...flattenHappyPath(node.children));
  }
  return out;
}

export function adaptHappyPathToBeats(
  nodes: readonly IaNode[],
  screenIdByType: HappyPathTypeMap
): HappyPathAdaptResult {
  const flat = flattenHappyPath(nodes);
  const unmapped = new Set<string>();
  const usedIds = new Set<string>();
  const notes: Record<string, string> = {};

  const beats: JourneyBeat[] = flat.map((node) => {
    const screenId = screenIdByType[node.type];
    if (!screenId) unmapped.add(node.type);

    const base = screenId ?? `unmapped-${node.type.toLowerCase()}`;
    let id = base;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    usedIds.add(id);

    if (node.note?.trim()) notes[id] = node.note.trim();

    return {
      id,
      label: node.label,
      kind: "tab-landing",
      dwellMs: 4000,
    };
  });

  return { beats, unmapped: [...unmapped], notes };
}
