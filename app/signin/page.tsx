import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth-screen";
import { getAuthSession } from "@/lib/auth";
import { hasAuthSecret, hasGitHubOAuthConfig } from "@/lib/config";

export default async function SignInPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const [session, params] = await Promise.all([getAuthSession(), searchParams]);
  if (session?.user?.id) redirect("/dashboard");

  return <AuthScreen mode="signin" configured={hasAuthSecret() && hasGitHubOAuthConfig()} error={params?.error} />;
}
