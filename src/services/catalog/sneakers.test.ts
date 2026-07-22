import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FALLBACK_SNEAKERS,
  getAllSneakerSlugs,
  getSneakerBySlug,
  getTrackedCatalog,
  TOP_SELLERS_LIMIT,
} from "@/services/catalog/sneakers";

describe("catalog", () => {
  beforeEach(() => {
    vi.stubEnv("KICKSDB_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to Dark Mocha when no API key is set", async () => {
    const mocha = await getSneakerBySlug("air-jordan-1-retro-high-dark-mocha");
    expect(mocha?.ticker).toBe("J1DMCH");
    expect(mocha?.featured).toBe(true);
  });

  it("exposes all slugs for static params", async () => {
    const slugs = await getAllSneakerSlugs();
    expect(slugs).toEqual(FALLBACK_SNEAKERS.map((s) => s.slug));
    expect(slugs.length).toBeGreaterThanOrEqual(1);
  });

  it("returns null for unknown slug without API access", async () => {
    expect(await getSneakerBySlug("not-a-real-shoe")).toBeNull();
  });

  it("caps tracked catalog at top sellers limit", async () => {
    const catalog = await getTrackedCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(1);
    expect(catalog.length).toBeLessThanOrEqual(TOP_SELLERS_LIMIT);
  });
});
