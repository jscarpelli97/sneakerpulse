export function Cta() {
  return (
    <section id="cta" className="bg-signal px-5 py-20 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div className="max-w-xl">
          <h2 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Stay ahead of the next pulse
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/75">
            Join the alert list for Live drop windows, heat spikes, and
            restock flashes—no spam, just signal.
          </p>
        </div>
        <form
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          action="#cta"
          method="get"
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="w-full border border-ink/20 bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink"
          />
          <button
            type="submit"
            className="bg-ink px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get alerts
          </button>
        </form>
      </div>
    </section>
  );
}
