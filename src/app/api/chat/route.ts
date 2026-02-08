type ChatMessage = {
  role: "user" | "assistant" | "system" | "developer";
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY on the server." },
      { status: 500 },
    );
  }

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

  const systemPrompt = body.systemPrompt?.trim();
  const messages = systemPrompt
    ? [{ role: "developer", content: systemPrompt }, ...body.messages]
    : body.messages;

  const payload = {
    model: body.model ?? "gpt-4.1-mini",
    messages,
    temperature:
      typeof body.temperature === "number" ? body.temperature : 0.6,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: data?.error?.message ?? "OpenAI API error." },
      { status: response.status },
    );
  }

  const text = data?.choices?.[0]?.message?.content ?? "";
  return Response.json({
    text,
    usage: data?.usage ?? null,
    model: data?.model ?? payload.model,
  });
}
