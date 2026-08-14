import { useState } from "react";
import { AlertCircle, GitPullRequest, CheckCircle, Clock, TrendingUp, TrendingDown, Zap, ChevronRight, Circle } from "lucide-react";
import { mockWhatNeedsMe, mockMetrics, mockWeekTimeline, mockThemes } from "../../data/mock";

interface Props {
  onNavigate: (page: string) => void;
}

const priorityConfig = {
  critical: { color: "#ef4444", bg: "#1a0f0f", label: "Critical" },
  high: { color: "#f59e0b", bg: "#1a1308", label: "High" },
  medium: { color: "#6b7280", bg: "#111116", label: "Medium" },
  low: { color: "#374151", bg: "#0f0f12", label: "Low" },
};

const typeIcon = {
  ci: AlertCircle,
  pr: GitPullRequest,
  issue: Circle,
  review: CheckCircle,
};

const eventColor = {
  commit: "#4a8fff",
  pr: "#22c55e",
  review: "#f59e0b",
  issue: "#8b5cf6",
  ci: "#6b7280",
  release: "#e879f9",
};

function MetricCard({
  value, label, trend, unit
}: {
  value: string | number; label: string; trend: number; unit?: string;
}) {
  const positive = trend > 0;
  return (
    <div
      className="p-4 rounded-xl flex flex-col gap-1 transition-all"
      style={{ background: "#111116", border: "1px solid #1e1e26" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a35")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#1e1e26")}
    >
      <div className="text-xs" style={{ color: "#6b6b80" }}>{label}</div>
      <div className="text-2xl font-semibold font-mono tracking-tight" style={{ color: "#f0f0f2" }}>
        {value}{unit}
      </div>
      <div className="flex items-center gap-1 text-xs" style={{ color: positive ? "#22c55e" : "#ef4444" }}>
        {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {positive ? "+" : ""}{trend}% vs last week
      </div>
    </div>
  );
}

export default function Overview({ onNavigate }: Props) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const topItems = mockWhatNeedsMe.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}>
          Good morning, Gad.
        </h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>
          Here's what needs your attention — Wednesday, Aug 13, 2026.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* What Needs Me — main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* What Needs Me */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <AlertCircle size={14} style={{ color: "#ef4444" }} />
                  <span className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>What Needs Me</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "#1a0f0f", color: "#ef4444" }}>
                    {topItems.length}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "#6b6b80" }}>Prioritized from your engineering activity.</div>
              </div>
              <button
                onClick={() => onNavigate("what-needs-me")}
                className="flex items-center gap-1 text-xs transition-all"
                style={{ color: "#6b6b80" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a8fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "#1e1e26" }}>
              {topItems.map((item) => {
                const cfg = priorityConfig[item.priority as keyof typeof priorityConfig];
                const Icon = typeIcon[item.type as keyof typeof typeIcon] || Circle;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-all cursor-pointer"
                    style={{ background: expandedItem === item.id ? "#141418" : "transparent" }}
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    onMouseEnter={(e) => {
                      if (expandedItem !== item.id)
                        (e.currentTarget as HTMLElement).style.background = "#121215";
                    }}
                    onMouseLeave={(e) => {
                      if (expandedItem !== item.id)
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <Icon size={14} style={{ color: cfg.color, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{item.title}</span>
                        <span className="text-xs font-mono" style={{ color: "#3e3e50" }}>{item.repo}</span>
                      </div>
                      <div className="text-xs" style={{ color: "#6b6b80" }}>{item.context}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs" style={{ color: "#3e3e50" }}>{item.age}</span>
                      <button
                        className="text-xs px-2.5 py-1 rounded transition-all"
                        style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "#4a8fff";
                          (e.currentTarget as HTMLElement).style.color = "#fff";
                          (e.currentTarget as HTMLElement).style.borderColor = "#4a8fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "#1e1e2a";
                          (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
                          (e.currentTarget as HTMLElement).style.borderColor = "#2a2a35";
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.action}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard value={mockMetrics.commits} label="Commits" trend={mockMetrics.commitsTrend} />
            <MetricCard value={mockMetrics.prs} label="PRs" trend={mockMetrics.prsTrend} />
            <MetricCard value={mockMetrics.reviews} label="Reviews" trend={mockMetrics.reviewsTrend} />
            <MetricCard value={mockMetrics.focusTime} label="Focus Time" trend={mockMetrics.focusTrend} />
          </div>

          {/* Week in Code preview */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
              <div className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>Week in Code</div>
              <button
                onClick={() => onNavigate("week-in-code")}
                className="flex items-center gap-1 text-xs transition-all"
                style={{ color: "#6b6b80" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a8fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
              >
                View full week <ChevronRight size={12} />
              </button>
            </div>
            <div className="p-5">
              {/* Timeline */}
              <div className="grid grid-cols-5 gap-2 mb-5">
                {mockWeekTimeline.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className="text-xs mb-2" style={{ color: "#6b6b80" }}>{day.day}</div>
                    <div className="space-y-1">
                      {day.events.map((ev) => (
                        <div
                          key={ev.type}
                          className="h-5 rounded text-xs flex items-center justify-center font-mono transition-all cursor-pointer"
                          style={{ background: `${eventColor[ev.type as keyof typeof eventColor]}20`, color: eventColor[ev.type as keyof typeof eventColor], fontSize: 9 }}
                          title={ev.label}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          {ev.count}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(eventColor).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b6b80" }}>
                    <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                    {type}
                  </div>
                ))}
              </div>
              {/* AI Summary */}
              <div className="rounded-lg px-4 py-3" style={{ background: "#0d1117", border: "1px solid #1e2a3a" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap size={12} style={{ color: "#4a8fff" }} />
                  <span className="text-xs font-medium" style={{ color: "#4a8fff" }}>AI Summary</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#8b8b9a" }}>
                  This week you primarily worked on authentication and API reliability. You opened 4 PRs, reviewed 6 changes, and resolved 2 CI failures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Focus preview */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
              <div className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>Focus</div>
              <button
                onClick={() => onNavigate("focus")}
                className="text-xs transition-all"
                style={{ color: "#6b6b80" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a8fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
              >
                Details →
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Focus time today", value: "4h 21m" },
                { label: "Longest block", value: "1h 14m" },
                { label: "Meeting time", value: "1h 30m" },
                { label: "Interruptions", value: "7" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#6b6b80" }}>{m.label}</span>
                  <span className="text-sm font-semibold font-mono" style={{ color: "#f0f0f2" }}>{m.value}</span>
                </div>
              ))}
              <div className="pt-2" style={{ borderTop: "1px solid #1e1e26" }}>
                <p className="text-xs leading-relaxed" style={{ color: "#6b6b80" }}>
                  Your strongest focus window is <span style={{ color: "#f0f0f2" }}>Tue & Thu 9–11 AM</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Dev Health preview */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
              <div className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>Dev Health</div>
              <button
                onClick={() => onNavigate("dev-health")}
                className="text-xs transition-all"
                style={{ color: "#6b6b80" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a8fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
              >
                Details →
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "After-hours activity", value: "38%", color: "#f59e0b" },
                { label: "Weekend activity", value: "3 days", color: "#6b7280" },
                { label: "PR churn", value: "Moderate", color: "#22c55e" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#6b6b80" }}>{s.label}</span>
                  <span className="text-xs font-semibold font-mono" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
              <div
                className="pt-2 mt-1"
                style={{ borderTop: "1px solid #1e1e26" }}
              >
                <p className="text-xs" style={{ color: "#6b6b80" }}>
                  No productivity score. Just transparent signals.
                </p>
              </div>
            </div>
          </div>

          {/* Theme breakdown */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #1e1e26" }}>
              <div className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>What you worked on</div>
            </div>
            <div className="p-5 space-y-3">
              {mockThemes.map((theme) => (
                <div key={theme.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: "#a0a0b0" }}>{theme.name}</span>
                    <span className="text-xs font-mono" style={{ color: theme.color }}>{theme.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "#1e1e26" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${theme.pct}%`, background: theme.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
