/** Pure disclosure open transitions — shared by hook + tests. */

export function nextDisclosureOpen(
  open: boolean,
  next?: boolean
): boolean {
  return typeof next === "boolean" ? next : !open;
}
