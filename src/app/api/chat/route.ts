import { getOpenAIClient } from "@/lib/openai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProviderId =
  | "openai"
  | "openrouter"
  | "groq"
  | "together"
  | "fireworks"
  | "deepseek"
  | "mistral"
  | "anthropic"
  | "gemini"
  | "cohere"
  | "ollama"
  | "custom";

type ChatRequest = {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  apiKey?: string;
  provider?: ProviderId;
  baseUrl?: string;
};

const openAiCompatibleBaseUrls: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  together: "https://api.together.xyz/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  deepseek: "https://api.deepseek.com/v1",
  mistral: "https://api.mistral.ai/v1",
};

export const runtime = "nodejs";

function ensureApiKey(apiKey?: string) {
  if (!apiKey?.trim()) {
    return null;
  }
  return apiKey.trim();
}

export async function POST(req: Request) {
  let body: ChatRequest | null = null;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body?.messages || !Array.isArray(body.messages)) {
    return Response.json(
      { error: "Messages array is required." },
      { status: 400 },
    );
  }

  const provider = body.provider ?? "openai";
  const systemPrompt = body.systemPrompt?.trim();
  const model = body.model ?? "gpt-4.1-mini";
  const temperature =
    typeof body.temperature === "number" ? body.temperature : 0.6;

  try {
    if (
      provider === "openai" ||
      provider === "openrouter" ||
      provider === "groq" ||
      provider === "together" ||
      provider === "fireworks" ||
      provider === "deepseek" ||
      provider === "mistral" ||
      provider === "custom"
    ) {
      const baseURL =
        provider === "custom"
          ? body.baseUrl?.trim()
          : openAiCompatibleBaseUrls[provider];

      if (provider === "custom" && !baseURL) {
        return Response.json(
          { error: "Custom base URL is required." },
          { status: 400 },
        );
      }

      const apiKey =
        provider === "openai"
          ? ensureApiKey(body.apiKey) ?? process.env.OPENAI_API_KEY
          : ensureApiKey(body.apiKey);

      if (!apiKey) {
        return Response.json({ error: "API key is required." }, { status: 400 });
      }

      const client = getOpenAIClient({ apiKey, baseURL });
      const messages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...body.messages]
        : body.messages;

      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
      });

      const text = response.choices?.[0]?.message?.content ?? "";
      return Response.json({
        text,
        usage: response.usage ?? null,
        model: response.model ?? model,
      });
    }

    if (provider === "anthropic") {
      const apiKey = ensureApiKey(body.apiKey);
      if (!apiKey) {
        return Response.json({ error: "API key is required." }, { status: 400 });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          temperature,
          system: systemPrompt ?? undefined,
          messages: body.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return Response.json(
          { error: data?.error?.message ?? "Anthropic API error." },
          { status: response.status },
        );
      }

      const text = data?.content?.[0]?.text ?? "";
      return Response.json({ text, usage: data?.usage ?? null, model });
    }

    if (provider === "gemini") {
      const apiKey = ensureApiKey(body.apiKey);
      if (!apiKey) {
        return Response.json({ error: "API key is required." }, { status: 400 });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: body.messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
            system_instruction: systemPrompt
              ? { parts: [{ text: systemPrompt }] }
              : undefined,
            generationConfig: {
              temperature,
            },
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        return Response.json(
          { error: data?.error?.message ?? "Gemini API error." },
          { status: response.status },
        );
      }

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return Response.json({ text, usage: null, model });
    }

    if (provider === "cohere") {
      const apiKey = ensureApiKey(body.apiKey);
      if (!apiKey) {
        return Response.json({ error: "API key is required." }, { status: 400 });
      }

      const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: systemPrompt
            ? [
                { role: "system", content: systemPrompt },
                ...body.messages.map((message) => ({
                  role: message.role,
                  content: message.content,
                })),
              ]
            : body.messages.map((message) => ({
                role: message.role,
                content: message.content,
              })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return Response.json(
          { error: data?.error?.message ?? "Cohere API error." },
          { status: response.status },
        );
      }

      const text = data?.message?.content?.[0]?.text ?? "";
      return Response.json({ text, usage: null, model });
    }

    if (provider === "ollama") {
      const baseUrl = body.baseUrl?.trim() || "http://localhost:11434";
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: systemPrompt
            ? [{ role: "system", content: systemPrompt }, ...body.messages]
            : body.messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return Response.json(
          { error: data?.error ?? "Ollama API error." },
          { status: response.status },
        );
      }

      const text = data?.message?.content ?? "";
      return Response.json({ text, usage: null, model });
    }

    return Response.json({ error: "Unsupported provider." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Provider request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
