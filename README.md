# OZZGPT Console

A human-crafted interface layer for ChatGPT with a login screen, BYOK support (bring your own OpenAI key), prompt presets, a fine-tune studio, and a Puter SDK demo.

Live app: https://unlockedgpt.vercel.app

## Features

- Local login page (client-side only)
- BYOK key vault stored in the browser
- Chat UI with temperature and model controls
- Prompt studio with presets
- Fine-tune dataset builder with JSONL export
- Fine-tune job creation from the UI
- Puter SDK demo call

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## BYOK (Bring Your Own Key)

Users paste their own OpenAI API key in the app. The key is stored in browser storage and sent to the server only when making OpenAI requests. It is not stored on the server.

If you want to run a shared server key instead, set `OPENAI_API_KEY` in `.env.local` and skip BYOK.

## Environment

Optional server key (for shared usage):

```bash
OPENAI_API_KEY=your_key_here
```

Restart `npm run dev` after changing env variables.

## Fine-tuning

1. Add training pairs in the Fine-tune Studio.
2. Download or upload the JSONL dataset.
3. Use the file id to create a fine-tune job.

Note: Only certain models support fine-tuning. Update the model field to a supported one for your account.

## Routes

- `/` - Landing page
- `/login` - Local login
- `/app` - Chat + prompt training + fine-tune studio
- `/api/chat` - OpenAI Responses API proxy
- `/api/fine-tune/upload` - Upload JSONL dataset
- `/api/fine-tune/create` - Create a fine-tune job

## Deployment

Deploy on Vercel or any Next.js host. Add `OPENAI_API_KEY` if you want a shared server key.
