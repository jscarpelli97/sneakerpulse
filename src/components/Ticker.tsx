const tickerItems = [
  "Jordan 1 Retro High OG — Heat 94",
  "Nike Dunk Low City Pack — Heat 81",
  "New Balance 990v6 — Heat 76",
  "Adidas Samba OG — Heat 88",
  "Asics Gel-Kayano 14 — Heat 79",
  "Salomon XT-6 Gore-Tex — Heat 85",
];

export function Ticker() {
  const loop = [...tickerItems, ...tickerItems];

  return (
    <div className="overflow-hidden border-y border-ink/10 bg-paper-deep py-3">
      <div className="animate-ticker flex w-max gap-10 whitespace-nowrap">
        {loop.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-3 text-sm font-medium text-ink-soft"
          >
            <span className="inline-block h-1.5 w-1.5 bg-heat animate-blink" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
