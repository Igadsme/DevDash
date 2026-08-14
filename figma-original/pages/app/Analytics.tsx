import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { mockCommitsByDay, mockCIData } from "../../data/mock";

const tabs = ["Overview", "GitHub", "PRs", "Reviews", "CI/CD"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
      <div className="font-medium mb-1" style={{ color: "#f0f0f2" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const cycleTimeData = [
  { week: "Jul 28", p50: 4.2, p90: 11 },
  { week: "Aug 4", p50: 3.8, p90: 9.5 },
  { week: "Aug 11", p50: 2.9, p90: 7.2 },
];

const reviewTimeData = [
  { week: "Jul 28", hrs: 8.5 },
  { week: "Aug 4", hrs: 6.2 },
  { week: "Aug 11", hrs: 5.1 },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("Overview");

  const topMetrics = [
    { label: "Commits", value: "27", sub: "+12% vs last week" },
    { label: "PRs opened", value: "8", sub: "-2 vs last week" },
    { label: "PRs merged", value: "6", sub: "75% merge rate" },
    { label: "Reviews", value: "14", sub: "+5 vs last week" },
    { label: "Issues closed", value: "4", sub: "" },
    { label: "CI success rate", value: "89%", sub: "-4% vs last week" },
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
