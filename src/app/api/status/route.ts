import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/kicksdb/cache";
import { getKicksApiKey } from "@/lib/kicksdb/client";
import { getRecentFetchLogs } from "@/lib/kicksdb/logger";

export async function GET() {
  const hasKey = Boolean(getKicksApiKey());
  const logs = getRecentFetchLogs(15);
  const recentFailure = logs.find((log) => log.status !== 200);
  const status = !hasKey ? "offline" : recentFailure ? "degraded" : "live";

  return NextResponse.json({
    ok: true,
    status,
    hasKey,
    cache: getCacheStats(),
    recentFetches: logs,
  });
}
