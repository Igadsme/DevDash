"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Zap, Command, Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import { useApi, patchJson } from "@/lib/hooks";

interface Props {
  current: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppShell({ current, onNavigate, children, title, subtitle }: Props) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const { data: notes, reload } = useApi<{ items: Array<{ id: string; title: string; body: string; read: boolean }>; unread: number }>(
    "/api/notifications",
  );
  const { data: settings } = useApi<{ user: { name?: string } }>("/api/settings");
  const avatar = (settings?.user?.name || "D").slice(0, 1).toUpperCase();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = (page: string) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0a0c" }}>
      <div className="hidden md:block">
        <Sidebar current={current} onNavigate={onNavigate} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 z-50" style={{ width: 220 }}>
            <Sidebar current={current} onNavigate={handleNavigate} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center gap-3 px-4 md:px-6 flex-shrink-0"
          style={{ height: 52, borderBottom: "1px solid #1e1e26", background: "#0a0a0c" }}
        >
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md transition-all"
            style={{ color: "#6b6b80" }}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div className="flex-1 min-w-0">
            {title && (
              <div className="flex items-baseline gap-2">
                <h1 className="text-sm font-semibold truncate" style={{ color: "#f0f0f2" }}>{title}</h1>
                {subtitle && (
                  <span className="text-xs hidden sm:block truncate" style={{ color: "#6b6b80" }}>{subtitle}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-all"
              style={{ background: "#111116", border: "1px solid #1e1e26", color: "#6b6b80" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a35")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#1e1e26")}
            >
              <Search size={13} />
              <span className="hidden md:inline text-xs">Search</span>
              <kbd
                className="hidden md:flex items-center gap-0.5 text-xs font-mono ml-1"
                style={{ color: "#3e3e50" }}
              >
                <Command size={10} />K
              </kbd>
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-md relative transition-all"
              style={{ color: "#6b6b80" }}
              onClick={() => {
                setNotesOpen((v) => !v);
                void patchJson("/api/notifications", {});
                void reload();
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
            >
              <Bell size={15} />
              {Boolean(notes?.unread) && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#4a8fff" }}
                />
              )}
            </button>

            <button
              onClick={() => onNavigate("ai-assistant")}
              className="w-8 h-8 flex items-center justify-center rounded-md transition-all"
              style={{ color: current === "ai-assistant" ? "#4a8fff" : "#6b6b80" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a8fff")}
              onMouseLeave={(e) => {
                if (current !== "ai-assistant")
                  (e.currentTarget as HTMLElement).style.color = "#6b6b80";
              }}
              title="AI Assistant"
            >
              <Zap size={15} />
            </button>

            <button
              onClick={() => onNavigate("settings")}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-all"
              style={{ background: "#1e1e2a", color: "#4a8fff" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#252530")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#1e1e2a")}
            >
              {avatar}
            </button>
          </div>
        </header>

        {notesOpen && (
          <div
            className="absolute right-6 top-14 z-30 w-80 rounded-xl overflow-hidden"
            style={{ background: "#18181f", border: "1px solid #2a2a35" }}
          >
            <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: "1px solid #1e1e26", color: "#f0f0f2" }}>
              Notifications
            </div>
            {(notes?.items || []).length === 0 && (
              <div className="px-4 py-6 text-xs" style={{ color: "#6b6b80" }}>
                No notifications yet. Sync GitHub to surface CI failures and review requests.
              </div>
            )}
            {(notes?.items || []).map((n) => (
              <div key={n.id} className="px-4 py-3" style={{ borderBottom: "1px solid #1e1e26" }}>
                <div className="text-xs font-medium" style={{ color: "#f0f0f2" }}>{n.title}</div>
                <div className="text-xs" style={{ color: "#6b6b80" }}>{n.body}</div>
              </div>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
