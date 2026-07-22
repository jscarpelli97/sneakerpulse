type FetchLog = {
  at: string;
  path: string;
  status: number | "error";
  cacheHit: boolean;
  ms: number;
  detail?: string;
};

const recent: FetchLog[] = [];
const MAX = 100;

export function logFetch(entry: Omit<FetchLog, "at">) {
  recent.unshift({ ...entry, at: new Date().toISOString() });
  if (recent.length > MAX) recent.pop();
  if (entry.status !== 200 && entry.status !== "error") {
    console.warn(
      `[kicksdb] ${entry.path} status=${entry.status} cacheHit=${entry.cacheHit} ${entry.ms}ms`,
      entry.detail ?? "",
    );
  }
}

export function getRecentFetchLogs(limit = 20) {
  return recent.slice(0, limit);
}
