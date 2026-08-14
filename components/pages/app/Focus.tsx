"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useApi } from "@/lib/hooks";
import { ErrorState } from "@/components/EmptyState";
import { formatDuration } from "@/lib/dates";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
      <div className="font-medium mb-1" style={{ color: "#f0f0f2" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {(p.value * 60).toFixed(0)}m
        </div>
      ))}
    </div>
  );
};

export default function Focus() {
  const { data, loading, error, reload } = useApi<{
    totalFocusMin: number;
    avgBlockMin: number;
    longestBlockMin: number;
    meetingMin: number;
    hourly: Array<{ hour: string; focus: number; meetings: number; interruptions: number }>;
    windows: Array<{ day: string; window: string; duration: string; strength: number }>;
    interruptionSources: Array<{ source: string; count: number; color: string }>;
    recommendation: string;
    note: string;
  }>("/api/focus");

  if (loading) return <div className="p-6 text-sm" style={{ color: "#6b6b80" }}>Estimating focus windows…</div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;
  const mockFocusData = data?.hourly || [];
  return (
    <div className="p-6 max-w-5xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Focus</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} · derived estimates</p>
      </div>

      {/* Big metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total focus", value: formatDuration(data?.totalFocusMin || 0) },
          { label: "Avg focus block", value: formatDuration(data?.avgBlockMin || 0) },
          { label: "Longest block", value: formatDuration(data?.longestBlockMin || 0) },
          { label: "Meeting time", value: formatDuration(data?.meetingMin || 0) },
        ].map((m) => (
          <div
            key={m.label}
            className="p-4 rounded-xl"
            style={{ background: "#111116", border: "1px solid #1e1e26" }}
          >
            <div className="text-xs mb-1" style={{ color: "#6b6b80" }}>{m.label}</div>
            <div className="text-2xl font-semibold font-mono" style={{ color: "#f0f0f2" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
        <div className="text-sm font-semibold mb-4" style={{ color: "#f0f0f2" }}>Daily timeline</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={mockFocusData} barCategoryGap="20%" barGap={2}>
            <XAxis
              dataKey="hour"
              tick={{ fill: "#6b6b80", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="focus" name="Focus" fill="#4a8fff" radius={[2, 2, 0, 0]}>
              {mockFocusData.map((_, i) => (
                <Cell key={i} fill={mockFocusData[i].focus > 0.7 ? "#4a8fff" : "#1e2a3a"} />
              ))}
            </Bar>
            <Bar dataKey="meetings" name="Meetings" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="interruptions" name="Interruptions" fill="#ef444430" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          {[
            { color: "#4a8fff", label: "Focus" },
            { color: "#f59e0b", label: "Meetings" },
            { color: "#ef4444", label: "Interruptions" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b6b80" }}>
              <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Best focus windows */}
        <div className="rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
          <div className="text-sm font-semibold mb-3" style={{ color: "#f0f0f2" }}>Best Focus Windows</div>
          <div className="space-y-2">
            {(data?.windows.length ? data.windows : [{ day: "Not enough data", window: "Sync GitHub to estimate windows", duration: "—", strength: 0 }]).map((w) => (
              <div
                key={w.day}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "#0c0c10", border: "1px solid #1e1e26" }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{w.day}</div>
                  <div className="text-xs font-mono" style={{ color: "#6b6b80" }}>{w.window}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color: "#4a8fff" }}>{w.duration}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-sm"
                        style={{ background: i / 4 < w.strength ? "#4a8fff" : "#1e1e26" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interruption radar */}
        <div className="rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
          <div className="text-sm font-semibold mb-3" style={{ color: "#f0f0f2" }}>Interruption Sources</div>
          <div className="space-y-2 mb-4">
            {(data?.interruptionSources || []).map((int) => (
              <div key={int.source} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: int.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs" style={{ color: "#a0a0b0" }}>{int.source}</span>
                    <span className="text-xs font-mono" style={{ color: int.color }}>{int.count}</span>
                  </div>
                  <div className="h-0.5 rounded-full" style={{ background: "#1e1e26" }}>
                    <div className="h-full rounded-full" style={{ width: `${(int.count / 3) * 100}%`, background: int.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            className="px-3 py-2.5 rounded-lg text-xs leading-relaxed"
            style={{ background: "#0d1117", border: "1px solid #1e2a3a", color: "#8b8b9a" }}
          >
            {data?.recommendation || "Connect GitHub to estimate interruption patterns from activity timestamps."}
          </div>
        </div>
      </div>
    </div>
  );
}
