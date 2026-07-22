import { NextResponse } from "next/server";
import { getBitcoinUsdPrice } from "@/lib/btc/price";

export const revalidate = 300;

export async function GET() {
  const quote = await getBitcoinUsdPrice();
  return NextResponse.json({ ok: true, data: quote });
}
