import type { SyntheticEvent } from "react";

/** Blocks pointer, wheel, and touch on prototype content while studio playback is on-air. */
export function ProtoPlaybackShield() {
  const block = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="proto-playback-shield"
      aria-hidden="true"
      onPointerDown={block}
      onPointerUp={block}
      onClick={block}
      onWheel={block}
      onTouchStart={block}
      onTouchMove={block}
      onContextMenu={block}
    />
  );
}
