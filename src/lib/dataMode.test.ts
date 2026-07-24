import { afterEach, describe, expect, it, vi } from "vitest";
import { getDataModeLabel, kicksLiveReadsEnabled } from "@/lib/dataMode";

describe("dataMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires KICKSDB_LIVE_READS=1 for live page reads", () => {
    vi.stubEnv("KICKSDB_LIVE_READS", undefined);
    expect(kicksLiveReadsEnabled()).toBe(false);
    vi.stubEnv("KICKSDB_LIVE_READS", "0");
    expect(kicksLiveReadsEnabled()).toBe(false);
    vi.stubEnv("KICKSDB_LIVE_READS", "1");
    expect(kicksLiveReadsEnabled()).toBe(true);
  });

  it("labels live, cached, and offline modes", () => {
    expect(
      getDataModeLabel({
        liveCount: 12,
        cachedCount: 0,
        total: 100,
      }).mode,
    ).toBe("live");

    expect(
      getDataModeLabel({
        liveCount: 0,
        cachedCount: 90,
        total: 100,
        asOf: "2026-07-20",
      }),
    ).toMatchObject({
      mode: "cached",
      badge: "Snapshot",
      subtitle: "Daily snapshot · updated 2026-07-20",
    });

    expect(
      getDataModeLabel({
        liveCount: 0,
        cachedCount: 0,
        total: 10,
      }).mode,
    ).toBe("offline");
  });
});
