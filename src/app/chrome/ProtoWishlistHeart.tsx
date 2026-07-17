import { ProtoIconHit } from "@/app/chrome/ProtoIconHit";
import {
  FILLED_HEART_D,
  WISHLIST_HEART_OUTLINE_D,
} from "@/app/chrome/protoHeaderMount";

type Props = {
  active: boolean;
  label: string;
  onClick: () => void;
};

/** PDP-style wishlist heart — circular hit target + teal / fuchsia glyph. */
export function ProtoWishlistHeart({ active, label, onClick }: Props) {
  return (
    <ProtoIconHit
      label={label}
      className="proto-wishlist-heart-hit"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span
        className="proto-wishlist-heart-hit__icon"
        data-name="icon=add to wishlist"
        data-fav-active={String(active)}
      >
        <svg
          viewBox="0 0 16 14"
          width="16"
          height="14"
          fill="none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={active ? FILLED_HEART_D : WISHLIST_HEART_OUTLINE_D}
            fill={active ? "#e91e8c" : "#AFCCCA"}
          />
        </svg>
      </span>
    </ProtoIconHit>
  );
}
