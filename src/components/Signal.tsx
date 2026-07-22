import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Track the signal",
    body: "We aggregate retail calendars, restock chatter, and early listings into one clean pulse.",
  },
  {
    number: "02",
    title: "Score the heat",
    body: "Every release gets a live heat score based on demand velocity, stock depth, and historical sell-through.",
  },
  {
    number: "03",
    title: "Move on timing",
    body: "Get countdown alerts and status shifts so you can act when the window opens—not after it closes.",
  },
];

export function Signal() {
  return (
    <section id="signal" className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1600&q=80"
          alt="Sneaker midsole and outsole detail"
          fill
          className="object-cover object-center opacity-70"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-signal">
            How it works
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight md:text-5xl">
            Signal over noise
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/70">
            SneakerPulse is built for hunters who want clarity: what&apos;s
            dropping, how hot it is, and when to move.
          </p>

          <ol className="mt-12 space-y-10">
            {steps.map((step) => (
              <li key={step.number} className="grid grid-cols-[auto_1fr] gap-5">
                <span className="font-[family-name:var(--font-syne)] text-2xl font-extrabold text-signal">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-md leading-relaxed text-white/65">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
