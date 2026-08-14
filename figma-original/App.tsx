import { useState, useEffect, useCallback } from "react";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import AppShell from "./components/AppShell";
import Overview from "./pages/app/Overview";
import WhatNeedsMe from "./pages/app/WhatNeedsMe";
import Activity from "./pages/app/Activity";
import WeekInCode from "./pages/app/WeekInCode";
import Focus from "./pages/app/Focus";
import DevHealth from "./pages/app/DevHealth";
import Analytics from "./pages/app/Analytics";
import AIAssistant from "./pages/app/AIAssistant";
import Reports from "./pages/app/Reports";
import Integrations from "./pages/app/Integrations";
import Settings from "./pages/app/Settings";
import { OverviewSkeleton } from "./components/SkeletonLoader";
import Toast from "./components/Toast";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  overview: { title: "Good morning, Gad." },
  "what-needs-me": { title: "What Needs Me", subtitle: "Prioritized from your engineering activity" },
  activity: { title: "Activity", subtitle: "Engineering timeline" },
  "week-in-code": { title: "Week in Code", subtitle: "Aug 11 – Aug 15, 2026" },
  focus: { title: "Focus", subtitle: "Wednesday, Aug 13" },
  "dev-health": { title: "Dev Health", subtitle: "Your work patterns" },
  analytics: { title: "Analytics", subtitle: "Engineering metrics" },
  "ai-assistant": { title: "Ask DevDash" },
  reports: { title: "Reports", subtitle: "Generated documents" },
  "app-integrations": { title: "Integrations", subtitle: "Connected services" },
  settings: { title: "Settings" },
};

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;

export default function App() {
  const [page, setPage] = useState("landing");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = useCallback((message: string, type: ToastState["type"] = "info") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const navigate = useCallback((p: string) => {
    const appPages = Object.keys(pageTitles);
    const isAppPage = appPages.includes(p);
    const wasAppPage = appPages.includes(page);

    // Show loading skeleton when entering app for first time
    if (isAppPage && !wasAppPage) {
      setLoading(true);
      setTimeout(() => {
        setPage(p);
        setLoading(false);
      }, 600);
      return;
    }

    setPage(p);
    window.scrollTo(0, 0);
  }, [page]);

  // Keyboard shortcut to go home
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "h") navigate("landing");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Public pages
  if (page === "landing") return <Landing onNavigate={navigate} />;
  if (page === "pricing") return <Pricing onNavigate={navigate} />;
  if (page === "signin") return <Auth mode="signin" onNavigate={navigate} />;
  if (page === "signup") return <Auth mode="signup" onNavigate={navigate} />;
  if (page === "connect") return <Auth mode="connect" onNavigate={navigate} />;

  // Show skeleton while loading into app
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#0a0a0c" }}>
        <div className="w-[220px] flex-shrink-0" style={{ background: "#0c0c10", borderRight: "1px solid #1e1e26" }} />
        <div className="flex-1 overflow-hidden">
          <div style={{ height: 52, borderBottom: "1px solid #1e1e26", background: "#0a0a0c" }} />
          <OverviewSkeleton />
        </div>
      </div>
    );
  }

  const meta = pageTitles[page] || { title: page };

  const pageComponent = () => {
    switch (page) {
      case "overview": return <Overview onNavigate={navigate} />;
      case "what-needs-me": return <WhatNeedsMe />;
      case "activity": return <Activity />;
      case "week-in-code": return <WeekInCode />;
      case "focus": return <Focus />;
      case "dev-health": return <DevHealth />;
      case "analytics": return <Analytics />;
      case "ai-assistant": return <AIAssistant />;
      case "reports": return <Reports />;
      case "app-integrations": return <Integrations />;
      case "settings": return <Settings />;
      default: return <Overview onNavigate={navigate} />;
    }
  };

  return (
    <>
      <AppShell
        current={page}
        onNavigate={navigate}
        title={page !== "overview" ? meta.title : undefined}
        subtitle={page !== "overview" ? meta.subtitle : undefined}
      >
        {page === "ai-assistant" ? (
          <div className="flex flex-col" style={{ height: "calc(100vh - 52px)" }}>
            {pageComponent()}
          </div>
        ) : (
          pageComponent()
        )}
      </AppShell>

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
}
