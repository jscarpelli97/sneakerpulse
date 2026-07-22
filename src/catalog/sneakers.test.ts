import { describe, expect, it } from "vitest";
import { getSneakerBySlug, getAllSneakerSlugs, SNEAKERS } from "@/catalog/sneakers";

describe("catalog", () => {
  it("includes Dark Mocha as featured entry", () => {
    const mocha = getSneakerBySlug("air-jordan-1-retro-high-dark-mocha");
    expect(mocha?.ticker).toBe("J1-DMCH");
    expect(mocha?.featured).toBe(true);
  });

  it("exposes all slugs for static params", () => {
    expect(getAllSneakerSlugs()).toEqual(SNEAKERS.map((s) => s.slug));
    expect(getAllSneakerSlugs().length).toBeGreaterThanOrEqual(1);
  });

  it("returns null for unknown slug", () => {
    expect(getSneakerBySlug("not-a-real-shoe")).toBeNull();
  });
});
