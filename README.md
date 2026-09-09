# DevDash

DevDash is a private, developer-first dashboard built with Next.js, TypeScript, Prisma, NextAuth, GitHub, and OpenAI. GitHub OAuth is both the account-creation and sign-in method: the first authorization creates a DevDash user, and later authorizations sign that same GitHub identity back in.

## Features

- GitHub OAuth account creation and sign-in
- Personal and organization workspace discovery
- Accessible repository list and recent authored commits
- Ranked pull-request, issue, review, and CI action items
- Timeline, focus analysis, settings, and grounded weekly summaries
- Deterministic summary fallback when OpenAI is unavailable

## Local setup

1. Create a GitHub OAuth App at **GitHub → Settings → Developer settings → OAuth Apps**.
2. Set its homepage URL to `http://localhost:3000` and authorization callback URL to `http://localhost:3000/api/auth/callback/github`.
3. Copy `.env.example` to `.env`, add the OAuth client ID and secret, and generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
4. Run `npm install`, then `npm run db:push`.
5. Run `npm run dev` and open `http://localhost:3000`.
