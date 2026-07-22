const pulses = [
  {
    label: "Velocity",
    value: "+38%",
    detail: "Week-over-week search lift on trail silhouettes",
  },
  {
    label: "Retail win rate",
    value: "62%",
    detail: "Average success rate for alerted Live drops",
  },
  {
    label: "Coverage",
    value: "140+",
    detail: "Active SKUs monitored across major retailers",
  },
];

export function Pulse() {
  return (
    <section id="pulse" className="bg-paper-deep px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink/45">
            Market pulse
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Read the room in real time
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            One snapshot of demand so you can prioritize the pair—not the
            rumor thread.
          </p>
        </div>

        <div className="grid gap-10 border-t border-ink/10 pt-10 md:grid-cols-3 md:gap-8">
          {pulses.map((item) => (
            <div key={item.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">
                {item.label}
              </p>
              <p className="mt-3 font-[family-name:var(--font-syne)] text-5xl font-extrabold tracking-tight text-ink md:text-6xl">
                {item.value}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
