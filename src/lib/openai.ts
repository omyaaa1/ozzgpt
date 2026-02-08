import OpenAI from "openai";

type OpenAIClientOptions = {
  apiKey?: string;
  baseURL?: string;
};

export function getOpenAIClient(options: OpenAIClientOptions = {}) {
  const apiKey = options.apiKey?.trim() || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key.");
  }
  return new OpenAI({
    apiKey,
    baseURL: options.baseURL,
  });
}
