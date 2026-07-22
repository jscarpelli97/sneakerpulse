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

  it("falls back to the free offline catalog when no API key is set", async () => {
    const featured = await getSneakerBySlug(FALLBACK_SNEAKERS[0]!.slug);
    expect(featured?.slug).toBe(FALLBACK_SNEAKERS[0]!.slug);
    expect(FALLBACK_SNEAKERS.length).toBeGreaterThan(50);
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
