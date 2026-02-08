"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const userStorage = "ozzgpt:user";

export default function Home() {
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(userStorage);
    setHasUser(Boolean(existing));
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] px-8 py-10 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Open Interface Layer
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
              OZZGPT Console
            </h1>
            <p className="max-w-2xl text-base text-[var(--muted)] md:text-lg">
              Login, drop in your own API key, and run a fully customizable
              prompt-training workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              BYOK ready
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              Fine-tune studio
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              Prompt presets
            </span>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold text-[var(--ink)]">
              Get started
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This app uses a local login and stores your API key in the
              browser. You stay in control of your usage.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white"
                href={hasUser ? "/app" : "/login"}
              >
                {hasUser ? "Open Console" : "Create Session"}
              </Link>
              <Link
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                href="/login"
              >
                Login
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <h3 className="text-lg font-semibold text-[var(--ink)]">
              Flow overview
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
              <li>Login locally (no server auth).</li>
              <li>Paste your OpenAI API key.</li>
              <li>Chat, prompt-train, or fine-tune.</li>
            </ol>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-xs text-[var(--muted)]">
              Your OpenAI key never gets stored on our server.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
