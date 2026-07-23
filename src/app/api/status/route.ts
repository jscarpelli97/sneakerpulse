import { NextResponse } from "next/server";
import { kicksLiveReadsEnabled } from "@/lib/dataMode";
import { getCacheStats } from "@/lib/kicksdb/cache";
import { getKicksApiKey } from "@/lib/kicksdb/client";
import { getRecentFetchLogs } from "@/lib/kicksdb/logger";
import { getKicksQuota } from "@/lib/kicksdb/quota";

/**
 * Public health: coarse status only.
 * Detailed cache/logs require STATUS_TOKEN header matching env STATUS_TOKEN.
 */
export async function GET(request: Request) {
  const hasKey = Boolean(getKicksApiKey());
  const logs = getRecentFetchLogs(15);
  const recentFailure = logs.find((log) => log.status !== 200);
  const status = !hasKey
    ? "cached"
    : recentFailure
      ? "degraded"
      : "live";

  const token = process.env.STATUS_TOKEN?.trim();
  const provided = request.headers.get("x-status-token")?.trim();
  const detailed = Boolean(token && provided && provided === token);

  if (!detailed) {
    return NextResponse.json({
      ok: true,
      status,
    });
  }

  const quota = await getKicksQuota();

  return NextResponse.json({
    ok: true,
    status,
    hasKey,
    liveReads: kicksLiveReadsEnabled(),
    mode: hasKey
      ? kicksLiveReadsEnabled()
        ? "live_api"
        : "snapshot_plus_key"
      : "free_offline_catalog",
    quota,
    cache: getCacheStats(),
    recentFetches: logs,
  });
}
