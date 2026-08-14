"use client";

import { useState } from "react";
import {
  LayoutDashboard, AlertCircle, Activity, BookOpen, Focus, Heart, BarChart2,
  Brain, FileText, Puzzle, Settings, ChevronLeft, ChevronRight, GitBranch,
  ChevronDown, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useApi } from "@/lib/hooks";

interface Props {
  current: string;
  onNavigate: (page: string) => void;
}

const navMain = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "what-needs-me", label: "What Needs Me", icon: AlertCircle },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "week-in-code", label: "Week in Code", icon: BookOpen },
  { id: "focus", label: "Focus", icon: Focus },
  { id: "dev-health", label: "Dev Health", icon: Heart },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

const navAI = [
  { id: "ai-assistant", label: "AI Assistant", icon: Brain },
  { id: "reports", label: "Reports", icon: FileText },
];

const navSystem = [
  { id: "app-integrations", label: "Integrations", icon: Puzzle },
  { id: "settings", label: "Settings", icon: Settings },
];

function NavItem({
  item,
  current,
  collapsed,
  onNavigate,
}: {
  item: { id: string; label: string; icon: React.FC<{ size?: number }> };
  current: string;
  collapsed: boolean;
  onNavigate: (page: string) => void;
}) {
  const active = current === item.id;
  return (
    <button
      onClick={() => onNavigate(item.id)}
      title={collapsed ? item.label : undefined}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-all group"
      style={{
        background: active ? "#1e1e2a" : "transparent",
        color: active ? "#f0f0f2" : "#6b6b80",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = "#6b6b80";
      }}
    >
      <item.icon size={15} />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
      {active && !collapsed && (
        <div
          className="ml-auto w-1 h-1 rounded-full"
          style={{ background: "#4a8fff" }}
        />
      )}
    </button>
  );
}

export default function Sidebar({ current, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useApi<{ user: { name?: string; email?: string; username?: string } }>(
    "/api/settings",
  );
  const user = data?.user;
  const name = user?.name || "Developer";
  const email = user?.email || "";
  const avatar = name.slice(0, 1).toUpperCase();
  const handle = user?.username ? `@${user.username.replace(/^@/, "")}` : "Connect GitHub";

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? 52 : 220,
        background: "#0c0c10",
        borderRight: "1px solid #1e1e26",
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-4"
        style={{ borderBottom: "1px solid #1e1e26", minHeight: 52 }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "#4a8fff" }}
        >
          <span className="text-xs font-bold text-white">D</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight" style={{ color: "#f0f0f2" }}>
            DevDash
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div>
          {!collapsed && (
            <div className="px-3 mb-1 text-xs font-medium uppercase tracking-widest" style={{ color: "#2e2e3a" }}>
              Main
            </div>
          )}
          <div className="space-y-0.5">
            {navMain.map((item) => (
              <NavItem key={item.id} item={item} current={current} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
        <div>
          {!collapsed && (
            <div className="px-3 mb-1 text-xs font-medium uppercase tracking-widest" style={{ color: "#2e2e3a" }}>
              AI
            </div>
          )}
          <div className="space-y-0.5">
            {navAI.map((item) => (
              <NavItem key={item.id} item={item} current={current} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
        <div>
          {!collapsed && (
            <div className="px-3 mb-1 text-xs font-medium uppercase tracking-widest" style={{ color: "#2e2e3a" }}>
              System
            </div>
          )}
          <div className="space-y-0.5">
            {navSystem.map((item) => (
              <NavItem key={item.id} item={item} current={current} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

      <div style={{ borderTop: "1px solid #1e1e26" }}>
        <div className="px-3 py-2 flex items-center gap-2">
          <GitBranch size={13} style={{ color: "#22c55e", flexShrink: 0 }} />
          {!collapsed && (
            <span className="text-xs truncate" style={{ color: "#6b6b80" }}>
              {handle}
            </span>
          )}
        </div>

        <div className="relative px-3 py-2 flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: "#1e1e2a", color: "#4a8fff" }}
          >
            {avatar}
          </div>
          {!collapsed && (
            <button className="flex-1 min-w-0 text-left" onClick={() => setMenuOpen((v) => !v)}>
              <div className="text-xs font-medium truncate" style={{ color: "#f0f0f2" }}>
                {name}
              </div>
              <div className="text-xs truncate" style={{ color: "#6b6b80" }}>
                {email}
              </div>
            </button>
          )}
          {!collapsed && <ChevronDown size={12} style={{ color: "#6b6b80", flexShrink: 0 }} />}
          {menuOpen && !collapsed && (
            <div
              className="absolute left-2 right-2 bottom-12 rounded-lg overflow-hidden z-20"
              style={{ background: "#18181f", border: "1px solid #2a2a35" }}
            >
              <button
                className="w-full text-left px-3 py-2 text-xs"
                style={{ color: "#a0a0b0" }}
                onClick={() => { setMenuOpen(false); onNavigate("settings"); }}
              >
                Profile & settings
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "#ef4444" }}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut size={11} /> Sign out
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center py-2 transition-all"
          style={{ color: "#6b6b80", borderTop: "1px solid #1e1e26" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
