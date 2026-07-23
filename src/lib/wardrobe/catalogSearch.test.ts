import { describe, expect, it } from "vitest";

/** Mirror of route token matching for unit coverage without Next runtime. */
function tokenMatch(haystack: string, query: string) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
  const hay = haystack.toLowerCase();
  return tokens.length > 0 && tokens.every((token) => hay.includes(token));
}

describe("catalog search tokens", () => {
  it("matches jordan 1 mocha against Dark Mocha title", () => {
    expect(
      tokenMatch(
        "Air Jordan 1 Retro High Dark Mocha Nike CQ1869",
        "jordan 1 mocha",
      ),
    ).toBe(true);
  });

  it("rejects incomplete token sets", () => {
    expect(tokenMatch("Nike Dunk Low Panda", "jordan mocha")).toBe(false);
  });
});
