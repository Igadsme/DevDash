import { useState } from "react";
import { Check, ExternalLink, RefreshCw } from "lucide-react";
import { integrations } from "../../data/mock";

export default function Integrations() {
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map((i) => [i.id, i.connected]))
  );

  const connectedList = integrations.filter((i) => connected[i.id]);
  const availableList = integrations.filter((i) => !connected[i.id]);

  const groups = [...new Set(availableList.map((i) => i.category))];

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f0f2", letterSpacing: "-0.01em" }}>Integrations</h1>
        <p className="text-sm" style={{ color: "#6b6b80" }}>Connect your tools to build a complete engineering picture.</p>
      </div>

      {/* Connected */}
      {connectedList.length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#3e3e50" }}>Connected</div>
          <div className="space-y-2">
            {connectedList.map((int) => (
              <div
                key={int.id}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl"
                style={{ background: "#111116", border: "1px solid #1a3050" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                    style={{ background: "#0d1a2d", color: "#4a8fff" }}
                  >
                    {int.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{int.name}</div>
                    <div className="text-xs" style={{ color: "#6b6b80" }}>
                      {int.handle ? `Connected as ${int.handle}` : int.desc}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
                    <Check size={11} />
                    Connected
                  </div>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded transition-all"
                    style={{ color: "#6b6b80" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
                    title="Sync"
                  >
                    <RefreshCw size={12} />
                  </button>
                  <button
                    className="text-xs px-2.5 py-1 rounded transition-all"
                    style={{ background: "#1a0f0f", color: "#ef4444", border: "1px solid #2a1515" }}
                    onClick={() => setConnected((c) => ({ ...c, [int.id]: false }))}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available by group */}
      {groups.map((group) => (
        <div key={group} className="mb-6">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#3e3e50" }}>{group}</div>
          <div className="space-y-2">
            {availableList.filter((i) => i.category === group).map((int) => (
              <div
                key={int.id}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all"
                style={{ background: "#111116", border: "1px solid #1e1e26" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a35")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#1e1e26")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                    style={{ background: "#1a1a20", color: "#6b6b80" }}
                  >
                    {int.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{int.name}</div>
                    <div className="text-xs" style={{ color: "#6b6b80" }}>{int.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => setConnected((c) => ({ ...c, [int.id]: true }))}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
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
                  <ExternalLink size={11} />
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
