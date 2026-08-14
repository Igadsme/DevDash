import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { mockFocusData } from "../../data/mock";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "#18181f", border: "1px solid #2a2a35" }}>
      <div className="font-medium mb-1" style={{ color: "#f0f0f2" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {(p.value * 60).toFixed(0)}m
        </div>
      ))}
    </div>
  );
};

export default function Focus() {
  return (
    <div className="p-6 max-w-5xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Focus</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>Wednesday, Aug 13, 2026</p>
      </div>

      {/* Big metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total focus", value: "4h 21m" },
          { label: "Avg focus block", value: "1h 14m" },
          { label: "Longest block", value: "2h 08m" },
          { label: "Meeting time", value: "1h 30m" },
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
            {[
              { day: "Tuesday", window: "9:00 AM – 11:00 AM", duration: "2h", strength: 0.95 },
              { day: "Thursday", window: "9:00 AM – 11:00 AM", duration: "2h", strength: 0.88 },
              { day: "Monday", window: "10:00 AM – 12:00 PM", duration: "2h", strength: 0.72 },
            ].map((w) => (
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
            {[
              { source: "PR reviews", count: 3, color: "#22c55e" },
              { source: "Calendar alerts", count: 2, color: "#f59e0b" },
              { source: "CI notifications", count: 2, color: "#6b7280" },
              { source: "Issue mentions", count: 1, color: "#8b5cf6" },
            ].map((int) => (
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
            You experience the most interruptions between <span style={{ color: "#f0f0f2" }}>1–3 PM</span>. Consider blocking that window for async work.
          </div>
        </div>
      </div>
    </div>
  );
}
