import { cookies } from "next/headers";
import { PLUS_COOKIE } from "@/lib/plus/config";
import { verifyPlusMembership } from "@/lib/plus/membership";
import { HOMEPAGE_WATCHLIST_LIMIT } from "@/services/catalog/mapProductToCatalog";

/** Free users only see this many top-ranked pairs across markets / tools. */
export const FREE_CATALOG_LIMIT = HOMEPAGE_WATCHLIST_LIMIT;

export async function getPlusAccess() {
  const jar = await cookies();
  const member = await verifyPlusMembership(jar.get(PLUS_COOKIE)?.value);
  return {
    isPlus: Boolean(member),
    member,
  };
}

export function gateCatalogRows<T>(rows: T[], isPlus: boolean) {
  const total = rows.length;
  if (isPlus || total <= FREE_CATALOG_LIMIT) {
    return {
      rows,
      gated: false as const,
      visible: total,
      total,
      freeLimit: FREE_CATALOG_LIMIT,
      isPlus,
    };
  }
  return {
    rows: rows.slice(0, FREE_CATALOG_LIMIT),
    gated: true as const,
    visible: FREE_CATALOG_LIMIT,
    total,
    freeLimit: FREE_CATALOG_LIMIT,
    isPlus,
  };
}
