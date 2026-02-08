import OpenAI from "openai";

export function getOpenAIClient(apiKey?: string) {
  const key = apiKey?.trim() || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("Missing OpenAI API key.");
  }
  return new OpenAI({ apiKey: key });
}
