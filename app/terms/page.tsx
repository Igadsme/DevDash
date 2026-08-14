"use client";

import { useAppNavigate } from "@/lib/use-navigate";

export default function TermsPage() {
  const navigate = useAppNavigate();
  return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#f0f0f2" }}>
      <nav className="flex items-center justify-between px-8" style={{ height: 56, borderBottom: "1px solid #1e1e26" }}>
        <button onClick={() => navigate("landing")} className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold">DevDash</span>
        </button>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Terms</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#6b6b80" }}>
          DevDash is provided as a personal engineering intelligence tool. You are responsible for the GitHub, GitLab, and other tokens you connect. DevDash does not sell your engineering data. Health signals are heuristics about work patterns, not medical or performance evaluations.
        </p>
      </div>
    </div>
  );
}
