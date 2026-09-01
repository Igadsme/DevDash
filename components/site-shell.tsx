"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Bell, ChevronDown, CircleHelp, Command, GitPullRequest, Grid2X2, Menu, Network, PanelLeftClose, PanelLeftOpen, Search, Settings2, Sparkles, Target, X } from "lucide-react";

const primaryNav = [
  { href: "/", label: "Overview", icon: Grid2X2 },
  { href: "/timeline", label: "Activity", icon: Activity },
  { href: "/focus", label: "Focus", icon: Target },
  { href: "/dashboard", label: "Pull requests", icon: GitPullRequest, count: "4" }
];
const workspaceNav = [
  { href: "/dashboard", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard", label: "AI insights", icon: Sparkles }
];
const allNav = [...primaryNav, ...workspaceNav, { href: "/integrations", label: "Integrations", icon: Network }, { href: "/settings", label: "Settings", icon: Settings2 }];

export function SiteShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [helpOpen, setHelpOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspace, setWorkspace] = useState("Acme Engineering");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("devdash-theme");
    const shouldUseDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", shouldUseDark);
    setDark(shouldUseDark);

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setHelpOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const unique = allNav.filter((item, index, items) => items.findIndex((candidate) => candidate.label === item.label) === index);
    return query ? unique.filter((item) => item.label.toLowerCase().includes(query)) : unique;
  }, [searchQuery]);

  const toggleTheme = () => {
    setDark((current) => {
      document.documentElement.classList.toggle("dark", !current);
      window.localStorage.setItem("devdash-theme", !current ? "dark" : "light");
      return !current;
    });
  };

  const navItem = (item: (typeof primaryNav)[number]) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link key={`${item.label}-${item.href}`} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${active ? "bg-sidebarActive text-white" : "text-sidebarText hover:bg-sidebarActive/70 hover:text-white"} ${collapsed ? "justify-center px-2" : ""}`}>
        <Icon size={16} strokeWidth={active ? 2.3 : 1.8} />
        {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
        {!collapsed && "count" in item && item.count ? <span className="font-mono text-[10px] text-amber">{item.count}</span> : null}
      </Link>
    );
  };

  return (
    <div className="devdash-shell flex min-h-[100dvh] text-inkText">
      {searchOpen ? <div className="fixed inset-0 z-[70] flex items-start justify-center bg-navy/60 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search workspace" onMouseDown={() => setSearchOpen(false)}>
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-border px-4"><Search size={17} className="text-muted" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search pages…" className="h-12 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" /><button aria-label="Close search" onClick={() => setSearchOpen(false)} className="rounded p-1 text-muted"><X size={16} /></button></div>
          <div className="max-h-80 overflow-y-auto p-2">{searchResults.length ? searchResults.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] font-semibold hover:bg-mutedBg"><Icon size={15} className="text-muted" />{item.label}</Link>; }) : <p className="px-3 py-8 text-center text-[12px] text-muted">No matching pages.</p>}</div>
        </div>
      </div> : null}
      {helpOpen ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 px-4" role="dialog" aria-modal="true" aria-label="Help center" onMouseDown={() => setHelpOpen(false)}><div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-amber">Help center</p><h2 className="mt-2 text-lg font-extrabold">Using DevDash</h2></div><button aria-label="Close help" onClick={() => setHelpOpen(false)} className="text-muted"><X size={17} /></button></div><div className="mt-5 space-y-3 text-[12px] leading-5 text-muted"><p>Connect GitHub from Integrations to populate your dashboard, activity timeline, and focus insights.</p><p>Use <span className="font-mono text-inkText">⌘ K</span> or <span className="font-mono text-inkText">Ctrl K</span> to search pages. Your theme choice is saved on this device.</p><p>If GitHub or AI credentials are missing, Integrations shows exactly what needs to be configured.</p></div><Link href="/integrations" onClick={() => setHelpOpen(false)} className="mt-5 inline-flex rounded-md bg-navy px-3 py-2 text-[11px] font-bold text-amber">Open integrations</Link></div></div> : null}
      {mobileOpen ? <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-navy/60 md:hidden" /> : null}
      <aside className={`sidebar-grid fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebarBorder bg-navy px-3 py-4 transition-all duration-200 md:sticky md:top-0 md:h-[100dvh] md:translate-x-0 ${collapsed ? "md:w-[76px]" : ""} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className={`flex items-center px-2 ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber text-navy shadow-sm"><Command size={17} strokeWidth={2.6} /></span>
            {!collapsed ? <span className="text-[15px] font-extrabold tracking-[-.03em] text-white">dev<span className="text-amber">dash</span></span> : null}
          </Link>
          {!collapsed ? <button onClick={() => setMobileOpen(false)} className="rounded p-1.5 text-sidebarText md:hidden"><X size={16} /></button> : null}
        </div>

        <div className="relative mt-7"><button aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen((value) => !value)} className={`flex w-full items-center gap-2 rounded-md border border-sidebarBorder bg-[#151d30] px-2.5 py-2 ${collapsed ? "justify-center border-0 bg-transparent" : ""}`}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-teal font-mono text-[10px] font-bold text-navy">AC</span>
          {!collapsed ? <><span className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold text-white">{workspace}</span><ChevronDown size={14} className="text-sidebarText/50" /></> : null}
        </button>{workspaceOpen && !collapsed ? <div className="absolute left-0 right-0 top-[44px] z-50 rounded-md border border-sidebarBorder bg-[#151d30] p-1 shadow-xl">{["Acme Engineering", "Personal workspace"].map((name) => <button key={name} onClick={() => { setWorkspace(name); setWorkspaceOpen(false); }} className="w-full rounded px-2 py-2 text-left text-[11px] font-semibold text-sidebarText hover:bg-sidebarActive hover:text-white">{name}</button>)}</div> : null}</div>

        <nav className="scrollbar-thin mt-5 flex-1 overflow-y-auto">
          <div className="space-y-0.5">{primaryNav.map(navItem)}</div>
          <div className={collapsed ? "my-4 border-t border-sidebarBorder" : "mb-2 mt-6 px-3 font-mono text-[10px] font-medium uppercase tracking-[.18em] text-sidebarText/40"}>Workspace</div>
          <div className="space-y-0.5">{workspaceNav.map(navItem)}</div>
          <div className={collapsed ? "my-4 border-t border-sidebarBorder" : "mb-2 mt-6 px-3 font-mono text-[10px] font-medium uppercase tracking-[.18em] text-sidebarText/40"}>Manage</div>
          <div className="space-y-0.5">{navItem({ href: "/integrations", label: "Integrations", icon: Network })}{navItem({ href: "/settings", label: "Settings", icon: Settings2 })}</div>
        </nav>

        {!collapsed ? <div className="border-t border-sidebarBorder pt-3">
          <button onClick={() => setHelpOpen(true)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[12px] font-semibold text-sidebarText/70 hover:bg-sidebarActive"><CircleHelp size={16} /> Help center <span className="ml-auto font-mono text-[10px] text-sidebarText/40">?</span></button>
          <Link href="/settings" className="mt-2 flex items-center gap-2 rounded-md px-2 py-2.5 hover:bg-sidebarActive"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-[11px] font-bold text-white">JR</span><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold text-white">Jordan Rivera</div><div className="truncate text-[10px] text-sidebarText/50">Account settings</div></div><ChevronDown size={14} className="text-sidebarText/50" /></Link>
        </div> : null}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-border bg-canvas/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-muted hover:bg-mutedBg md:hidden"><Menu size={18} /></button><button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)} className="hidden rounded-md p-2 text-muted hover:bg-mutedBg md:block">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button><div className="hidden h-5 w-px bg-border md:block" /><button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-inkText"><Search size={16} /><span className="hidden sm:inline">Search workspace</span><kbd className="ml-1 rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted">⌘ K</kbd></button></div>
          <div className="relative flex items-center gap-1.5"><button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-md p-2 font-mono text-[11px] text-muted hover:bg-mutedBg">{dark ? "LT" : "DK"}</button><button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-md p-2 text-muted hover:bg-mutedBg"><Bell size={17} />{unreadNotifications ? <span className="pulse-dot absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber" /> : null}</button>{notificationsOpen ? <div className="absolute right-0 top-10 z-50 w-[300px] rounded-lg border border-border bg-card p-3 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-[12px] font-bold">Notifications</h2><button onClick={() => setUnreadNotifications(0)} className="text-[10px] font-bold text-teal">Mark all read</button></div><div className="mt-2 space-y-1"><div className="rounded-md bg-mutedBg p-3 text-[11px]"><p className="font-semibold">GitHub connection needed</p><p className="mt-1 text-muted">Connect your account to load live workspace data.</p></div><div className="rounded-md bg-mutedBg p-3 text-[11px]"><p className="font-semibold">Dashboard ready</p><p className="mt-1 text-muted">The refreshed DevDash interface is available.</p></div></div></div> : null}<div className="ml-1 hidden h-6 w-px bg-border sm:block" /><span className="ml-2 hidden font-mono text-[10px] font-medium uppercase tracking-[.12em] text-muted sm:inline">Sprint 24 · Thu 14 Mar</span></div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
