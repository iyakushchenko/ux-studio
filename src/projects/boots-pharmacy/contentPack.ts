/**
 * Boots Pharmacy's real content, in the `ProjectContentPack` shape
 * (`src/projects/contentPack.ts`). First wired slice of the retrofit named
 * in docs/product/PROJECT_CONTRACT.md § Content/copy layer — footer + primary
 * nav + persona/page titles are real and sourced from the existing hand-authored
 * data (`footerContent.ts`, `headerContent.ts`, `screens.ts`, persona definitions),
 * not invented. Header account-menu items and icon glyphs stay engine/UI-owned
 * (icons, badge keys, action types have no IaNode equivalent) — not retrofitted.
 * `hub/hubContent.ts` (568 lines) is a separate, larger follow-up.
 */
import type { IaNode, ProjectContentPack } from "@/projects/contentPack";
import {
  FOOTER_COPYRIGHT_LINES,
  FOOTER_LINK_COLUMNS,
  FOOTER_UTILITY_LINKS,
  footerLinkLabel,
  footerLinkScreen,
} from "@/projects/boots-pharmacy/chrome/footerContent";
import { HEADER_NAV_ITEMS } from "@/projects/boots-pharmacy/chrome/headerContent";
import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import { SARAH_JENKINS_PERSONA } from "@/projects/boots-pharmacy/personas/sarah-jenkins";

function footerColumnsToIaNodes(): IaNode[] {
  return FOOTER_LINK_COLUMNS.map((column, columnIndex) => ({
    id: String(columnIndex + 1),
    label: column.title,
    type: "footer-column",
    note: "",
    children: column.links.map((link, linkIndex) => {
      const screen = footerLinkScreen(link);
      return {
        id: `${columnIndex + 1}_${linkIndex + 1}`,
        label: footerLinkLabel(link),
        type: screen ? "page" : "text",
        note: screen ?? "",
        linkType: screen ? ("page" as const) : undefined,
        children: [],
      };
    }),
  }));
}

function utilityLinksToIaNodes(): IaNode[] {
  return FOOTER_UTILITY_LINKS.map((label, index) => ({
    id: `utility_${index + 1}`,
    label,
    type: "text",
    note: "",
    children: [],
  }));
}

function primaryNavToIaNodes(): IaNode[] {
  return HEADER_NAV_ITEMS.map((item, index) => ({
    id: String(index + 1),
    label: item.label,
    // `kind` (link/mega-menu/dropdown) is a real UI-behavior discriminator,
    // not invented — IaNode's `type` is a free string, same flexibility
    // X-Suite's own export uses.
    type: item.kind,
    note: "",
    children: [],
  }));
}

export const BOOTS_PHARMACY_CONTENT_PACK: ProjectContentPack = {
  projectId: "boots-pharmacy",
  brandName: "Boots Pharmacy",
  personaNames: {
    [SARAH_JENKINS_PERSONA.id]: SARAH_JENKINS_PERSONA.label,
  },
  nav: {
    primary: primaryNavToIaNodes(),
  },
  footer: {
    tree: [...utilityLinksToIaNodes(), ...footerColumnsToIaNodes()],
    copyrightLines: [...FOOTER_COPYRIGHT_LINES],
  },
  pages: Object.fromEntries(
    PROJECT_SCREENS.map((screen) => [screen.screenId, { title: screen.label }])
  ),
};
