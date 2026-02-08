"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const defaultPrompt = `You are UnlockedGPT, a calm, direct assistant.
You speak with confident brevity and give actionable steps.
If the user asks for a build plan, you respond with a crisp plan and then ask a concrete question.`;

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to UnlockedGPT. Drop your prompt, and tune the system instructions on the right.",
    },
  ]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt);
  const [model, setModel] = useState("gpt-4.1-mini");
  const [temperature, setTemperature] = useState(0.6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const draftKey = "unlockedgpt:prompt";

  useEffect(() => {
    const stored = window.localStorage.getItem(draftKey);
    if (stored) {
      setSystemPrompt(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(draftKey, systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const sendMessage = async () => {
    if (!canSend) return;
    setError(null);
    const nextMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, nextMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, nextMessage],
          systemPrompt,
          model,
          temperature,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Request failed.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text ?? "" },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] px-8 py-10 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Prompt Trained Interface
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
              UnlockedGPT Interface Layer
            </h1>
            <p className="max-w-2xl text-base text-[var(--muted)] md:text-lg">
              A human-crafted application layer for ChatGPT. Tune behavior with
              your prompt, ship an elegant GitHub-ready interface, and iterate
              fast.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              Built with Next.js + Tailwind
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              OpenAI API Route
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              Local Prompt Memory
            </span>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="flex h-full flex-col rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-[var(--shadow)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ink)]">
                  Dialogue
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  The assistant responds using your prompt settings.
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Live
              </span>
            </div>

            <div className="mt-5 flex flex-1 flex-col gap-4 overflow-hidden">
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.role}-${index}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:text-base ${
                      msg.role === "user"
                        ? "ml-auto bg-[var(--accent)] text-white"
                        : "bg-[var(--panel)] text-[var(--ink)]"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className="max-w-[70%] rounded-2xl bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
                    Thinking...
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white/90 p-4">
                <textarea
                  className="min-h-[96px] w-full resize-none bg-transparent text-sm text-[var(--ink)] outline-none md:text-base"
                  placeholder="Ask for a build, a strategy, or a deep dive..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--muted)]">
                    Press Enter to send • Shift + Enter for a new line
                  </p>
                  <button
                    className="rounded-full bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void sendMessage()}
                    disabled={!canSend}
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
                {error && (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                Prompt Studio
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                This is your training layer. Edit the system prompt to shape
                tone, rules, and output quality.
              </p>
              <textarea
                className="mt-4 min-h-[200px] w-full rounded-2xl border border-[var(--border)] bg-white/80 p-3 text-sm text-[var(--ink)] outline-none"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
              />
              <div className="mt-4 grid gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Model
                </label>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--ink)]"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="gpt-4.1-mini"
                />
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Temperature
                </label>
                <input
                  className="w-full accent-[var(--accent)]"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={temperature}
                  onChange={(event) =>
                    setTemperature(Number(event.target.value))
                  }
                />
                <div className="text-sm text-[var(--muted)]">
                  Current: {temperature.toFixed(2)}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                Prompt Training Tips
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <li>Be explicit about tone and formatting preferences.</li>
                <li>Define what the assistant should refuse or avoid.</li>
                <li>Give a 3-5 line example of the ideal response style.</li>
              </ul>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
