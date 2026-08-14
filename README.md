# DevDash

Your personal command center for software development.

DevDash connects engineering activity from GitHub, GitLab, Bitbucket, CI/CD, and calendar tools, then turns it into:

- What Needs Me (ranked actions)
- Developer activity
- Focus estimates
- Transparent Dev Health signals
- Week in Code / Month in Code narratives
- AI standups, retrospectives, and impact summaries

DevDash is **personal-first**. Data belongs to the developer. Insights are private. Sharing is opt-in.

The UI is the original Figma frontend (kept under `figma-original/` for reference). This repository adds the production backend without replacing that design.

## Features

- GitHub OAuth (Auth.js) with optional email/password
- Extensible integrations: GitHub, GitLab, Bitbucket, GitHub Actions, GitLab CI, CircleCI, Jenkins, Slack, Google Calendar
- Normalized `ActivityEvent` model and provider adapters
- Incremental GitHub sync with pagination and rate-limit handling
- What Needs Me ranking engine
- Rule-based Dev Health (not an ML model, not a medical diagnosis)
- Focus analytics labeled as derived estimates
- Gemini-powered assistant with a controlled context layer
- Standups, retrospectives, and private engineering impact summaries
- Privacy controls and revocable share links
- Render-ready PostgreSQL + Prisma migrations

## Architecture

```
Figma UI (React + Tailwind)
        │
Next.js App Router
        │
API routes  ── Prisma ── PostgreSQL
        │
Adapters: GitHub / GitLab / Bitbucket
Engines: actions, health, focus, metrics
AI: Gemini (server-only)
```

## Tech stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL
- Auth.js (NextAuth v5)
- Google Gemini
- Lucide icons + Recharts (from the Figma UI)

## Local setup

```bash
docker compose up -d
cp .env.example .env
# fill AUTH_SECRET, GITHUB_ID, GITHUB_SECRET, DATABASE_URL, GEMINI_API_KEY
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

`DATABASE_URL` for the included Compose file:

```
postgresql://devdash:devdash@localhost:5432/devdash?schema=public
```

## Environment variables

See `.env.example`.

Required:

- `DATABASE_URL`
- `AUTH_SECRET`
- `GITHUB_ID` / `GITHUB_SECRET`
- `GEMINI_API_KEY` (for AI language; the app still works without it using grounded fallbacks)

Optional:

- `GITLAB_ID` / `GITLAB_SECRET`
- `BITBUCKET_ID` / `BITBUCKET_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET`
- `CRON_SECRET`

Never commit `.env`.

## GitHub OAuth

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Homepage URL: `http://localhost:3000` (or your Render URL)
3. Callback URL: `http://localhost:3000/api/auth/callback/github`
4. Requested scopes: `read:user user:email repo`

## Gemini

Create an API key in Google AI Studio and set `GEMINI_API_KEY`. Keys never leave the server. Users can disable AI in Settings.

## Prisma

```bash
npx prisma generate
npx prisma validate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

## Production / Render

1. Create a PostgreSQL database and a Node web service.
2. Set environment variables from `.env.example`.
3. Set `AUTH_URL` to the public https URL.
4. GitHub callback: `https://YOUR-SERVICE.onrender.com/api/auth/callback/github`
5. Build: `npm install && npx prisma generate && npm run build`
6. Start: `npx prisma migrate deploy && npm start`

`render.yaml` is included. Cron hits `/api/cron/sync` so large GitHub syncs can move to a worker.

Production commands:

```bash
npm run build
npm start
```

## Mock data

Original Figma fixtures live in `lib/mock/` and are **not** used by production pages. Empty states appear until a real integration syncs.

## Product principle

DATA → CONTEXT → INSIGHT → ACTION

GitHub events become a Week in Code narrative, Dev Health signals, Focus windows, ranked What Needs Me items, and grounded AI answers — without inventing work and without turning developers into a surveillance dashboard.
