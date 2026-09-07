import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";
import { hasGitHubOAuthConfig } from "@/lib/config";

const githubProvider = hasGitHubOAuthConfig()
  ? GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      issuer: "https://github.com/login/oauth",
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    })
  : null;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/signin",
  },
  providers: githubProvider ? [githubProvider] : [],
  events: {
    async signIn({ user, account, profile }) {
      const login =
        account?.provider === "github" &&
        profile &&
        "login" in profile &&
        typeof profile.login === "string"
          ? profile.login
          : null;
      if (!user.id || account?.provider !== "github") return;
      await prisma.$transaction([
        ...(login
          ? [
              prisma.user.update({
                where: { id: user.id },
                data: { githubLogin: login },
              }),
            ]
          : []),
        prisma.account.updateMany({
          where: { userId: user.id, provider: "github" },
          data: {
            access_token: null,
            refresh_token: null,
            id_token: null,
            session_state: null,
          },
        }),
      ]);
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
