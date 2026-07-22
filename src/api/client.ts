/**
 * Browser-side API helpers for SneakerPulse Next.js route handlers.
 * Keep Next.js routes in `src/app/api/*`; put shared fetch clients here.
 */

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as T;
}
