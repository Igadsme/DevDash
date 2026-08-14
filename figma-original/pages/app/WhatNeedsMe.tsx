import { useState } from "react";
import { AlertCircle, GitPullRequest, CheckCircle, Circle, Filter, SortAsc } from "lucide-react";
import { mockWhatNeedsMe } from "../../data/mock";

const tabs = ["All", "PRs", "CI", "Issues", "Reviews"];

const priorityConfig = {
  critical: { color: "#ef4444", label: "Critical" },
  high: { color: "#f59e0b", label: "High" },
  medium: { color: "#6b7280", label: "Medium" },
  low: { color: "#374151", label: "Low" },
};

const typeIcon = {
  ci: AlertCircle,
  pr: GitPullRequest,
  issue: Circle,
  review: CheckCircle,
};

const typeFilter = {
  "All": null,
  "PRs": "pr",
  "CI": "ci",
  "Issues": "issue",
  "Reviews": "review",
};

export default function WhatNeedsMe() {
  const [activeTab, setActiveTab] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  const filtered = mockWhatNeedsMe.filter((item) => {
    const tabMatch = typeFilter[activeTab as keyof typeof typeFilter] === null || item.type === typeFilter[activeTab as keyof typeof typeFilter];
    const priMatch = filterPriority === "All" || item.priority === filterPriority.toLowerCase();
    return tabMatch && priMatch;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>What Needs Me</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>Your prioritized action center, built from engineering activity.</p>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex" style={{ borderBottom: "1px solid #1e1e26" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm transition-all"
              style={{
                color: activeTab === tab ? "#f0f0f2" : "#6b6b80",
                borderBottom: activeTab === tab ? "2px solid #4a8fff" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded outline-none"
            style={{ background: "#111116", border: "1px solid #1e1e26", color: "#a0a0b0" }}
          >
            {["All", "Critical", "High", "Medium", "Low"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
            style={{ background: "#111116", border: "1px solid #1e1e26", color: "#6b6b80" }}
          >
            <SortAsc size={12} />
            Sort
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
        <div
          className="grid text-xs font-medium px-5 py-3 hidden sm:grid"
          style={{
            gridTemplateColumns: "80px 60px 1fr 120px 80px 120px",
            color: "#6b6b80",
            borderBottom: "1px solid #1e1e26",
          }}
        >
          <span>Priority</span>
          <span>Type</span>
          <span>Item</span>
          <span>Repository</span>
          <span>Age</span>
          <span className="text-right">Action</span>
        </div>
        <div className="divide-y" style={{ borderColor: "#1e1e26" }}>
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "#6b6b80" }}>
              No items matching this filter.
            </div>
          )}
          {filtered.map((item) => {
            const cfg = priorityConfig[item.priority as keyof typeof priorityConfig];
            const Icon = typeIcon[item.type as keyof typeof typeIcon] || Circle;
            return (
              <div
                key={item.id}
                className="flex sm:grid items-center gap-3 sm:gap-0 px-5 py-3.5 transition-all flex-wrap"
                style={{ gridTemplateColumns: "80px 60px 1fr 120px 80px 120px" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#121215")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <div>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{item.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{item.context}</div>
                </div>
                <div className="text-xs font-mono hidden sm:block" style={{ color: "#6b6b80" }}>{item.repo}</div>
                <div className="text-xs hidden sm:block" style={{ color: "#3e3e50" }}>{item.age}</div>
                <div className="sm:text-right">
                  <button
                    className="text-xs px-3 py-1 rounded transition-all"
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
                  >
                    {item.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
