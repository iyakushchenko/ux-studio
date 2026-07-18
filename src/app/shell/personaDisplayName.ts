/** Studio dropdown label — first name only (e.g. "Sarah Jenkins" → "Sarah"). */
export function personaDisplayFirstName(label: string): string {
  const first = label.trim().split(/\s+/)[0];
  return first || label;
}
