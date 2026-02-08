# OZZGPT Console

A human-crafted interface layer for ChatGPT with a login screen, BYOK support (bring your own API keys), a multi-provider vault, prompt presets, a fine-tune studio, and a Puter SDK demo.

Live app: https://unlockedgpt.vercel.app

## Features

- Local login page (client-side only)
- Multi-provider BYOK vault
- Chat UI with temperature and model controls
- Prompt studio with presets
- Fine-tune dataset builder with JSONL export (OpenAI)
- Fine-tune job creation from the UI (OpenAI)
- Puter SDK demo call

## Supported Providers

- OpenAI (server key or BYOK)
- OpenRouter (gateway)
- Groq
- Together
- Fireworks
- DeepSeek
- Mistral
- Anthropic (Claude)
- Google Gemini
- Cohere
- Ollama (local)
- Custom OpenAI-compatible base URL

Note: Some platforms (e.g., GitHub Copilot) do not offer a public API that third-party apps can call.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## BYOK (Bring Your Own Key)

Users paste their own API keys in the app. Keys are stored in browser storage and sent to the server only when making provider requests. They are not stored on the server.

If you want to run a shared OpenAI server key instead, set `OPENAI_API_KEY` in `.env.local`.

## Environment

Optional OpenAI server key (shared usage):

```bash
OPENAI_API_KEY=your_key_here
```

Restart `npm run dev` after changing env variables.

## Fine-tuning

1. Add training pairs in the Fine-tune Studio.
2. Download or upload the JSONL dataset.
3. Use the file id to create a fine-tune job.

Note: Fine-tuning is currently wired for OpenAI only.

## Routes

- `/` - Landing page
- `/login` - Local login
- `/app` - Multi-provider chat + prompt studio + fine-tune
- `/api/chat` - Multi-provider chat proxy
- `/api/fine-tune/upload` - Upload JSONL dataset (OpenAI)
- `/api/fine-tune/create` - Create a fine-tune job (OpenAI)

## Deployment

Deploy on Vercel or any Next.js host. Add `OPENAI_API_KEY` if you want a shared OpenAI key.
