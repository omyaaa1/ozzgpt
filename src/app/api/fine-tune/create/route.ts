import { getOpenAIClient } from "@/lib/openai";

type CreateRequest = {
  trainingFileId: string;
  model: string;
  apiKey?: string;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: CreateRequest | null = null;
  try {
    body = (await req.json()) as CreateRequest;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body?.trainingFileId?.trim()) {
    return Response.json(
      { error: "trainingFileId is required." },
      { status: 400 },
    );
  }

  if (!body?.model?.trim()) {
    return Response.json({ error: "model is required." }, { status: 400 });
  }

  try {
    const client = getOpenAIClient({ apiKey: body.apiKey });
    const job = await client.fineTuning.jobs.create({
      training_file: body.trainingFileId.trim(),
      model: body.model.trim(),
      method: {
        type: "supervised",
      },
    });
    return Response.json({ jobId: job.id, status: job.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create job.";
    return Response.json({ error: message }, { status: 500 });
  }
}
