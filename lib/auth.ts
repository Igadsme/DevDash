import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { ensureUserDefaults } from "@/lib/user-bootstrap";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/signin",
    newUser: "/onboarding",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user?.id) {
        token.id = user.id;
      }
      if (account?.provider === "github") {
        const login =
          (profile as { login?: string } | undefined)?.login ||
          user?.name ||
          null;
        if (login) token.username = login;
        if (token.id && account.access_token) {
          await prisma.user.update({
            where: { id: String(token.id) },
            data: { username: login || undefined },
          });
          await prisma.integration.upsert({
            where: {
              userId_provider: { userId: String(token.id), provider: "github" },
            },
            create: {
              userId: String(token.id),
              provider: "github",
              status: "connected",
              accessToken: encryptSecret(account.access_token),
              refreshToken: account.refresh_token
                ? encryptSecret(account.refresh_token)
                : null,
              tokenExpiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              handle: login ? `@${login}` : null,
              externalId: account.providerAccountId,
            },
            update: {
              status: "connected",
              accessToken: encryptSecret(account.access_token),
              refreshToken: account.refresh_token
                ? encryptSecret(account.refresh_token)
                : undefined,
              tokenExpiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : undefined,
              handle: login ? `@${login}` : undefined,
              lastError: null,
            },
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
        session.user.username = (typeof token.username === "string" ? token.username : null) || session.user.name || null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureUserDefaults(user.id);
      }
    },
    async signIn({ user }) {
      if (user.id) {
        await ensureUserDefaults(user.id);
      }
    },
  },
});
