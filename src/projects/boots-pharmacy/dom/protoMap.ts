import locationsMapLondon from "@/assets/locations-map-london.png";

/** Navy map pin — solid #012169 + cutout (Locations popup + Availability Tool). */
export const MAP_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="28" height="38" aria-hidden="true">
  <path fill="#012169" d="M16 0C7.716 0 1 6.716 1 15c0 11.25 15 29 15 29s15-17.75 15-29C31 6.716 24.284 0 16 0z"/>
  <circle cx="16" cy="14.5" r="5.5" fill="#F4F1EA"/>
</svg>`;

const MAP_CTRL_COMPASS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <circle cx="12" cy="12" r="9" fill="none" stroke="#3c4043" stroke-width="1.5"/>
  <path fill="#ea4335" d="M12 4.2l2.2 5.4H9.8L12 4.2z"/>
  <path fill="#3c4043" d="M12 19.8l-2.2-5.4h4.4L12 19.8z"/>
  <circle cx="12" cy="12" r="1.6" fill="#3c4043"/>
  <path stroke="#3c4043" stroke-width="1.2" d="M12 8.2v2.2M12 13.6v2.2M8.2 12h2.2M13.6 12h2.2"/>
</svg>`;
const MAP_CTRL_PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path fill="#3c4043" d="M11 5h2v14h-2V5zm-6 6h14v2H5v-2z"/>
</svg>`;
const MAP_CTRL_MINUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path fill="#3c4043" d="M5 11h14v2H5v-2z"/>
</svg>`;

export function appendFakeMapControls(host: HTMLElement) {
  if (host.querySelector(":scope > .proto-map-controls")) return;
  const stack = document.createElement("div");
  stack.className = "proto-map-controls";
  stack.setAttribute("aria-hidden", "true");

  const mkBtn = (label: string, svg: string) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "proto-map-controls__btn";
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.innerHTML = svg;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener("pointerdown", (e) => e.stopPropagation());
    return btn;
  };

  stack.appendChild(mkBtn("Reset map orientation", MAP_CTRL_COMPASS_SVG));
  stack.appendChild(mkBtn("Zoom in", MAP_CTRL_PLUS_SVG));
  stack.appendChild(mkBtn("Zoom out", MAP_CTRL_MINUS_SVG));
  host.appendChild(stack);
}

export type MapPinSpec = { left: string; top: string; nearOnly?: boolean };

export const MAP_PINS: MapPinSpec[] = [
  { left: "48%", top: "42%" },
  { left: "44%", top: "50%", nearOnly: true },
  { left: "52%", top: "38%", nearOnly: true },
  { left: "40%", top: "45%", nearOnly: true },
  { left: "58%", top: "52%", nearOnly: true },
  { left: "35%", top: "38%", nearOnly: true },
  { left: "62%", top: "45%", nearOnly: true },
  { left: "46%", top: "32%", nearOnly: true },
  { left: "50%", top: "58%", nearOnly: true },
  { left: "38%", top: "52%", nearOnly: true },
  { left: "54%", top: "48%", nearOnly: true },
  { left: "42%", top: "58%", nearOnly: true },
  { left: "56%", top: "35%", nearOnly: true },
];

/** Clamp-pan a map surface inside a viewport (no empty gutters). */
export function enableClampedMapPan(
  viewport: HTMLElement,
  surface: HTMLElement,
  bg: HTMLImageElement,
  dragClass = "proto-lb-map-dragging"
): () => void {
  let x = 0;
  let y = 0;
  const applyTransform = () => {
    surface.style.transform = `translate(${x}px, ${y}px)`;
  };

  const clampPan = () => {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = surface.offsetWidth;
    const sh = surface.offsetHeight;
    const minX = Math.min(0, vw - sw);
    const minY = Math.min(0, vh - sh);
    x = Math.max(minX, Math.min(0, x));
    y = Math.max(minY, Math.min(0, y));
  };

  const centerMap = () => {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = surface.offsetWidth;
    const sh = surface.offsetHeight;
    x = Math.min(0, (vw - sw) / 2);
    y = Math.min(0, (vh - sh) / 2);
    clampPan();
    applyTransform();
  };

  requestAnimationFrame(centerMap);
  bg.addEventListener("load", centerMap);

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = x;
    origY = y;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add(dragClass);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    x = origX + (e.clientX - startX);
    y = origY + (e.clientY - startY);
    clampPan();
    applyTransform();
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    viewport.classList.remove(dragClass);
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onResize = () => {
    clampPan();
    applyTransform();
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(viewport);

  viewport.addEventListener("pointerdown", onDown);
  viewport.addEventListener("pointermove", onMove);
  viewport.addEventListener("pointerup", onUp);
  viewport.addEventListener("pointercancel", onUp);

  return () => {
    ro.disconnect();
    bg.removeEventListener("load", centerMap);
    viewport.removeEventListener("pointerdown", onDown);
    viewport.removeEventListener("pointermove", onMove);
    viewport.removeEventListener("pointerup", onUp);
    viewport.removeEventListener("pointercancel", onUp);
  };
}

/** Chosen-location page map: single pin + clamped drag. */
export function setupChosenPageMap(
  mapWrap: HTMLElement,
  src: string,
  alt: string,
  opts?: { onPinClick?: () => void }
): () => void {
  mapWrap.innerHTML = "";
  mapWrap.classList.add("proto-chosen-map");

  const viewport = document.createElement("div");
  viewport.className = "proto-chosen-map-viewport";

  const surface = document.createElement("div");
  surface.className = "proto-chosen-map-surface";

  const bg = document.createElement("img");
  bg.className = "proto-chosen-map-bg";
  bg.alt = alt;
  bg.draggable = false;
  bg.src = src;

  const pin = document.createElement("div");
  pin.className = "proto-page-map-pin";
  pin.setAttribute("role", "button");
  pin.tabIndex = 0;
  pin.setAttribute("aria-label", "Open chosen location in list");
  pin.title = "View chosen location";
  pin.innerHTML = MAP_PIN_SVG;

  const onPinPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
  };
  const activatePin = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    opts?.onPinClick?.();
  };
  const onPinKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") activatePin(e);
  };
  pin.addEventListener("pointerdown", onPinPointerDown);
  pin.addEventListener("click", activatePin);
  pin.addEventListener("keydown", onPinKey);

  surface.appendChild(bg);
  surface.appendChild(pin);
  viewport.appendChild(surface);
  appendFakeMapControls(viewport);
  mapWrap.appendChild(viewport);

  const panCleanup = enableClampedMapPan(
    viewport,
    surface,
    bg,
    "proto-chosen-map-dragging"
  );

  return () => {
    pin.removeEventListener("pointerdown", onPinPointerDown);
    pin.removeEventListener("click", activatePin);
    pin.removeEventListener("keydown", onPinKey);
    panCleanup();
  };
}

/**
 * Shared London map: draggable bg (landmarks on asset), navy pins, map controls.
 * Used by Locations lightbox and Availability Tool.
 */
export function setupProtoMapView(
  mapView: HTMLElement,
  opts?: { onPinClick?: (pinIndex: number) => void; pinLabels?: string[] }
): {
  setNearMe: (on: boolean) => void;
  cleanup: () => void;
} {
  mapView.innerHTML = "";
  mapView.classList.add("proto-lb-map-view");

  const viewport = document.createElement("div");
  viewport.className = "proto-lb-map-viewport";

  const surface = document.createElement("div");
  surface.className = "proto-lb-map-surface";

  const bg = document.createElement("img");
  bg.className = "proto-lb-map-bg";
  bg.alt = "";
  bg.draggable = false;
  bg.src = locationsMapLondon;

  const pinsLayer = document.createElement("div");
  pinsLayer.className = "proto-lb-map-pins";

  const pinCleanups: Array<() => void> = [];

  MAP_PINS.forEach((spec, i) => {
    const pin = document.createElement("div");
    pin.className = "proto-lb-map-pin";
    pin.setAttribute("role", "button");
    pin.tabIndex = 0;
    if (spec.nearOnly) pin.dataset.protoNearPin = "true";
    pin.style.left = spec.left;
    pin.style.top = spec.top;
    pin.innerHTML = MAP_PIN_SVG;
    const label = opts?.pinLabels?.[i] ?? (i === 0 ? "Covent Garden Long Acre" : `Location ${i + 1}`);
    pin.title = label;
    pin.setAttribute("aria-label", `View ${label} in list`);

    const activate = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      opts?.onPinClick?.(i);
    };
    const onPinPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
    };
    const onPinKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") activate(e);
    };
    pin.addEventListener("pointerdown", onPinPointerDown);
    pin.addEventListener("click", activate);
    pin.addEventListener("keydown", onPinKey);
    pinCleanups.push(() => {
      pin.removeEventListener("pointerdown", onPinPointerDown);
      pin.removeEventListener("click", activate);
      pin.removeEventListener("keydown", onPinKey);
    });

    pinsLayer.appendChild(pin);
  });

  surface.appendChild(bg);
  surface.appendChild(pinsLayer);
  viewport.appendChild(surface);
  appendFakeMapControls(viewport);
  mapView.appendChild(viewport);

  const panCleanup = enableClampedMapPan(viewport, surface, bg);

  const setNearMe = (on: boolean) => {
    mapView.dataset.protoMapNear = on ? "true" : "false";
  };
  setNearMe(false);

  return {
    setNearMe,
    cleanup: () => {
      panCleanup();
      pinCleanups.forEach((fn) => fn());
    },
  };
}

/** @deprecated Use setupProtoMapView — kept for App.tsx call sites. */
export const setupLocationsMapView = setupProtoMapView;
