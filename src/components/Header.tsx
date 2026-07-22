const navLinks = [
  { href: "#drops", label: "Drops" },
  { href: "#signal", label: "Signal" },
  { href: "#pulse", label: "Pulse" },
];

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8 md:py-6">
        <a
          href="#top"
          className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-white md:text-xl"
        >
          SneakerPulse
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#cta"
          className="bg-signal px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-signal-deep"
        >
          Get alerts
        </a>
      </div>
    </header>
  );
}
