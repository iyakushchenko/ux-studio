import type { ReactNode } from "react";
import svgPaths from "@/projects/boots-pharmacy/frame/svg-p97rh8hlns";
import { ProtoIconHit } from "@/app/chrome/ProtoIconHit";

const ICON_FILL = "#AFAFAF";

type SocialIconDef = {
  id: string;
  label: string;
  viewBox: string;
  /** Figma glyph inset inside the 24×24 social tile. */
  inset: string;
  preserveAspectRatio?: string;
  glyph: ReactNode;
};

const SOCIAL_ICONS: SocialIconDef[] = [
  {
    id: "twitter",
    label: "X (Twitter)",
    viewBox: "0 0 12.0042 9.75342",
    inset: "29.68% 25.47% 29.68% 24.51%",
    glyph: <path d={svgPaths.pa543080} fill={ICON_FILL} />,
  },
  {
    id: "instagram",
    label: "Instagram",
    viewBox: "0 0 11.9999 12",
    inset: "25%",
    glyph: (
      <>
        <path d={svgPaths.pcaa1600} fill={ICON_FILL} />
        <path
          clipRule="evenodd"
          fillRule="evenodd"
          d={svgPaths.p3ab7bc00}
          fill={ICON_FILL}
        />
        <path
          clipRule="evenodd"
          fillRule="evenodd"
          d={svgPaths.pdcc6880}
          fill={ICON_FILL}
        />
      </>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    viewBox: "0 0 6 12",
    inset: "25% 37.5%",
    glyph: <path d={svgPaths.p47a6a30} fill={ICON_FILL} />,
  },
  {
    id: "google",
    label: "Google",
    viewBox: "0 0 11.1011 11.1011",
    inset: "22%",
    preserveAspectRatio: "xMidYMid meet",
    glyph: <path d={svgPaths.p33f38600} fill={ICON_FILL} />,
  },
];

function FooterSocialGlyph({
  viewBox,
  inset,
  preserveAspectRatio = "none",
  children,
}: Pick<SocialIconDef, "viewBox" | "inset" | "preserveAspectRatio"> & {
  children: ReactNode;
}) {
  return (
    <span className="proto-footer-social-glyph" aria-hidden>
      <span className="proto-footer-social-glyph__mark" style={{ inset }}>
        <svg
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          fill="none"
        >
          {children}
        </svg>
      </span>
    </span>
  );
}

export default function ProtoSocialIcons() {
  return (
    <div className="proto-footer__social-icons">
      {SOCIAL_ICONS.map(
        ({ id, label, viewBox, inset, preserveAspectRatio, glyph }) => (
          <ProtoIconHit key={id} label={label} glyphSize={24}>
            <FooterSocialGlyph
              viewBox={viewBox}
              inset={inset}
              preserveAspectRatio={preserveAspectRatio}
            >
              {glyph}
            </FooterSocialGlyph>
          </ProtoIconHit>
        ),
      )}
    </div>
  );
}
