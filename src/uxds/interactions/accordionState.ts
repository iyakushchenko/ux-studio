/** Pure accordion open-set transitions — shared by hook + tests. */

export type AccordionType = "single" | "multiple";

export function toggleAccordionValue(
  open: string[],
  id: string,
  type: AccordionType = "single"
): string[] {
  const isOpen = open.includes(id);
  if (type === "single") {
    return isOpen ? [] : [id];
  }
  if (isOpen) return open.filter((x) => x !== id);
  return [...open, id];
}

export function isAccordionItemOpen(open: string[], id: string): boolean {
  return open.includes(id);
}
