"use client";

import AppShell from "@/components/AppShell";
import { useAppNavigate } from "@/lib/use-navigate";
import { pageFromPath } from "@/lib/navigation";
import { usePathname } from "next/navigation";

const titles: Record<string, { title?: string; subtitle?: string }> = {
  overview: {},
  "what-needs-me": { title: "What Needs Me", subtitle: "Prioritized from your engineering activity" },
  activity: { title: "Activity", subtitle: "Engineering timeline" },
  "week-in-code": { title: "Week in Code" },
  focus: { title: "Focus" },
  "dev-health": { title: "Dev Health", subtitle: "Your work patterns" },
  analytics: { title: "Analytics", subtitle: "Engineering metrics" },
  "ai-assistant": { title: "Ask DevDash" },
  reports: { title: "Reports", subtitle: "Generated documents" },
  "app-integrations": { title: "Integrations", subtitle: "Connected services" },
  settings: { title: "Settings" },
};

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = pageFromPath(pathname);
  const navigate = useAppNavigate();
  const meta = titles[current] || {};

  return (
    <AppShell
      current={current}
      onNavigate={navigate}
      title={current !== "overview" ? meta.title : undefined}
      subtitle={current !== "overview" ? meta.subtitle : undefined}
    >
      {current === "ai-assistant" ? (
        <div className="flex flex-col" style={{ height: "calc(100vh - 52px)" }}>
          {children}
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}
