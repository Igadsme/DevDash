import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface Insight {
  id: string;
  signal: string;
  value: string;
  valueColor: string;
  headline: string;
  detail: string;
  recommendation: string;
  why: string;
}

const insights: Insight[] = [
  {
    id: "after-hours",
    signal: "After-hours activity",
    value: "38%",
    valueColor: "#f59e0b",
    headline: "You've been shipping later this week.",
    detail: "38% of your commits occurred after 8 PM. This is higher than your 4-week average of 22%.",
    recommendation: "Consider protecting a morning focus block to front-load deep work.",
    why: "DevDash counts commits pushed after your configured after-hours threshold (default: 8 PM). No manager can see this unless you share it.",
  },
  {
    id: "weekend",
    signal: "Weekend activity",
    value: "3 days",
    valueColor: "#ef4444",
    headline: "Consistent weekend work this month.",
    detail: "You had engineering activity on 3 out of 4 recent weekends. These were typically brief (< 30 min), but still present.",
    recommendation: "This pattern is worth monitoring. Short weekend work often signals context-switching pressure.",
    why: "Weekend activity is measured from Saturday 00:00 to Sunday 23:59 local time. This is visible only to you.",
  },
  {
    id: "churn",
    signal: "PR churn",
    value: "Moderate",
    valueColor: "#22c55e",
    headline: "PR churn is within a healthy range.",
    detail: "About 18% of your PRs have multiple force-push or rewrite events. This is slightly elevated but not concerning.",
    recommendation: "Consider investing in a pre-commit checklist or design review for larger PRs.",
    why: "PR churn is measured by counting PRs with more than 2 force pushes or 3+ cycles of changes requested → updated.",
  },
  {
    id: "meetings",
    signal: "Meeting load",
    value: "4.2 hrs/day",
    valueColor: "#6b7280",
    headline: "Meeting load is average for your role.",
    detail: "You average 4.2 hours of calendar meetings per day this week. Engineering research suggests > 4h meeting load correlates with reduced deep work.",
    recommendation: "Identify recurring meetings that could be async and propose a weekly async update instead.",
    why: "Meeting load is pulled from your connected calendar. DevDash only reads meeting duration, not content or attendees.",
  },
];

export default function DevHealth() {
  const [openWhy, setOpenWhy] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Dev Health</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>Understand your work patterns without reducing them to a score.</p>
      </div>

      {/* No score notice */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg mb-6 text-sm"
        style={{ background: "#0d1a0d", border: "1px solid #1a3a1a", color: "#6b9a6b" }}
      >
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
        No productivity score. All signals are based on transparent, configurable rules that you can inspect.
      </div>

      {/* Signal cards */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-4 rounded-xl transition-all"
            style={{ background: "#111116", border: "1px solid #1e1e26" }}
          >
            <div className="text-xs mb-2" style={{ color: "#6b6b80" }}>{ins.signal}</div>
            <div className="text-2xl font-semibold font-mono mb-1" style={{ color: ins.valueColor }}>
              {ins.value}
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#3e3e50" }}>Insights</div>
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="rounded-xl overflow-hidden"
            style={{ background: "#111116", border: "1px solid #1e1e26" }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1" style={{ color: "#f0f0f2" }}>{ins.headline}</div>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: "#8b8b9a" }}>{ins.detail}</p>
                  <div
                    className="text-xs px-3 py-2 rounded-lg leading-relaxed"
                    style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#8b8b9a" }}
                  >
                    <span style={{ color: "#f0f0f2" }}>Recommendation: </span>{ins.recommendation}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1e1e26" }}>
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-all"
                style={{ color: openWhy === ins.id ? "#4a8fff" : "#6b6b80" }}
                onClick={() => setOpenWhy(openWhy === ins.id ? null : ins.id)}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a8fff")}
                onMouseLeave={(e) => {
                  if (openWhy !== ins.id)
                    (e.currentTarget as HTMLElement).style.color = "#6b6b80";
                }}
              >
                <div className="flex items-center gap-1.5">
                  <HelpCircle size={12} />
                  Why am I seeing this?
                </div>
                {openWhy === ins.id ? <X size={12} /> : null}
              </button>
              {openWhy === ins.id && (
                <div
                  className="px-4 pb-3 text-xs leading-relaxed fade-in"
                  style={{ color: "#8b8b9a", background: "#0c0c10" }}
                >
                  {ins.why}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
