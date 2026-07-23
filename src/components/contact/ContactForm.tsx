import { useState, type FormEvent } from "react";
import { CONTACT_TOPICS } from "@/lib/contact";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>("feedback");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, company }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not send — try again");
        return;
      }
      setSent(true);
      setMessage("");
    } catch {
      setError("Could not send — try again");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-xl border border-dash-border bg-dash-elevated/40 px-4 py-3 text-sm text-dash-muted">
        Thanks — message received. I&apos;ll read it when I can.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-dash-faint">
          Name <span className="text-dash-faint/70">(optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm text-dash-text outline-none hover:border-dash-muted focus:border-dash-accent"
            autoComplete="name"
          />
        </label>
        <label className="block text-xs text-dash-faint">
          Your email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm text-dash-text outline-none hover:border-dash-muted focus:border-dash-accent"
            autoComplete="email"
            placeholder="so I can reply"
          />
        </label>
      </div>
      <label className="block text-xs text-dash-faint">
        Topic
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm text-dash-text outline-none hover:border-dash-muted focus:border-dash-accent"
        >
          {CONTACT_TOPICS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-dash-faint">
        Message
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-xl border border-dash-border bg-dash-elevated px-3 py-2 text-sm text-dash-text outline-none hover:border-dash-muted focus:border-dash-accent"
          placeholder="What’s on your mind?"
        />
      </label>
      {/* Honeypot */}
      <label className="hidden" aria-hidden="true">
        Company
        <input
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-dash-down">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
