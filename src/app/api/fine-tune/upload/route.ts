import { createReadStream, promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { getOpenAIClient } from "@/lib/openai";

type UploadRequest = {
  jsonl: string;
  filename?: string;
  apiKey?: string;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: UploadRequest | null = null;
  try {
    body = (await req.json()) as UploadRequest;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body?.jsonl?.trim()) {
    return Response.json(
      { error: "JSONL content is required." },
      { status: 400 },
    );
  }

  const tempDir = os.tmpdir();
  const filename = body.filename?.trim() || `training-${randomUUID()}.jsonl`;
  const filePath = path.join(tempDir, filename);

  try {
    await fs.writeFile(filePath, body.jsonl, "utf8");
    const client = getOpenAIClient(body.apiKey);
    const file = await client.files.create({
      file: createReadStream(filePath),
      purpose: "fine-tune",
    });
    return Response.json({ fileId: file.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload file.";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    try {
      await fs.unlink(filePath);
    } catch {
      // best-effort cleanup
    }
  }
}
