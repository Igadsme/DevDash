"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useApi, postJson } from "@/lib/hooks";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { data: integrations } = useApi<{ items: Array<{ id: string; connected: boolean; name: string; desc: string }> }>("/api/integrations");
  const { data: repos } = useApi<{ repos: Array<{ id: string; fullName: string; selected: boolean }> }>("/api/github/repos");
  const [selected, setSelected] = useState<string[]>([]);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [health, setHealth] = useState(true);
  const github = integrations?.items.find((i) => i.id === "github");

  useEffect(() => {
    if (repos?.repos.length) {
      setSelected(repos.repos.filter((r) => r.selected).map((r) => r.id));
    }
  }, [repos]);

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
          <div className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#4a8fff" }}>
            Step {step} of 3
          </div>
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2" }}>Connect GitHub</h1>
              <p className="text-sm mb-6" style={{ color: "#6b6b80" }}>Required. Your data stays private by default.</p>
              <div className="flex items-center justify-between p-3 rounded-lg mb-6" style={{ background: "#0c0c10", border: "1px solid #1e1e26" }}>
                <div className="flex items-center gap-3">
                  <GitBranch size={16} style={{ color: "#4a8fff" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>GitHub</div>
                    <div className="text-xs" style={{ color: "#6b6b80" }}>Source control, PRs, issues, Actions</div>
                  </div>
                </div>
                {github?.connected ? (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}><Check size={12} /> Connected</div>
                ) : (
                  <button
                    onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
                    className="text-xs px-2.5 py-1 rounded"
                    style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                  >
                    Connect
                  </button>
                )}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2" }}>Choose repositories</h1>
              <p className="text-sm mb-4" style={{ color: "#6b6b80" }}>Only selected repos are synced.</p>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {(repos?.repos || []).map((repo) => (
                  <label key={repo.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#0c0c10", border: "1px solid #1e1e26" }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(repo.id)}
                      onChange={(e) => setSelected((s) => e.target.checked ? [...s, repo.id] : s.filter((id) => id !== repo.id))}
                    />
                    <span className="text-sm font-mono" style={{ color: "#f0f0f2" }}>{repo.fullName}</span>
                  </label>
                ))}
                {!repos?.repos.length && (
                  <div className="text-xs" style={{ color: "#6b6b80" }}>No repositories yet. Connect GitHub and we will sync them.</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-xs mb-1" style={{ color: "#a0a0b0" }}>Timezone</div>
                  <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm" style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2" }} />
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "#a0a0b0" }}>Work hours</div>
                  <div className="flex gap-2">
                    <input value={start} onChange={(e) => setStart(e.target.value)} className="w-full px-2 py-2 rounded-md text-sm font-mono" style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2" }} />
                    <input value={end} onChange={(e) => setEnd(e.target.value)} className="w-full px-2 py-2 rounded-md text-sm font-mono" style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2" }} />
                  </div>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2" }}>Privacy & Dev Health</h1>
              <p className="text-sm mb-6" style={{ color: "#6b6b80" }}>Everything is private unless you share it.</p>
              <label className="flex items-center justify-between p-3 rounded-lg mb-3" style={{ background: "#0c0c10", border: "1px solid #1e1e26" }}>
                <span className="text-sm" style={{ color: "#f0f0f2" }}>Enable Dev Health signals</span>
                <input type="checkbox" checked={health} onChange={(e) => setHealth(e.target.checked)} />
              </label>
              <div className="text-xs mb-6" style={{ color: "#6b6b80" }}>
                Activity, focus, and health stay PRIVATE. Sharing is always opt-in.
              </div>
            </>
          )}
          <button
            onClick={async () => {
              if (step < 3) {
                setStep(step + 1);
                return;
              }
              await postJson("/api/onboarding", {
                timezone,
                workHoursStart: start,
                workHoursEnd: end,
                selectedRepoIds: selected,
                afterHoursSignal: health,
                weekendSignal: health,
                churnSignal: health,
                privacyDevHealth: "PRIVATE",
                privacyFocus: "PRIVATE",
                privacyActivity: "PRIVATE",
                complete: true,
              });
              router.push("/app/overview");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "#4a8fff", color: "#fff" }}
          >
            {step < 3 ? "Continue" : "Enter DevDash"}
            <ChevronRight size={14} />
          </button>
          {step === 3 && (
            <button onClick={() => router.push("/app/overview")} className="w-full text-center text-xs mt-3" style={{ color: "#6b6b80" }}>
              Skip remaining setup →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
