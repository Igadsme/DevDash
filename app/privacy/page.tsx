"use client";

import { useAppNavigate } from "@/lib/use-navigate";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-4">Privacy</h1>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6b80" }}>
          DevDash is personal-first. Developer data belongs to the developer. Productivity insights are private. Sharing is opt-in.
        </p>
        <ul className="text-sm space-y-2" style={{ color: "#a0a0b0" }}>
          <li>Activity, Dev Health, Focus, and AI summaries default to PRIVATE.</li>
          <li>OAuth tokens are encrypted at rest and never sent to the browser or Gemini.</li>
          <li>Gemini only receives the minimum structured context needed for a question you asked.</li>
          <li>You can disable AI features, dismiss health signals, and revoke share links at any time.</li>
          <li>No manager or team access exists unless you explicitly create a shareable report.</li>
        </ul>
      </div>
    </div>
  );
}
