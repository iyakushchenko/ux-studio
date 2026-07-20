/**
 * Demo cursor tip ↔ target hit tests.
 * Gates clicks so target.click() never fires while the tip is visually off-cell.
 */

export const CURSOR_HOTSPOT_X = 3;
export const CURSOR_HOTSPOT_Y = 1;

export function cursorHotspotFromPos(
  left: number,
  top: number
): { x: number; y: number } {
  return { x: left + CURSOR_HOTSPOT_X, y: top + CURSOR_HOTSPOT_Y };
}

export function hotspotIntersectsElement(
  hotspotX: number,
  hotspotY: number,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    hotspotX >= rect.left &&
    hotspotX <= rect.right &&
    hotspotY >= rect.top &&
    hotspotY <= rect.bottom
  );
}

/**
 * True when cursor tip hotspot sits on `target` bbox (PO visual contract).
 * elementFromPoint rejects real content cover; ignores cursor/agent overlays.
 */
export function isDemoCursorHotspotOnTarget(
  cursor: HTMLElement,
  target: HTMLElement
): boolean {
  const left = Number.parseFloat(cursor.style.left);
  const top = Number.parseFloat(cursor.style.top);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return false;
  const { x, y } = cursorHotspotFromPos(left, top);
  if (!hotspotIntersectsElement(x, y, target)) return false;
  if (typeof document.elementFromPoint !== "function") return true;
  const hit = document.elementFromPoint(x, y);
  if (!hit) return true;
  if (
    hit.closest(".proto-chat-demo-cursor") ||
    hit.closest(
      ".studio-agent-testing-overlay, [data-studio-agent-testing-overlay]"
    )
  ) {
    return true;
  }
  return hit === target || target.contains(hit);
}
