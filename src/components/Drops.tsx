type Drop = {
  name: string;
  brand: string;
  date: string;
  heat: number;
  retail: string;
  status: "Live" | "Soon" | "Restock";
};

const drops: Drop[] = [
  {
    name: "Air Jordan 1 Retro High OG “Shadow”",
    brand: "Jordan",
    date: "Jul 24 · 10:00 AM ET",
    heat: 96,
    retail: "$180",
    status: "Live",
  },
  {
    name: "Nike Pegasus Premium Trail",
    brand: "Nike",
    date: "Jul 26 · 8:00 AM ET",
    heat: 82,
    retail: "$160",
    status: "Soon",
  },
  {
    name: "New Balance 1906R “Silver Metallic”",
    brand: "New Balance",
    date: "Jul 28 · 12:00 PM ET",
    heat: 89,
    retail: "$155",
    status: "Soon",
  },
  {
    name: "Adidas Samba Megastore Exclusive",
    brand: "Adidas",
    date: "Jul 22 · Restock window",
    heat: 91,
    retail: "$100",
    status: "Restock",
  },
];

function statusColor(status: Drop["status"]) {
  if (status === "Live") return "text-heat";
  if (status === "Restock") return "text-ink-soft";
  return "text-ink/55";
}

export function Drops() {
  return (
    <section id="drops" className="bg-paper px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink/45">
            Live board
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            What&apos;s pulsing now
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            A focused feed of upcoming and active releases ranked by heat—not
            hype noise.
          </p>
        </div>

        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {drops.map((drop) => (
            <li
              key={drop.name}
              className="group grid gap-3 py-6 transition-colors hover:bg-white/50 md:grid-cols-[1fr_auto] md:items-center md:gap-8 md:py-7"
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  <span className={statusColor(drop.status)}>{drop.status}</span>
                  <span className="text-ink/35">{drop.brand}</span>
                </div>
                <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-ink md:text-2xl">
                  {drop.name}
                </h3>
                <p className="mt-2 text-sm text-ink-soft">{drop.date}</p>
              </div>
              <div className="flex items-end gap-8 md:text-right">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink/40">
                    Retail
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {drop.retail}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink/40">
                    Heat
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-extrabold text-ink">
                    {drop.heat}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
