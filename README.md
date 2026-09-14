# DevDash

DevDash is a private, developer-first dashboard built with Next.js, TypeScript, Prisma, NextAuth, GitHub, and OpenAI. GitHub OAuth is both the account-creation and sign-in method: the first authorization creates a DevDash user, and later authorizations sign that same GitHub identity back in.

## Features

- GitHub OAuth account creation and sign-in
- Personal and organization workspace discovery
- Accessible repository list and recent authored commits
- Ranked pull-request, issue, review, and CI action items
- Timeline, focus analysis, settings, and grounded weekly summaries
- Deterministic summary fallback when OpenAI is unavailable
- Durable GitHub sync state and last-known-good snapshots when the API is unavailable
- Typed pull-request signals with search and attention filters
- Account export and deletion controls

## Local setup

1. Create a GitHub OAuth App at **GitHub → Settings → Developer settings → OAuth Apps**.
2. Set its homepage URL to `http://localhost:3000` and authorization callback URL to `http://localhost:3000/api/auth/callback/github`.
3. Copy `.env.example` to `.env`, add the OAuth client ID and secret, and generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
4. Run `npm install`, then `npm run db:push`.
5. Run `npm run dev` and open `http://localhost:3000`.

## Validation

Run `npm run typecheck`, `npm test`, and `npm run build` before deploying. Production deployments use the Vercel Postgres schema and migration in `prisma/vercel`.

DevDash sends GitHub requests only from the server. Access tokens are never included in exports, snapshots, logs, or browser responses. Account deletion cascades through sessions, connections, activity, and sync snapshots.
