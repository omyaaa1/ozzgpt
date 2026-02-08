import { getOpenAIClient } from "@/lib/openai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  apiKey?: string;
};

export const runtime = "nodejs";

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

  const systemPrompt = body.systemPrompt?.trim();
  const model = body.model ?? "gpt-4.1-mini";
  const temperature =
    typeof body.temperature === "number" ? body.temperature : 0.6;

  try {
    const client = getOpenAIClient(body.apiKey);
    const response = await client.responses.create({
      model,
      instructions: systemPrompt,
      temperature,
      input: body.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    return Response.json({
      text: response.output_text ?? "",
      usage: response.usage ?? null,
      model: response.model ?? model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI API error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
