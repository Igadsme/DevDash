import { useState } from "react";
import { Zap, Download, ChevronLeft, ChevronRight, GitCommit, GitPullRequest, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { mockWeekTimeline, mockThemes } from "../../data/mock";

const eventColor = {
  commit: "#4a8fff",
  pr: "#22c55e",
  review: "#f59e0b",
  issue: "#8b5cf6",
  ci: "#6b7280",
  release: "#e879f9",
};

const eventIcon = {
  commit: GitCommit,
  pr: GitPullRequest,
  review: CheckCircle,
  issue: Circle,
  ci: AlertCircle,
};

const weekEvents = [
  { time: "Mon 9:14 AM", type: "commit", label: "Add token refresh logic", repo: "auth-service" },
  { time: "Mon 11:30 AM", type: "review", label: "Reviewed infra-terraform PR #371", repo: "infra-terraform" },
  { time: "Mon 2:00 PM", type: "commit", label: "Fix rate limit middleware", repo: "payments-api" },
  { time: "Tue 9:45 AM", type: "pr", label: "Opened PR #389 — cache layer", repo: "backend-core" },
  { time: "Tue 11:00 AM", type: "commit", label: "JWT expiry handling", repo: "auth-service" },
  { time: "Wed 10:00 AM", type: "commit", label: "Fix OAuth callback redirect", repo: "auth-service" },
  { time: "Wed 1:52 PM", type: "review", label: "Review requested — payments-api", repo: "payments-api" },
  { time: "Wed 2:41 PM", type: "pr", label: "Merged PR #382 — authentication-refactor", repo: "auth-service" },
  { time: "Thu 9:20 AM", type: "pr", label: "Opened PR #391 — metrics panel", repo: "frontend-dashboard" },
  { time: "Fri 3:00 PM", type: "release", label: "Released v2.4.1", repo: "auth-service" },
];

export default function WeekInCode() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const displayEvents = selectedDay
    ? weekEvents.filter((e) => e.time.startsWith(selectedDay))
    : weekEvents;

  return (
    <div className="p-6 max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Week in Code</h1>
          <p className="text-sm" style={{ color: "#6b6b80" }}>Aug 11 – Aug 15, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 flex items-center justify-center rounded" style={{ background: "#111116", border: "1px solid #1e1e26", color: "#6b6b80" }}>
            <ChevronLeft size={14} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded" style={{ background: "#111116", border: "1px solid #1e1e26", color: "#6b6b80" }}>
            <ChevronRight size={14} />
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all"
            style={{ background: "#111116", border: "1px solid #1e1e26", color: "#6b6b80" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* Big timeline */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
        <div className="grid grid-cols-5 divide-x" style={{ borderColor: "#1e1e26" }}>
          {mockWeekTimeline.map((day) => (
            <div
              key={day.day}
              className="p-4 cursor-pointer transition-all"
              style={{ background: selectedDay === day.day ? "#141418" : "transparent" }}
              onClick={() => setSelectedDay(selectedDay === day.day ? null : day.day)}
              onMouseEnter={(e) => {
                if (selectedDay !== day.day)
                  (e.currentTarget as HTMLElement).style.background = "#121215";
              }}
              onMouseLeave={(e) => {
                if (selectedDay !== day.day)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div className="text-xs font-semibold mb-0.5" style={{ color: selectedDay === day.day ? "#4a8fff" : "#a0a0b0" }}>
                {day.day}
              </div>
              <div className="text-xs mb-3" style={{ color: "#3e3e50" }}>{day.date}</div>
              <div className="space-y-1.5">
                {day.events.map((ev) => {
                  const color = eventColor[ev.type as keyof typeof eventColor];
                  return (
                    <div
                      key={ev.type}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="h-1.5 rounded-full"
                        style={{ background: color, width: `${Math.min(ev.count * 12, 100)}%`, minWidth: 8 }}
                      />
                      <span className="text-xs font-mono" style={{ color, fontSize: 10 }}>{ev.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Event list */}
        <div className="lg:col-span-2">
          <div className="text-xs font-medium mb-3" style={{ color: "#6b6b80" }}>
            {selectedDay ? `${selectedDay}'s activity` : "All events this week"}
            {selectedDay && (
              <button
                className="ml-2 text-xs"
                style={{ color: "#4a8fff" }}
                onClick={() => setSelectedDay(null)}
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {displayEvents.map((ev, i) => {
              const color = eventColor[ev.type as keyof typeof eventColor];
              const Icon = eventIcon[ev.type as keyof typeof eventIcon] || Circle;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                  style={{ background: "#111116", border: "1px solid #1e1e26" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a35")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#1e1e26")}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                    <Icon size={11} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm" style={{ color: "#f0f0f2" }}>{ev.label}</div>
                    <div className="text-xs font-mono" style={{ color: "#3e3e50" }}>{ev.repo}</div>
                  </div>
                  <div className="text-xs flex-shrink-0" style={{ color: "#3e3e50" }}>{ev.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: theme + AI */}
        <div className="space-y-4">
          {/* Themes */}
          <div className="rounded-xl p-4" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="text-sm font-semibold mb-3" style={{ color: "#f0f0f2" }}>What you worked on</div>
            <div className="space-y-3">
              {mockThemes.map((theme) => (
                <div key={theme.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: "#a0a0b0" }}>{theme.name}</span>
                    <span className="text-xs font-mono" style={{ color: theme.color }}>{theme.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "#1e1e26" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${theme.pct}%`, background: theme.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Narrative */}
          <div className="rounded-xl p-4" style={{ background: "#0d1117", border: "1px solid #1e2a3a" }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={13} style={{ color: "#4a8fff" }} />
              <span className="text-xs font-semibold" style={{ color: "#4a8fff" }}>AI Narrative</span>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#8b8b9a" }}>
              This week you primarily focused on authentication and API reliability. You merged the major authentication refactor (PR #382), resolved 2 CI failures in payments-api, and opened a new metrics panel for the frontend dashboard.
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "#8b8b9a" }}>
              Tuesday and Thursday were your highest-output days, with 6 and 8 commits respectively. You maintained a healthy review cadence with 6 PR reviews completed.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["7 commits", "4 PRs", "6 reviews", "2 CI fixes"].map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "#1e1e2a", color: "#6b6b80" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
