# UnlockedGPT Interface

A clean, human-crafted application layer for ChatGPT. It ships with a prompt studio for training-by-prompting, a modern UI, and a server route that calls the OpenAI API safely from the backend.

## Features

- Prompt studio with local prompt memory
- Chat UI with temperature and model controls
- Server-side OpenAI API proxy
- Next.js App Router + Tailwind setup

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create a `.env.local` file and add your OpenAI key:

```bash
OPENAI_API_KEY=your_key_here
```

## Project Structure

- `src/app/page.tsx` — UI + prompt studio
- `src/app/api/chat/route.ts` — OpenAI API route
- `src/app/globals.css` — design system + global styles

## Deployment

Any Next.js host will work. If you use Vercel, add the `OPENAI_API_KEY` environment variable in your project settings.
