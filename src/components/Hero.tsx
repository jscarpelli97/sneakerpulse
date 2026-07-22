import Image from "next/image";

export function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] overflow-hidden bg-ink text-white"
    >
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=2400&q=80"
          alt="Sneaker detail under studio light"
          fill
          priority
          className="animate-drift object-cover object-[center_35%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-20 md:pt-32">
        <p className="animate-rise mb-4 font-[family-name:var(--font-syne)] text-5xl font-extrabold leading-[0.9] tracking-tight text-white sm:text-6xl md:text-8xl lg:text-9xl">
          SneakerPulse
        </p>

        <div className="mb-6 h-1 w-40 bg-signal animate-pulse-line md:w-56" />

        <h1 className="animate-rise-delay-1 max-w-xl font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
          Feel the drop before it hits.
        </h1>

        <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
          Live retail signals, heat scores, and countdown intel for the
          releases that actually matter.
        </p>

        <div className="animate-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#drops"
            className="bg-signal px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-signal-deep"
          >
            Browse live drops
          </a>
          <a
            href="#signal"
            className="border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            How signal works
          </a>
        </div>
      </div>
    </section>
  );
}
