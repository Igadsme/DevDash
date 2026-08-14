"use client";

import { useState } from "react";
import { FileText, Download, Copy, Edit2, Zap, Check } from "lucide-react";
import { useApi, postJson, patchJson } from "@/lib/hooks";
import { ErrorState } from "@/components/EmptyState";

const statusConfig = {
  generated: { color: "#22c55e", label: "Generated" },
  ready: { color: "#4a8fff", label: "Ready" },
  draft: { color: "#6b7280", label: "Draft" },
};

export default function Reports() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const { data, loading, error, reload } = useApi<{ items: Array<{
    id: string; title: string; type: string; content: string; sources: string[] | null; createdAt: string; status: string;
  }> }>("/api/standup");

  if (loading) return <div className="p-6 text-sm" style={{ color: "#6b6b80" }}>Loading reports…</div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;

  const reports = (data?.items || []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: (r.status as "generated" | "draft" | "ready") || "generated",
    sources: (r.sources as string[]) || [],
    preview: r.content,
  }));

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
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
                      handleCopy(report.id, report.preview);
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
                    onClick={(e) => {
                      e.stopPropagation();
                      const blob = new Blob([report.preview], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${report.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
                      a.click();
                    }}
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
                    {editing === report.id ? (
                      <div>
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="w-full rounded-lg p-4 text-sm"
                          rows={8}
                          style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#a0a0b0" }}
                        />
                        <button
                          className="mt-2 text-xs px-3 py-1.5 rounded-md"
                          style={{ background: "#4a8fff", color: "#fff" }}
                          onClick={async () => {
                            await patchJson("/api/standup", { id: report.id, content: draft });
                            setEditing(null);
                            await reload();
                          }}
                        >
                          Save edits
                        </button>
                      </div>
                    ) : (
                    <div
                      className="rounded-lg p-4 text-sm leading-relaxed"
                      style={{ background: "#0c0c10", border: "1px solid #1e1e26", color: "#a0a0b0" }}
                    >
                      {report.preview}
                    </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
                        style={{ background: "#4a8fff", color: "#fff" }}
                        onClick={async () => {
                          const endpoint = report.type === "retrospective" ? "/api/retrospective" : report.type === "impact" ? "/api/impact" : "/api/standup";
                          await postJson(endpoint);
                          await reload();
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
                      >
                        <Zap size={11} />
                        Regenerate
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
                        style={{ background: "#1e1e2a", color: "#a0a0b0", border: "1px solid #2a2a35" }}
                        onClick={() => {
                          setEditing(report.id);
                          setDraft(report.preview);
                        }}
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
      <div className="grid sm:grid-cols-3 gap-2 mt-4">
        {[
          { label: "Generate standup", endpoint: "/api/standup" },
          { label: "Generate retrospective", endpoint: "/api/retrospective" },
          { label: "Generate impact summary", endpoint: "/api/impact" },
        ].map((btn) => (
          <button
            key={btn.label}
            className="py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            style={{ background: "#111116", border: "2px dashed #1e1e26", color: "#6b6b80" }}
            onClick={async () => {
              await postJson(btn.endpoint);
              await reload();
            }}
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
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
