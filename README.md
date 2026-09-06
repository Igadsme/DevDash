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

## Vercel deployment

Local development continues to use SQLite. Vercel uses the separate Postgres schema and migrations under `prisma/vercel` because a deployed serverless application needs durable database storage.

1. Push the desired branch to GitHub and import `Igadsme/DevDash` in the Vercel dashboard. Select `devdash-local-updates` if that is the branch you want to deploy.
2. Open the project's **Storage** tab, create a Marketplace Postgres database such as Prisma Postgres or Neon, and connect it to the project. Confirm that it supplies `DATABASE_URL` to Production and Preview.
3. Add these project environment variables for Production, Preview, and Development:
   - `NEXTAUTH_SECRET`: generate with `openssl rand -base64 32`
   - `GITHUB_ID`: production GitHub OAuth client ID
   - `GITHUB_SECRET`: production GitHub OAuth client secret
   - `OPENAI_API_KEY`: optional; summaries use a local fallback when omitted
4. Add `NEXTAUTH_URL` for Production using the final canonical domain, for example `https://devdash.example.com`. Preview deployments should normally use a separate GitHub OAuth App and stable preview domain if OAuth must work there.
5. Create a production GitHub OAuth App with homepage `https://YOUR-DOMAIN` and callback `https://YOUR-DOMAIN/api/auth/callback/github`.
6. Deploy. `vercel.json` runs `npm run vercel-build`, which generates the Postgres Prisma client, applies committed migrations, and builds Next.js.
7. Verify `https://YOUR-DOMAIN/api/health`, then test `/signup`, `/signin`, `/repositories`, `/timeline`, and sign-out.

`NEXTAUTH_URL` must exactly match the public HTTPS origin—do not add a trailing slash or callback path. Never commit environment variables, database URLs, OAuth secrets, or API keys.

When changing Prisma models, update both `prisma/schema.prisma` (local SQLite) and `prisma/vercel/schema.prisma` (Vercel Postgres), then commit a corresponding Postgres migration under `prisma/vercel/migrations`.

GitHub organization repositories can be limited by organization OAuth restrictions or SAML authorization. If a user sees personal repositories but not an organization, they must grant or authorize the OAuth App for that organization in GitHub.
