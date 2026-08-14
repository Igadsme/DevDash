"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, GitPullRequest, AlertCircle, Folder, LayoutDashboard, Brain, BarChart2, Settings } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const items = [
  { id: "overview", label: "Overview", sub: "Main dashboard", icon: LayoutDashboard, group: "Pages" },
  { id: "what-needs-me", label: "What Needs Me", sub: "Action center", icon: AlertCircle, group: "Pages" },
  { id: "activity", label: "Activity", sub: "Engineering timeline", icon: GitPullRequest, group: "Pages" },
  { id: "week-in-code", label: "Week in Code", sub: "Weekly summary", icon: Folder, group: "Pages" },
  { id: "analytics", label: "Analytics", sub: "Engineering metrics", icon: BarChart2, group: "Pages" },
  { id: "ai-assistant", label: "AI Assistant", sub: "Ask DevDash anything", icon: Brain, group: "AI" },
  { id: "settings", label: "Settings", sub: "Account and preferences", icon: Settings, group: "System" },
];

export default function CommandPalette({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  const filtered = query
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.sub.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
      if (e.key === "Enter" && filtered[selected]) {
        onNavigate(filtered[selected].id);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, filtered, onClose, onNavigate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl overflow-hidden shadow-2xl fade-in"
        style={{ background: "#18181f", border: "1px solid #2a2a35" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #1e1e26" }}>
          <Search size={15} style={{ color: "#6b6b80" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search pages, PRs, issues, commands..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#f0f0f2" }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "#111116", color: "#6b6b80", border: "1px solid #2a2a35" }}>
            ESC
          </kbd>
        </div>
        <div className="py-1 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "#6b6b80" }}>
              No results for “{query}”
            </div>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
              style={{
                background: i === selected ? "#1e1e2a" : "transparent",
                color: i === selected ? "#f0f0f2" : "#a0a0b0",
              }}
              onClick={() => { onNavigate(item.id); onClose(); }}
              onMouseEnter={() => setSelected(i)}
            >
              <item.icon size={15} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "#f0f0f2" }}>{item.label}</div>
                <div className="text-xs" style={{ color: "#6b6b80" }}>{item.sub}</div>
              </div>
              <ArrowRight size={12} style={{ color: "#6b6b80", opacity: i === selected ? 1 : 0 }} />
            </button>
          ))}
        </div>
        <div className="px-4 py-2 flex items-center gap-4 text-xs" style={{ borderTop: "1px solid #1e1e26", color: "#6b6b80" }}>
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
