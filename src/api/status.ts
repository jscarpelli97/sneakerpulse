import { apiGet } from "@/api/client";

export type StatusApiResponse = {
  ok: boolean;
  status: string;
  hasKey?: boolean;
  cache?: { hits: number; misses: number; sets: number };
  recentFetches?: unknown[];
};

export function fetchStatus() {
  return apiGet<StatusApiResponse>("/api/status");
}
