
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PromptPreset = {
  id: string;
  name: string;
  content: string;
};

type TrainingExample = {
  id: string;
  user: string;
  assistant: string;
};

type ProviderType =
  | "openai_compat"
  | "anthropic"
  | "gemini"
  | "cohere"
  | "ollama";

type Provider = {
  id: string;
  name: string;
  type: ProviderType;
  defaultBaseUrl?: string;
  needsKey: boolean;
};

const providers: Provider[] = [
  { id: "openai", name: "OpenAI", type: "openai_compat", needsKey: true },
  {
    id: "openrouter",
    name: "OpenRouter (gateway)",
    type: "openai_compat",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
  },
  {
    id: "groq",
    name: "Groq",
    type: "openai_compat",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
  },
  {
    id: "together",
    name: "Together",
    type: "openai_compat",
    defaultBaseUrl: "https://api.together.xyz/v1",
    needsKey: true,
  },
  {
    id: "fireworks",
    name: "Fireworks",
    type: "openai_compat",
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    needsKey: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    type: "openai_compat",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    needsKey: true,
  },
  {
    id: "mistral",
    name: "Mistral",
    type: "openai_compat",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    needsKey: true,
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    type: "anthropic",
    needsKey: true,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    type: "gemini",
    needsKey: true,
  },
  {
    id: "cohere",
    name: "Cohere",
    type: "cohere",
    needsKey: true,
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    type: "ollama",
    defaultBaseUrl: "http://localhost:11434",
    needsKey: false,
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    type: "openai_compat",
    needsKey: true,
  },
];

const defaultPrompt = `You are UnlockedGPT, a calm, direct assistant.
You speak with confident brevity and give actionable steps.
If the user asks for a build plan, you respond with a crisp plan and then ask a concrete question.`;

const providerKeyStorage = "ozzgpt:providerKeys";
const providerBaseStorage = "ozzgpt:providerBases";
const providerChoiceStorage = "ozzgpt:providerChoice";
const userStorage = "ozzgpt:user";

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (
          prompt: string,
          options?: { model?: string },
        ) => Promise<string>;
      };
      print?: (message: string) => void;
    };
  }
}

export default function AppPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to OZZGPT. Select a provider, add your key, and prompt away.",
    },
  ]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt);
  const [model, setModel] = useState("gpt-4.1-mini");
  const [temperature, setTemperature] = useState(0.6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [providerId, setProviderId] = useState("openai");
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [providerBases, setProviderBases] = useState<Record<string, string>>(
    {},
  );
  const [keyInput, setKeyInput] = useState("");
  const [baseInput, setBaseInput] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<PromptPreset[]>([]);

  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([
    {
      id: "example-1",
      user: "Explain the project architecture in 3 bullets.",
      assistant:
        "The UI is a Next.js client page.\nThe server routes handle provider requests.\nPrompt settings live in local storage.",
    },
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [trainingFileId, setTrainingFileId] = useState("");
  const [fineTuneModel, setFineTuneModel] = useState("gpt-4.1-mini");
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobStatus, setJobStatus] = useState("");

  const [puterResponse, setPuterResponse] = useState("");
  const [puterError, setPuterError] = useState<string | null>(null);
  const [puterLoading, setPuterLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const draftKey = "unlockedgpt:prompt";
  const presetKey = "unlockedgpt:presets";

  const currentProvider = providers.find(
    (provider) => provider.id === providerId,
  );
  const activeKey = providerKeys[providerId] || "";
  const needsKey = currentProvider?.needsKey ?? true;

  useEffect(() => {
    const storedUser = window.localStorage.getItem(userStorage);
    if (!storedUser) {
      router.replace("/login");
      return;
    }

    const storedPrompt = window.localStorage.getItem(draftKey);
    if (storedPrompt) {
      setSystemPrompt(storedPrompt);
    }

    const storedPresets = window.localStorage.getItem(presetKey);
    if (storedPresets) {
      try {
        const parsed = JSON.parse(storedPresets) as PromptPreset[];
        setPresets(parsed);
      } catch {
        setPresets([]);
      }
    }

    const storedProvider = window.localStorage.getItem(providerChoiceStorage);
    if (storedProvider) {
      setProviderId(storedProvider);
    }

    const storedKeys = window.localStorage.getItem(providerKeyStorage);
    if (storedKeys) {
      try {
        setProviderKeys(JSON.parse(storedKeys) as Record<string, string>);
      } catch {
        setProviderKeys({});
      }
    }

    const storedBases = window.localStorage.getItem(providerBaseStorage);
    if (storedBases) {
      try {
        setProviderBases(JSON.parse(storedBases) as Record<string, string>);
      } catch {
        setProviderBases({});
      }
    }
  }, [router]);

  useEffect(() => {
    window.localStorage.setItem(draftKey, systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    window.localStorage.setItem(presetKey, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    window.localStorage.setItem(providerChoiceStorage, providerId);
    setKeyInput(providerKeys[providerId] || "");
    setBaseInput(
      providerBases[providerId] || currentProvider?.defaultBaseUrl || "",
    );
  }, [
    providerId,
    providerKeys,
    providerBases,
    currentProvider?.defaultBaseUrl,
  ]);

  useEffect(() => {
    window.localStorage.setItem(
      providerKeyStorage,
      JSON.stringify(providerKeys),
    );
  }, [providerKeys]);

  useEffect(() => {
    window.localStorage.setItem(
      providerBaseStorage,
      JSON.stringify(providerBases),
    );
  }, [providerBases]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHasServerKey(Boolean(data?.hasServerKey));
        setHealthError(null);
      } catch (err) {
        setHasServerKey(false);
        setHealthError(
          err instanceof Error ? err.message : "Health check failed.",
        );
      }
    };
    void checkHealth();
  }, []);

  useEffect(() => {
    if (needsKey && !activeKey && providerId !== "openai") {
      setShowKeyModal(true);
      return;
    }
    if (providerId === "openai" && !activeKey && !hasServerKey) {
      setShowKeyModal(true);
      return;
    }
    setShowKeyModal(false);
  }, [providerId, activeKey, needsKey, hasServerKey]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const jsonl = useMemo(() => {
    return trainingExamples
      .filter((example) => example.user.trim() && example.assistant.trim())
      .map((example) =>
        JSON.stringify({
          messages: [
            { role: "user", content: example.user.trim() },
            { role: "assistant", content: example.assistant.trim() },
          ],
        }),
      )
      .join("\n");
  }, [trainingExamples]);

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
          provider: providerId,
          apiKey: activeKey || undefined,
          baseUrl: baseInput || undefined,
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

  const savePreset = () => {
    if (!presetName.trim()) return;
    const id = `preset-${Date.now()}`;
    const next: PromptPreset = {
      id,
      name: presetName.trim(),
      content: systemPrompt,
    };
    setPresets((prev) => [next, ...prev]);
    setPresetName("");
  };

  const applyPreset = (preset: PromptPreset) => {
    setSystemPrompt(preset.content);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== id));
  };

  const addExample = () => {
    setTrainingExamples((prev) => [
      ...prev,
      {
        id: `example-${Date.now()}`,
        user: "",
        assistant: "",
      },
    ]);
  };

  const updateExample = (
    id: string,
    key: "user" | "assistant",
    value: string,
  ) => {
    setTrainingExamples((prev) =>
      prev.map((example) =>
        example.id === id ? { ...example, [key]: value } : example,
      ),
    );
  };

  const removeExample = (id: string) => {
    setTrainingExamples((prev) => prev.filter((example) => example.id !== id));
  };

  const downloadJsonl = () => {
    if (!jsonl.trim()) return;
    const blob = new Blob([jsonl], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "training.jsonl";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const uploadJsonl = async () => {
    if (!jsonl.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/fine-tune/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonl, apiKey: providerKeys.openai || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Upload failed.");
      }
      setTrainingFileId(data.fileId ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const createFineTuneJob = async () => {
    if (!trainingFileId.trim() || !fineTuneModel.trim()) return;
    setCreatingJob(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/fine-tune/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingFileId: trainingFileId.trim(),
          model: fineTuneModel.trim(),
          apiKey: providerKeys.openai || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Fine-tune job failed.");
      }
      setJobId(data.jobId ?? "");
      setJobStatus(data.status ?? "");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fine-tune job failed.";
      setUploadError(message);
    } finally {
      setCreatingJob(false);
    }
  };

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    setProviderKeys((prev) => ({
      ...prev,
      [providerId]: keyInput.trim(),
    }));
    setShowKeyModal(false);
  };

  const handleSaveBase = () => {
    if (!baseInput.trim()) return;
    setProviderBases((prev) => ({
      ...prev,
      [providerId]: baseInput.trim(),
    }));
  };

  const handleClearKey = () => {
    setProviderKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
  };

  const handleSignOut = () => {
    window.localStorage.removeItem(userStorage);
    router.replace("/login");
  };

  const runPuterDemo = async () => {
    setPuterError(null);
    setPuterResponse("");
    if (!window.puter?.ai?.chat) {
      setPuterError("Puter SDK not available.");
      return;
    }
    setPuterLoading(true);
    try {
      const response = await window.puter.ai.chat(
        "What are the benefits of exercise?",
        { model: "gpt-5-nano" },
      );
      setPuterResponse(response);
      if (window.puter.print) {
        window.puter.print(response);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Puter request failed.";
      setPuterError(message);
    } finally {
      setPuterLoading(false);
    }
  };
  return (
    <div className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] px-8 py-10 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Multi-Provider Console
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
              OZZGPT Interface Layer
            </h1>
            <p className="max-w-2xl text-base text-[var(--muted)] md:text-lg">
              Connect your API keys across the top providers. Switch models in
              seconds. Keep prompt training centralized.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              BYOK + server key
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              10+ providers
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1">
              Fine-tune studio
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                activeKey || (providerId === "openai" && hasServerKey)
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {activeKey || (providerId === "openai" && hasServerKey)
                ? "Key Ready"
                : "Key Missing"}
            </span>
            <button
              className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--muted)]"
              onClick={handleClearKey}
            >
              Clear Key
            </button>
            <button
              className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--muted)]"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)]">
                Provider Vault
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Select a provider, add your key, and pick a model. Keys are
                stored locally in your browser.
              </p>
            </div>
            <div className="text-xs text-[var(--muted)]">
              OpenAI server key: {hasServerKey ? "available" : "not set"}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Provider
              </label>
              <select
                className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Model
              </label>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="gpt-4.1-mini"
              />
            </div>

            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                API Key
              </label>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                type="password"
                placeholder={needsKey ? "paste your key" : "not required"}
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
              />
              <button
                className="w-fit rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                onClick={handleSaveKey}
              >
                Save Key
              </button>
            </div>

            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Base URL
              </label>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                value={baseInput}
                onChange={(event) => setBaseInput(event.target.value)}
                placeholder={currentProvider?.defaultBaseUrl || "custom base url"}
              />
              <button
                className="w-fit rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)]"
                onClick={handleSaveBase}
              >
                Save Base URL
              </button>
            </div>
          </div>

          {healthError && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {healthError}
            </p>
          )}
        </section>

        <main className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="flex h-full flex-col rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-[var(--shadow)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ink)]">
                  Dialogue
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Responses come from the selected provider.
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
                    Press Enter to send - Shift + Enter for a new line
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)]">
                    Prompt Studio
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Edit the system prompt to shape tone, rules, and output.
                  </p>
                </div>
              </div>
              <textarea
                className="mt-4 min-h-[200px] w-full rounded-2xl border border-[var(--border)] bg-white/80 p-3 text-sm text-[var(--ink)] outline-none"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
              />
              <div className="mt-4 grid gap-3">
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

              <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Save Preset
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--ink)]"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                  />
                  <button
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    onClick={savePreset}
                  >
                    Save
                  </button>
                </div>
                {presets.length > 0 ? (
                  <div className="grid gap-2">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/70 px-3 py-2 text-sm"
                      >
                        <button
                          className="text-left font-semibold text-[var(--ink)]"
                          onClick={() => applyPreset(preset)}
                        >
                          {preset.name}
                        </button>
                        <button
                          className="text-xs text-[var(--muted)]"
                          onClick={() => deletePreset(preset.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)]">No presets yet.</p>
                )}
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

            <section className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                Puter AI Demo
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Runs a sample call through the Puter SDK.
              </p>
              <button
                className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={runPuterDemo}
                disabled={puterLoading}
              >
                {puterLoading ? "Running..." : "Run Demo"}
              </button>
              {puterResponse && (
                <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2 text-xs text-[var(--muted)]">
                  {puterResponse}
                </div>
              )}
              {puterError && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {puterError}
                </p>
              )}
            </section>
          </aside>
        </main>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                Fine-tune Studio (OpenAI)
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Build a JSONL dataset, upload it to OpenAI, and create a
                fine-tune job. Requires an OpenAI key.
              </p>
            </div>
            <button
              className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              onClick={addExample}
            >
              Add Example
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4">
              {trainingExamples.map((example) => (
                <div
                  key={example.id}
                  className="rounded-2xl border border-[var(--border)] bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[var(--ink)]">
                      Training Pair
                    </h4>
                    <button
                      className="text-xs text-[var(--muted)]"
                      onClick={() => removeExample(example.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    className="mt-3 min-h-[88px] w-full rounded-2xl border border-[var(--border)] bg-white/90 p-3 text-sm text-[var(--ink)] outline-none"
                    placeholder="User message"
                    value={example.user}
                    onChange={(event) =>
                      updateExample(example.id, "user", event.target.value)
                    }
                  />
                  <textarea
                    className="mt-3 min-h-[88px] w-full rounded-2xl border border-[var(--border)] bg-white/90 p-3 text-sm text-[var(--ink)] outline-none"
                    placeholder="Assistant response"
                    value={example.assistant}
                    onChange={(event) =>
                      updateExample(example.id, "assistant", event.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
              <h4 className="text-sm font-semibold text-[var(--ink)]">
                JSONL Preview
              </h4>
              <textarea
                className="mt-3 min-h-[240px] w-full rounded-2xl border border-[var(--border)] bg-white/90 p-3 text-xs text-[var(--ink)] outline-none"
                value={jsonl}
                readOnly
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={downloadJsonl}
                  disabled={!jsonl.trim()}
                >
                  Download JSONL
                </button>
                <button
                  className="rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--ink)] disabled:opacity-50"
                  onClick={uploadJsonl}
                  disabled={!jsonl.trim() || uploading}
                >
                  {uploading ? "Uploading..." : "Upload to OpenAI"}
                </button>
              </div>
              {uploadError && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {uploadError}
                </p>
              )}
              <div className="mt-4 grid gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Training File ID
                </label>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="file-xxxxxxxxxxxx"
                  value={trainingFileId}
                  onChange={(event) => setTrainingFileId(event.target.value)}
                />
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Fine-tune Model
                </label>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="gpt-4.1-mini"
                  value={fineTuneModel}
                  onChange={(event) => setFineTuneModel(event.target.value)}
                />
                <button
                  className="rounded-full bg-[var(--accent-2)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={createFineTuneJob}
                  disabled={
                    !trainingFileId.trim() ||
                    !fineTuneModel.trim() ||
                    creatingJob
                  }
                >
                  {creatingJob ? "Creating..." : "Create Fine-tune Job"}
                </button>
                {jobId && (
                  <div className="rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2 text-xs text-[var(--muted)]">
                    Job: {jobId} {jobStatus ? `(${jobStatus})` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold text-[var(--ink)]">
              Add your API key
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Your key stays in browser storage. It is only used to send
              provider requests.
            </p>
            <input
              className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--ink)]"
              placeholder="paste your key"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                onClick={handleSaveKey}
              >
                Save Key
              </button>
              <button
                className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                onClick={() => setShowKeyModal(false)}
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
