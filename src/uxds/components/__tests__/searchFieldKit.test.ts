import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const kit = readFileSync(
  resolve(__dirname, "../SearchField.tsx"),
  "utf8"
);
const css = readFileSync(
  resolve(__dirname, "../search-field.css"),
  "utf8"
);
const chrome = readFileSync(
  resolve(__dirname, "../../../styles/globals-chrome.css"),
  "utf8"
);

describe("SearchField UXDS kit", () => {
  it("stamps search icon marker + icon position + single clear", () => {
    expect(kit).toMatch(/data-studio-search-icon\s*=\s*["']true["']/);
    expect(kit).toMatch(/data-studio-search-icon-pos/);
    expect(kit).toMatch(/data-studio-search-clear\s*=\s*["']true["']/);
    expect(kit).toMatch(/iconPosition\s*=\s*["']end["']/);
    expect(kit).toMatch(/type="text"/);
    expect(kit).not.toMatch(/type="search"/);
  });

  it("keeps magnifier borderless (no Make overlay box on icon)", () => {
    expect(css).toMatch(
      /\.uxds-search-field__icon\s*\{[\s\S]*?border:\s*none\s*!important/
    );
    expect(css).toMatch(
      /\.uxds-search-field__icon\s*\{[\s\S]*?box-shadow:\s*none\s*!important/
    );
    // Make Text Field hover must target absolute border overlay only
    expect(chrome).toMatch(
      /\[data-name="Text Field"\]\s*>\s*\[aria-hidden\]\.absolute/
    );
    expect(chrome).not.toMatch(
      /\[data-name="Text Field"\]\s*>\s*\[aria-hidden\],/
    );
  });
});
