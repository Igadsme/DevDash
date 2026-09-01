# DevDash

DevDash is a developer-first productivity dashboard built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, NextAuth, and OpenAI.

## Features

- GitHub OAuth sign-in with server-side GitHub data fetching
- Ranked "What Needs Me" action list
- Weekly summary grounded in recent GitHub events
- Timeline and focus analysis pages
- Privacy-first settings and local SQLite development

## Local setup

1. Copy `.env.example` to `.env` and fill in GitHub OAuth credentials.
2. Install dependencies with `npm install`.
3. Generate Prisma client with `npm run prisma:generate`.
4. Create the local database with `npm run db:push`.
5. Start the app with `npm run dev`.

## GitHub OAuth setup

- Set the callback URL to `http://localhost:3000/api/auth/callback/github`.
- The MVP requests GitHub scopes needed to read pull requests, issues, and CI status.

## Notes

- Local development uses SQLite via Prisma.
- Weekly summaries fall back to a deterministic grounded summary when `OPENAI_API_KEY` is missing or AI is disabled in settings.
