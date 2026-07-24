import { describe, expect, it, beforeEach, vi } from "vitest";

describe("kicks quota", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    // Force in-memory counter so tests never touch Neon.
    vi.stubEnv("DATABASE_URL", "");
    globalThis.__spiKicksQuotaMem = undefined;
  });

  it("defaults to a 1000 monthly limit with snapshot reserve", async () => {
    const {
      kicksMonthlyLimit,
      kicksSnapshotReserve,
      kicksAppLimit,
    } = await import("@/lib/kicksdb/quota");
    expect(kicksMonthlyLimit()).toBe(1000);
    expect(kicksSnapshotReserve()).toBe(200);
    expect(kicksAppLimit()).toBe(800);
  });

  it("stops live traffic at the app soft cap", async () => {
    vi.stubEnv("KICKSDB_MONTHLY_LIMIT", "10");
    vi.stubEnv("KICKSDB_SNAPSHOT_RESERVE", "4");
    const { consumeKicksQuota } = await import("@/lib/kicksdb/quota");

    for (let i = 0; i < 6; i += 1) {
      const hit = await consumeKicksQuota(1, "live");
      expect(hit.allowed).toBe(true);
    }
    const blocked = await consumeKicksQuota(1, "live");
    expect(blocked.allowed).toBe(false);
    expect(blocked.used).toBe(6);

    const snap = await consumeKicksQuota(1, "snapshot");
    expect(snap.allowed).toBe(true);
  });

  it("blocks snapshot when the hard monthly limit is reached", async () => {
    vi.stubEnv("KICKSDB_MONTHLY_LIMIT", "3");
    vi.stubEnv("KICKSDB_SNAPSHOT_RESERVE", "0");
    const { consumeKicksQuota } = await import("@/lib/kicksdb/quota");
    expect((await consumeKicksQuota(1, "snapshot")).allowed).toBe(true);
    expect((await consumeKicksQuota(1, "snapshot")).allowed).toBe(true);
    expect((await consumeKicksQuota(1, "snapshot")).allowed).toBe(true);
    expect((await consumeKicksQuota(1, "snapshot")).allowed).toBe(false);
  });
});
