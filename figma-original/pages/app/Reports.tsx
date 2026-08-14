import { useState } from "react";
import { FileText, Download, Copy, Edit2, Zap, Check } from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: string;
  date: string;
  status: "generated" | "draft" | "ready";
  sources: string[];
  preview: string;
}

const reports: Report[] = [
  {
    id: "standup",
    title: "Daily Standup",
    type: "Standup",
    date: "Generated today · Aug 13",
    status: "generated",
    sources: ["5 commits", "2 PR reviews", "1 CI failure"],
    preview: "Yesterday: Merged auth refactor (PR #382), resolved CI failure in payments-api. Today: Continuing metrics panel, addressing review comments on PR #391. Blockers: Waiting on design feedback.",
  },
  {
    id: "sprint-retro",
    title: "Sprint Retrospective",
    type: "Retrospective",
    date: "Aug 1 – Aug 14",
    status: "ready",
    sources: ["27 commits", "8 PRs", "14 reviews", "6 CI runs"],
    preview: "Sprint highlights: Authentication refactor shipped. 2 major CI reliability fixes. Frontend dashboard metrics panel in progress. Velocity: 23 story points.",
  },
  {
    id: "monthly",
    title: "Monthly Review",
    type: "Monthly",
    date: "July 2026",
    status: "generated",
    sources: ["112 commits", "31 PRs", "58 reviews"],
    preview: "July was the highest-output month in Q3. Authentication infrastructure stabilized. Payments API throughput improved by 18%. Team review turnaround improved from 9h to 5.4h avg.",
  },
  {
    id: "perf",
    title: "Performance Review",
    type: "Quarterly",
    date: "Q3 2026",
    status: "draft",
    sources: ["3 months activity", "GitHub data", "Focus patterns"],
    preview: "Based on Q3 activity: Led authentication infrastructure project. Reviewed 142 PRs. Maintained >90% CI success rate on owned services. Mentored 2 junior engineers.",
  },
];

const statusConfig = {
  generated: { color: "#22c55e", label: "Generated" },
  ready: { color: "#4a8fff", label: "Ready" },
  draft: { color: "#6b7280", label: "Draft" },
};

export default function Reports() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("standup");

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Reports</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>AI-generated documents from your engineering activity.</p>
      </div>

      <div className="space-y-3">
        {reports.map((report) => {
          const sc = statusConfig[report.status];
          const isExpanded = expanded === report.id;
          return (
            <div
              key={report.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{ background: "#111116", border: "1px solid #1e1e26" }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : report.id)}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#121215")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#1e1e2a", color: "#4a8fff" }}
                  >
                    <FileText size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>{report.title}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: `${sc.color}15`, color: sc.color }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "#6b6b80" }}>{report.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-all"
                    style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(report.id);
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
                  >
                    {copiedId === report.id ? <Check size={11} /> : <Copy size={11} />}
                    {copiedId === report.id ? "Copied" : "Copy"}
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-all"
                    style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
                  >
                    <Download size={11} />
                    Export
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: "1px solid #1e1e26" }} className="fade-in">
                  <div className="px-5 py-4">
                    {/* Sources */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs" style={{ color: "#3e3e50" }}>Based on:</span>
                      {report.sources.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded font-mono"
                          style={{ background: "#0d1117", border: "1px solid #1e2a3a", color: "#6b6b80" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Preview */}
                    <div
                      className="rounded-lg p-4 text-sm leading-relaxed"
                      style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#a0a0b0" }}
                    >
                      {report.preview}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
                        style={{ background: "#4a8fff", color: "#fff" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
                      >
                        <Zap size={11} />
                        Regenerate
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
                        style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
                      >
                        <Edit2 size={11} />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Generate new */}
      <button
        className="w-full mt-4 py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        style={{ background: "#111116", border: "2px dashed #1e1e26", color: "#6b6b80" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#2a2a35";
          (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#1e1e26";
          (e.currentTarget as HTMLElement).style.color = "#6b6b80";
        }}
      >
        <Zap size={13} />
        Generate new report
      </button>
    </div>
  );
}
