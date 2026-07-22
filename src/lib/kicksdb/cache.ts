type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export type CacheStats = {
  hits: number;
  misses: number;
  sets: number;
};

const stats: CacheStats = { hits: 0, misses: 0, sets: 0 };

export function getCacheStats(): CacheStats {
  return { ...stats };
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    stats.misses += 1;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    stats.misses += 1;
    return null;
  }
  stats.hits += 1;
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  stats.sets += 1;
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ data: T; cacheHit: boolean }> {
  const cached = cacheGet<T>(key);
  if (cached != null) {
    return { data: cached, cacheHit: true };
  }
  const data = await loader();
  cacheSet(key, data, ttlMs);
  return { data, cacheHit: false };
}
