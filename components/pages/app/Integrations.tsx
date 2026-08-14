"use client";

import { useState } from "react";
import { Check, ExternalLink, RefreshCw } from "lucide-react";
import { useApi, postJson } from "@/lib/hooks";
import { ErrorState } from "@/components/EmptyState";

export default function Integrations() {
  const [tokenFor, setTokenFor] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const { data, loading, error, reload } = useApi<{ items: Array<{
    id: string; name: string; desc: string; category: string; connected: boolean; handle?: string | null; lastSyncLabel: string; configured: boolean; lastError?: string | null;
  }> }>("/api/integrations");

  if (loading) return <div className="p-6 text-sm" style={{ color: "#6b6b80" }}>Loading integrations…</div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;

  const integrations = data?.items || [];
  const connectedList = integrations.filter((i) => i.connected);
  const availableList = integrations.filter((i) => !i.connected);

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
                      {int.handle ? `Connected as ${int.handle}` : int.desc} · Last sync {int.lastSyncLabel}
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
                    onClick={() => postJson(`/api/integrations/${int.id}/sync`).then(() => reload())}
                  >
                    <RefreshCw size={12} />
                  </button>
                  <button
                    className="text-xs px-2.5 py-1 rounded transition-all"
                    style={{ background: "#1a0f0f", color: "#ef4444", border: "1px solid #2a1515" }}
                    onClick={() => fetch(`/api/integrations/${int.id}`, { method: "DELETE" }).then(() => reload())}
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
                  onClick={async () => {
                    if (["circleci", "jenkins", "linear", "jira"].includes(int.id)) {
                      setTokenFor(int.id);
                      return;
                    }
                    const res = await fetch(`/api/integrations/${int.id}`, { method: "POST" });
                    const json = await res.json();
                    if (json.url) window.location.href = json.url;
                    else await reload();
                  }}
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
      {tokenFor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTokenFor(null)} />
          <div className="relative w-full max-w-sm rounded-xl p-5" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div className="text-sm font-semibold mb-2" style={{ color: "#f0f0f2" }}>Connect {tokenFor}</div>
            <p className="text-xs mb-3" style={{ color: "#6b6b80" }}>Paste an API token. It is stored encrypted and never sent to the browser after save.</p>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm mb-3"
              style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#f0f0f2" }}
              placeholder="Token"
            />
            <button
              className="w-full py-2 rounded-md text-sm font-semibold"
              style={{ background: "#4a8fff", color: "#fff" }}
              onClick={async () => {
                await postJson(`/api/integrations/${tokenFor}`, { token });
                setToken("");
                setTokenFor(null);
                await reload();
              }}
            >
              Save and connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
