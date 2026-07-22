export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p
          className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-ink"
        >
          SneakerPulse
        </p>
        <p className="text-sm text-ink/50">
          © {new Date().getFullYear()} SneakerPulse. Built for the drop.
        </p>
        <div className="flex gap-6 text-sm font-medium text-ink-soft">
          <a href="#drops" className="hover:text-ink">
            Drops
          </a>
          <a href="#signal" className="hover:text-ink">
            Signal
          </a>
          <a href="#pulse" className="hover:text-ink">
            Pulse
          </a>
        </div>
      </div>
    </footer>
  );
}
