/** Pure filter-chip selection transitions — shared by hook + tests. */

export type FilterChipMode = "multi" | "single";

export function toggleFilterChip(
  selected: string[],
  id: string,
  mode: FilterChipMode = "multi"
): string[] {
  const on = selected.includes(id);
  if (mode === "single") {
    return on ? [] : [id];
  }
  if (on) return selected.filter((x) => x !== id);
  return [...selected, id];
}

export function isFilterChipSelected(selected: string[], id: string): boolean {
  return selected.includes(id);
}
