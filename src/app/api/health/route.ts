export const runtime = "nodejs";

export async function GET() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  return Response.json({ ok: true, hasServerKey: hasKey });
}
