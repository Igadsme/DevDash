"use client";

import { useState } from "react";
import { GitBranch, ArrowLeft, Eye, EyeOff, Check, ChevronRight, Puzzle } from "lucide-react";
import { signIn } from "next-auth/react";
import { postJson } from "@/lib/hooks";

interface Props {
  mode: "signin" | "signup" | "connect";
  onNavigate: (page: string) => void;
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0c" }}>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

export default function Auth({ mode, onNavigate }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connected, setConnected] = useState({ github: false, calendar: false, slack: false, linear: false, jira: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const continueGitHub = () => {
    void signIn("github", { callbackUrl: "/onboarding" });
  };

  const submitEmail = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await postJson("/api/auth/register", { email, password });
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/onboarding",
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      onNavigate("connect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "connect") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0c" }}>
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="font-semibold text-base">DevDash</span>
          </div>

          <div className="rounded-xl p-7" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="flex items-center gap-2 mb-1">
              <Puzzle size={15} style={{ color: "#4a8fff" }} />
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#4a8fff" }}>Step 2 of 2</span>
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2" }}>Connect your development environment</h1>
            <p className="text-sm mb-6" style={{ color: "#6b6b80" }}>GitHub is required. Everything else is optional and can be added later.</p>

            <div className="space-y-2 mb-6">
              {[
                { id: "github", name: "GitHub", desc: "Source control, PRs, issues", required: true },
                { id: "calendar", name: "Google Calendar", desc: "Meeting load and focus patterns", required: false },
                { id: "slack", name: "Slack", desc: "Interruption and notification tracking", required: false },
                { id: "linear", name: "Linear", desc: "Issues and project tracking", required: false },
                { id: "jira", name: "Jira", desc: "Issues and sprint tracking", required: false },
              ].map((int) => (
                <div
                  key={int.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "#0c0c10", border: `1px solid ${connected[int.id as keyof typeof connected] ? "#1a3050" : "#1e1e26"}` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: connected[int.id as keyof typeof connected] ? "#0d1a2d" : "#1a1a20", color: connected[int.id as keyof typeof connected] ? "#4a8fff" : "#6b6b80" }}
                    >
                      {int.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{int.name}</span>
                        {int.required && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#0d1a2d", color: "#4a8fff" }}>Required</span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: "#6b6b80" }}>{int.desc}</div>
                    </div>
                  </div>
                  {connected[int.id as keyof typeof connected] ? (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
                      <Check size={12} />
                      Connected
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (int.id === "github") {
                          continueGitHub();
                          return;
                        }
                        const res = await fetch(`/api/integrations/${int.id === "calendar" ? "google_calendar" : int.id}`, { method: "POST" });
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                        else setConnected((c) => ({ ...c, [int.id]: true }));
                      }}
                      className="text-xs px-2.5 py-1 rounded transition-all"
                      style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate("overview")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#4a8fff", color: "#fff" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
            >
              Continue to DevDash
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => onNavigate("overview")}
              className="w-full text-center text-xs mt-3 transition-all"
              style={{ color: "#6b6b80" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
            >
              Skip optional integrations →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthCard>
      <button
        onClick={() => onNavigate("landing")}
        className="flex items-center gap-1.5 text-sm mb-8 transition-all"
        style={{ color: "#6b6b80" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
      >
        <ArrowLeft size={13} />
        Back
      </button>

      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
          <span className="text-white text-sm font-bold">D</span>
        </div>
        <span className="font-semibold text-base">DevDash</span>
      </div>

      <div className="rounded-xl p-7" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2" }}>
          {mode === "signin" ? "Sign in to DevDash" : "Create your account"}
        </h1>
        <p className="text-sm mb-6" style={{ color: "#6b6b80" }}>
          {mode === "signin" ? "Welcome back." : "Start your 14-day free trial. No credit card required."}
        </p>

        {/* GitHub primary */}
        {error && (
          <div className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</div>
        )}
        <button
          onClick={continueGitHub}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-semibold mb-4 transition-all"
          style={{ background: "#f0f0f2", color: "#0a0a0c" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#d8d8dc")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0f0f2")}
        >
          <GitBranch size={16} />
          Continue with GitHub
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "#1e1e26" }} />
          <span className="text-xs" style={{ color: "#6b6b80" }}>or continue with email</span>
          <div className="flex-1 h-px" style={{ background: "#1e1e26" }} />
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#a0a0b0" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.io"
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
              style={{
                background: "#0c0c10",
                border: "1px solid #1e1e26",
                color: "#f0f0f2",
              }}
              onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "#4a8fff")}
              onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "#1e1e26")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#a0a0b0" }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all pr-10"
                style={{
                  background: "#0c0c10",
                  border: "1px solid #1e1e26",
                  color: "#f0f0f2",
                }}
                onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "#4a8fff")}
                onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "#1e1e26")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#6b6b80" }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => void submitEmail()}
          disabled={busy}
          className="w-full py-2.5 rounded-lg text-sm font-semibold mb-4 transition-all"
          style={{ background: "#4a8fff", color: "#fff", opacity: busy ? 0.7 : 1 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <p className="text-center text-xs" style={{ color: "#6b6b80" }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => onNavigate(mode === "signin" ? "signup" : "signin")}
            className="transition-all"
            style={{ color: "#4a8fff" }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </AuthCard>
  );
}
