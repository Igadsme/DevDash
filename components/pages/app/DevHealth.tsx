"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { ErrorState } from "@/components/EmptyState";

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

export default function DevHealth() {
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const { data, loading, error, reload } = useApi<{ insights: Insight[] }>("/api/dev-health");
  const list = data?.insights || [];

  if (loading) return <div className="p-6 text-sm" style={{ color: "#6b6b80" }}>Computing transparent signals…</div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;

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
        {list.map((ins) => (
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
        {list.map((ins) => (
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
