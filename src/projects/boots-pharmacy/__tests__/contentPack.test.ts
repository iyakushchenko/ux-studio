import { describe, expect, it } from "vitest";
import { BOOTS_PHARMACY_CONTENT_PACK } from "@/projects/boots-pharmacy/contentPack";
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

// First wired slice of the content/copy layer retrofit (PROJECT_CONTRACT.md
// § Content/copy layer). This is not a parallel invented shape — it must
// stay a lossless transform of the real hand-authored source data. If any
// of these fail, the pack has drifted from the pages that actually render.
describe("BOOTS_PHARMACY_CONTENT_PACK — matches real source data, not invented", () => {
  it("footer utility links match FOOTER_UTILITY_LINKS exactly, in order", () => {
    const utility = BOOTS_PHARMACY_CONTENT_PACK.footer.tree.filter(
      (n) => n.type === "text"
    );
    expect(utility.map((n) => n.label)).toEqual([...FOOTER_UTILITY_LINKS]);
  });

  it("footer columns match FOOTER_LINK_COLUMNS titles, link labels, and screen targets", () => {
    const columns = BOOTS_PHARMACY_CONTENT_PACK.footer.tree.filter(
      (n) => n.type === "footer-column"
    );
    expect(columns).toHaveLength(FOOTER_LINK_COLUMNS.length);
    columns.forEach((columnNode, i) => {
      const sourceColumn = FOOTER_LINK_COLUMNS[i]!;
      expect(columnNode.label).toBe(sourceColumn.title);
      expect(columnNode.children).toHaveLength(sourceColumn.links.length);
      columnNode.children.forEach((linkNode, j) => {
        const sourceLink = sourceColumn.links[j]!;
        expect(linkNode.label).toBe(footerLinkLabel(sourceLink));
        const screen = footerLinkScreen(sourceLink);
        expect(linkNode.note).toBe(screen ?? "");
        expect(linkNode.linkType).toBe(screen ? "page" : undefined);
      });
    });
  });

  it("footer copyright lines match FOOTER_COPYRIGHT_LINES exactly", () => {
    expect(BOOTS_PHARMACY_CONTENT_PACK.footer.copyrightLines).toEqual([
      ...FOOTER_COPYRIGHT_LINES,
    ]);
  });

  it("primary nav matches HEADER_NAV_ITEMS labels and kinds", () => {
    const nav = BOOTS_PHARMACY_CONTENT_PACK.nav.primary!;
    expect(nav).toHaveLength(HEADER_NAV_ITEMS.length);
    nav.forEach((node, i) => {
      expect(node.label).toBe(HEADER_NAV_ITEMS[i]!.label);
      expect(node.type).toBe(HEADER_NAV_ITEMS[i]!.kind);
    });
  });

  it("page titles cover every registered screen with its real nav label", () => {
    for (const screen of PROJECT_SCREENS) {
      expect(BOOTS_PHARMACY_CONTENT_PACK.pages[screen.screenId]?.title).toBe(
        screen.label
      );
    }
  });

  it("persona names are keyed by the real persona id, not a hardcoded display name", () => {
    expect(
      BOOTS_PHARMACY_CONTENT_PACK.personaNames[SARAH_JENKINS_PERSONA.id]
    ).toBe(SARAH_JENKINS_PERSONA.label);
  });
});
