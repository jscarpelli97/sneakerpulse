"use client";

import { useMemo, useState } from "react";
import { SizeAsksTable } from "@/components/market/SizeAsksTable";
import { SizeSelector } from "@/components/market/SizeSelector";
import type { SizeAsk, SneakerMarket } from "@/types/market";

export function MarketSizeSection({ market }: { market: SneakerMarket }) {
  const [focused, setFocused] = useState<SizeAsk | null>(null);
  const sizes = useMemo(() => {
    if (!focused) return market.sizes;
    return market.sizes.filter((size) => size.size === focused.size);
  }, [focused, market.sizes]);

  return (
    <div className="space-y-4">
      <SizeSelector market={market} onSizeChange={setFocused} />
      <SizeAsksTable sizes={sizes} />
    </div>
  );
}
