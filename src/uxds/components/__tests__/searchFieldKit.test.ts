import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const kit = readFileSync(
  resolve(__dirname, "../SearchField.tsx"),
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
});
