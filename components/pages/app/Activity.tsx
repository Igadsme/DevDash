"use client";

import { useState } from "react";
import { GitPullRequest, GitCommit, CheckCircle, AlertCircle, Circle, GitMerge } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { ErrorState } from "@/components/EmptyState";

const filters = ["All", "Commits", "PRs", "Reviews", "Issues", "CI/CD", "Releases"];

const typeConfig = {
  commit: { icon: GitCommit, color: "#4a8fff", label: "Commit" },
  pr: { icon: GitPullRequest, color: "#22c55e", label: "PR" },
  review: { icon: CheckCircle, color: "#f59e0b", label: "Review" },
  issue: { icon: Circle, color: "#8b5cf6", label: "Issue" },
  ci: { icon: AlertCircle, color: "#6b7280", label: "CI/CD" },
  release: { icon: GitMerge, color: "#e879f9", label: "Release" },
};

const statusConfig = {
  merged: { color: "#8b5cf6", label: "Merged" },
  pending: { color: "#f59e0b", label: "Pending" },
  pushed: { color: "#4a8fff", label: "Pushed" },
  passed: { color: "#22c55e", label: "Passed" },
  failed: { color: "#ef4444", label: "Failed" },
  open: { color: "#22c55e", label: "Open" },
  completed: { color: "#22c55e", label: "Done" },
};

const filterMap: Record<string, string | null> = {
  "All": null,
  "Commits": "commit",
  "PRs": "pr",
  "Reviews": "review",
  "Issues": "issue",
  "CI/CD": "ci",
  "Releases": "release",
};

export default function Activity() {
  const [activeFilter, setActiveFilter] = useState("All");
  const type = filterMap[activeFilter];
  const { data, loading, error, reload } = useApi<{ items: Array<{
    id: string; time: string; type: string; title: string; sub: string | null; repo: string | null; url?: string | null; status: string;
  }> }>(`/api/activity${type ? `?type=${type}` : ""}`);

  if (loading) return <div className="p-6 text-sm" style={{ color: "#6b6b80" }}>Loading activity…</div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;
  const filtered = data?.items || [];

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Activity</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>Your engineering timeline.</p>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: activeFilter === f ? "#1e1e2a" : "#111116",
              color: activeFilter === f ? "#f0f0f2" : "#6b6b80",
              border: `1px solid ${activeFilter === f ? "#2a2a35" : "#1e1e26"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[88px] top-0 bottom-0 w-px"
          style={{ background: "#1e1e26" }}
        />

        <div className="space-y-0">
          {filtered.map((item) => {
            const tc = typeConfig[item.type as keyof typeof typeConfig];
            const sc = statusConfig[item.status as keyof typeof statusConfig];
            return (
              <div
                key={item.id}
                className="flex gap-4 group"
              >
                {/* Time */}
                <div
                  className="w-20 text-right flex-shrink-0 pt-3 pb-3"
                  style={{ color: "#3e3e50", fontSize: 11 }}
                >
                  {item.time.includes("Yesterday") ? (
                    <span className="text-xs" style={{ color: "#6b6b80" }}>Yesterday</span>
                  ) : item.time}
                </div>

                {/* Dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center mt-2 transition-all"
                    style={{
                      background: "#0c0c10",
                      border: `1px solid ${tc?.color || "#2a2a35"}`,
                      zIndex: 1,
                    }}
                  >
                    {tc && <tc.icon size={11} style={{ color: tc.color }} />}
                  </div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 py-3 pb-4 transition-all cursor-pointer rounded-lg px-3 my-1"
                  onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#111116")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{item.title}</span>
                    {sc && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ background: `${sc.color}15`, color: sc.color }}>
                        {sc.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#6b6b80" }}>{item.sub}</span>
                    <span className="text-xs font-mono" style={{ color: "#3e3e50" }}>{item.repo}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
