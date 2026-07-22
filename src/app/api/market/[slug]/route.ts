import { NextResponse } from "next/server";
import { getMarketBySlug } from "@/services/market/getMarketBySlug";

export const revalidate = 300;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const result = await getMarketBySlug(slug);
  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "missing_key"
          ? 503
          : 502;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
