import Link from "next/link";
import { CheckCircle2, Command, Github, ShieldCheck } from "lucide-react";

import { SignInButton } from "@/components/sign-in-button";

const errorMessages: Record<string, string> = {
  AccessDenied: "GitHub access was not approved. Try again and authorize DevDash.",
  Configuration: "Authentication is not configured correctly. Check the server environment variables.",
  OAuthCallback: "GitHub could not complete the sign-in. Verify the OAuth callback URL and client secret.",
  OAuthSignin: "DevDash could not start GitHub sign-in. Verify the OAuth app configuration."
};

export function AuthScreen({
  mode,
  configured,
  error
}: {
  mode: "signin" | "signup";
  configured: boolean;
  error?: string;
}) {
  const signingUp = mode === "signup";
  const errorMessage = error ? errorMessages[error] || "Authentication failed. Please try again." : null;

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-10 text-navy sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 lg:grid-cols-[1fr_.92fr]">
        <section className="hidden bg-navy p-12 text-white lg:block">
          <Link href="/" className="inline-flex items-center gap-3 text-xl font-extrabold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber text-navy"><Command size={21} /></span>
            dev<span className="-ml-3 text-amber">dash</span>
          </Link>
          <h1 className="mt-20 max-w-sm text-4xl font-extrabold leading-tight">Your GitHub work, organized around what matters next.</h1>
          <div className="mt-10 space-y-5 text-sm text-slate-300">
            <p className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={18} />See repositories, recent commits, reviews, issues, and CI status in one private workspace.</p>
            <p className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />GitHub data is fetched on the server and kept private to your account.</p>
          </div>
        </section>

        <section className="flex min-h-[600px] flex-col justify-center p-7 sm:p-12">
          <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-extrabold lg:hidden"><Command size={19} className="text-amber" />devdash</Link>
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white"><Github size={23} /></div>
          <p className="font-mono text-xs font-bold uppercase tracking-[.16em] text-teal">{signingUp ? "Create account" : "Welcome back"}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{signingUp ? "Start with GitHub" : "Sign in to DevDash"}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {signingUp
              ? "Authorizing GitHub creates your DevDash account and securely links the repositories you can access."
              : "Use the same GitHub account you originally connected to return to your workspace."}
          </p>

          {errorMessage ? <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{errorMessage}</div> : null}
          {!configured ? <div role="alert" className="mt-6 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm leading-6">GitHub OAuth is not configured on this server. Add the required environment variables, then restart or redeploy.</div> : null}

          <div className="mt-7 [&_button]:w-full [&_button]:justify-center [&_button]:bg-navy [&_button]:py-3 [&_button]:text-white">
            <SignInButton disabled={!configured} callbackUrl="/dashboard" label={signingUp ? "Create account with GitHub" : "Continue with GitHub"} />
          </div>
          <p className="mt-5 text-center text-sm text-slate-500">
            {signingUp ? "Already have an account?" : "New to DevDash?"}{" "}
            <Link href={signingUp ? "/signin" : "/signup"} className="font-bold text-navy underline underline-offset-4">{signingUp ? "Sign in" : "Create an account"}</Link>
          </p>
          <p className="mt-8 text-center text-xs leading-5 text-slate-400">DevDash never receives your GitHub password. GitHub controls authorization and you can revoke access at any time.</p>
        </section>
      </div>
    </main>
  );
}
