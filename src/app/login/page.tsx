"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const userStorage = "ozzgpt:user";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const existing = window.localStorage.getItem(userStorage);
    if (existing) {
      router.replace("/app");
    }
  }, [router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    const user = {
      email: email.trim(),
      name: name.trim() || email.trim(),
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(userStorage, JSON.stringify(user));
    router.replace("/app");
  };

  return (
    <div className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] px-8 py-10 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Secure Workspace
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
              Sign in to UnlockedGPT
            </h1>
            <p className="max-w-2xl text-base text-[var(--muted)] md:text-lg">
              This lightweight login keeps the interface organized for each
              operator. No server storage, no tracking.
            </p>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Login</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This is a local-only login stored in your browser. For real auth,
              connect a provider later.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Name
                </label>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Email
                </label>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <button
                className="rounded-full bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                Continue
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <h3 className="text-lg font-semibold text-[var(--ink)]">
              What you get
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>Prompt studio with presets and training tips.</li>
              <li>BYOK mode: use your own OpenAI API key.</li>
              <li>Fine-tune dataset builder with JSONL export.</li>
            </ul>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-xs text-[var(--muted)]">
              This login is local-only. It does not authenticate with OpenAI.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
