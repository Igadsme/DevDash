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

## Render deployment

The included `render.yaml` deploys DevDash as a Node web service with a persistent disk for its SQLite database.

1. Push the desired branch to GitHub. In Render, create a **Blueprint** from that repository and select the branch containing `render.yaml`.
2. Supply the prompted environment variables:
   - `NEXTAUTH_URL`: `https://YOUR-SERVICE.onrender.com`
   - `GITHUB_ID`: production GitHub OAuth client ID
   - `GITHUB_SECRET`: production GitHub OAuth client secret
   - `OPENAI_API_KEY`: optional; summaries use a local fallback when omitted
3. Create a separate production GitHub OAuth App (recommended) with homepage `https://YOUR-SERVICE.onrender.com` and callback `https://YOUR-SERVICE.onrender.com/api/auth/callback/github`.
4. Deploy and verify `/api/health` reports `status: "ok"` and required integrations are configured.
5. Open `/signup`, authorize GitHub, and confirm `/repositories` shows the account's accessible repositories and recent authored commits.

`NEXTAUTH_URL` must exactly match the public HTTPS origin—do not add a trailing slash or callback path. Never commit `.env` or OAuth/API secrets.

## Storage and scaling

The Blueprint mounts SQLite at `/var/data/devdash.db`. This is suitable for a single-instance MVP, but a persistent disk prevents multi-instance scaling and zero-downtime deploys. Migrate the Prisma datasource to Render Postgres before scaling beyond one web-service instance.

GitHub organization repositories can be limited by organization OAuth restrictions or SAML authorization. If a user sees personal repositories but not an organization, they must grant or authorize the OAuth App for that organization in GitHub.
