"use client";

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useApi } from "@/lib/hooks";
import { ErrorState } from "@/components/EmptyState";

const tabs = ["Overview", "GitHub", "PRs", "Reviews", "CI/CD"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
      <div className="font-medium mb-1" style={{ color: "#f0f0f2" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("Overview");
  const { data, loading, error, reload } = useApi<{
    metrics: { commits: number; prs: number; prsMerged: number; reviews: number; issuesClosed: number; ciSuccessRate: number; commitsTrend: number; prsTrend: number; reviewsTrend: number };
    byDay: Array<{ day: string; commits: number; prs: number; reviews: number }>;
    ciData: Array<{ date: string; success: number; failed: number }>;
    cycleTime: Array<{ week: string; p50: number; p90: number }>;
    reviewTime: Array<{ week: string; hrs: number }>;
  }>("/api/analytics");

  if (loading) return <div className="p-6 text-sm" style={{ color: "#6b6b80" }}>Loading metrics…</div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;

  const mockCommitsByDay = data?.byDay || [];
  const mockCIData = data?.ciData || [];
  const cycleTimeData = data?.cycleTime || [];
  const reviewTimeData = data?.reviewTime || [];
  const m = data?.metrics;

  const topMetrics = [
    { label: "Commits", value: String(m?.commits ?? 0), sub: `${m?.commitsTrend ?? 0}% vs last week` },
    { label: "PRs opened", value: String(m?.prs ?? 0), sub: `${m?.prsTrend ?? 0}% vs last week` },
    { label: "PRs merged", value: String(m?.prsMerged ?? 0), sub: m?.prs ? `${Math.round(((m.prsMerged || 0) / m.prs) * 100)}% merge rate` : "" },
    { label: "Reviews", value: String(m?.reviews ?? 0), sub: `${m?.reviewsTrend ?? 0}% vs last week` },
    { label: "Issues closed", value: String(m?.issuesClosed ?? 0), sub: "" },
    { label: "CI success rate", value: `${m?.ciSuccessRate ?? 0}%`, sub: "" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Analytics</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>Engineering metrics — last 30 days.</p>
      </div>

      {/* Tabs */}
      <div className="flex mb-6" style={{ borderBottom: "1px solid #1e1e26" }}>
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

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {topMetrics.map((m) => (
          <div
            key={m.label}
            className="p-3 rounded-xl"
            style={{ background: "#111116", border: "1px solid #1e1e26" }}
          >
            <div className="text-xs mb-0.5" style={{ color: "#6b6b80" }}>{m.label}</div>
            <div className="text-xl font-semibold font-mono" style={{ color: "#f0f0f2" }}>{m.value}</div>
            {m.sub && <div className="text-xs mt-0.5" style={{ color: "#3e3e50" }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Commit activity */}
        <div className="rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
          <div className="text-sm font-semibold mb-4" style={{ color: "#f0f0f2" }}>Commits & PRs this week</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockCommitsByDay} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#1e1e26" />
              <XAxis dataKey="day" tick={{ fill: "#6b6b80", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b80", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="commits" name="Commits" fill="#4a8fff" radius={[2, 2, 0, 0]} />
              <Bar dataKey="prs" name="PRs" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="reviews" name="Reviews" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CI runs */}
        <div className="rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
          <div className="text-sm font-semibold mb-4" style={{ color: "#f0f0f2" }}>CI runs this week</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockCIData} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#1e1e26" />
              <XAxis dataKey="date" tick={{ fill: "#6b6b80", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b80", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="success" name="Success" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PR cycle time */}
        <div className="rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
          <div className="text-sm font-semibold mb-1" style={{ color: "#f0f0f2" }}>PR cycle time (hours)</div>
          <div className="text-xs mb-4" style={{ color: "#6b6b80" }}>Time from PR opened to merged</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={cycleTimeData}>
              <CartesianGrid stroke="#1e1e26" />
              <XAxis dataKey="week" tick={{ fill: "#6b6b80", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b80", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="p50" name="p50" stroke="#4a8fff" strokeWidth={2} dot={{ fill: "#4a8fff", r: 3 }} />
              <Line type="monotone" dataKey="p90" name="p90" stroke="#6b6b80" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Review time */}
        <div className="rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
          <div className="text-sm font-semibold mb-1" style={{ color: "#f0f0f2" }}>Avg review turnaround (hours)</div>
          <div className="text-xs mb-4" style={{ color: "#6b6b80" }}>Time from review requested to completed</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={reviewTimeData}>
              <CartesianGrid stroke="#1e1e26" />
              <XAxis dataKey="week" tick={{ fill: "#6b6b80", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b80", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="hrs" name="Hours" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
