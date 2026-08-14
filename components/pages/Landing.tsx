"use client";

import { useState } from "react";
import {
  ArrowRight, GitBranch, Check, ChevronRight, Zap, Shield,
  GitPullRequest, Activity, Brain, CheckCircle, AlertCircle,
  Focus, BarChart2, Heart,
} from "lucide-react";

interface Props {
  onNavigate: (page: string) => void;
}

function DashboardPreview() {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "#0c0c10",
        border: "1px solid #1e1e26",
        boxShadow: "0 0 100px rgba(74,143,255,0.06), 0 40px 80px rgba(0,0,0,0.6)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: "#111116", borderBottom: "1px solid #1e1e26" }}
      >
        <div className="flex gap-1.5">
          {["#3a3a44", "#3a3a44", "#3a3a44"].map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          <div
            className="text-xs font-mono px-3 py-0.5 rounded"
            style={{ background: "#0c0c10", color: "#6b6b80", border: "1px solid #1e1e26" }}
          >
            app.devdash.io/overview
          </div>
        </div>
        <div className="flex gap-2 opacity-50">
          {["#2a2a35", "#2a2a35"].map((c, i) => (
            <div key={i} className="w-4 h-2 rounded-sm" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ height: 420 }}>
        {/* Sidebar */}
        <div
          className="flex flex-col py-3 gap-1"
          style={{ width: 44, background: "#0c0c10", borderRight: "1px solid #1e1e26" }}
        >
          <div className="flex justify-center mb-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
              <span className="text-white font-bold" style={{ fontSize: 9 }}>D</span>
            </div>
          </div>
          {[Activity, AlertCircle, GitPullRequest, Focus, Heart, BarChart2, Brain].map((Icon, i) => (
            <div
              key={i}
              className="flex justify-center py-1.5"
            >
              <div
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{
                  background: i === 0 ? "#1e1e2a" : "transparent",
                  color: i === 0 ? "#4a8fff" : "#2e2e3e",
                }}
              >
                <Icon size={12} />
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold" style={{ color: "#f0f0f2" }}>Good morning, Gad.</div>
              <div className="text-xs" style={{ color: "#6b6b80" }}>Here is what needs your attention.</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded" style={{ background: "#111116", border: "1px solid #1e1e26" }} />
              <div className="w-5 h-5 rounded" style={{ background: "#111116", border: "1px solid #1e1e26" }} />
              <div className="w-5 h-5 rounded-full" style={{ background: "#1e1e2a" }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 h-full" style={{ maxHeight: 340 }}>
            {/* Left: What Needs Me */}
            <div className="col-span-2 space-y-2.5">
              <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
                <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid #1e1e26" }}>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={11} style={{ color: "#ef4444" }} />
                    <span className="text-xs font-semibold" style={{ color: "#f0f0f2" }}>What Needs Me</span>
                    <span className="text-xs px-1 rounded font-mono" style={{ background: "#1a0f0f", color: "#ef4444", fontSize: 9 }}>4</span>
                  </div>
                </div>
                <div className="divide-y" style={{ borderColor: "#1e1e26" }}>
                  {[
                    { priority: "#ef4444", title: "CI pipeline failing", repo: "payments-api", age: "37m ago", action: "View" },
                    { priority: "#f59e0b", title: "PR waiting for review", repo: "auth-service", age: "2h ago", action: "Review" },
                    { priority: "#6b7280", title: "Issue approaching deadline", repo: "api-docs", age: "2 days", action: "Open" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2">
                      <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: item.priority }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate" style={{ color: "#f0f0f2", fontSize: 10 }}>{item.title}</div>
                        <div className="text-xs font-mono" style={{ color: "#3e3e50", fontSize: 9 }}>{item.repo}</div>
                      </div>
                      <div className="text-xs" style={{ color: "#3e3e50", fontSize: 9 }}>{item.age}</div>
                      <div
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ background: "#1e1e2a", color: "#6b6b80", fontSize: 9 }}
                      >
                        {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: "27", label: "Commits", color: "#4a8fff" },
                  { val: "8", label: "PRs", color: "#22c55e" },
                  { val: "14", label: "Reviews", color: "#f59e0b" },
                  { val: "4h21m", label: "Focus", color: "#8b5cf6" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg px-2 py-2" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
                    <div className="text-sm font-bold font-mono" style={{ color: m.color, fontSize: 13 }}>{m.val}</div>
                    <div className="text-xs" style={{ color: "#6b6b80", fontSize: 9 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Week timeline */}
              <div className="rounded-xl p-3" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "#f0f0f2", fontSize: 10 }}>Week in Code</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { day: "Mon", bars: [{ h: 40, c: "#4a8fff" }, { h: 20, c: "#22c55e" }] },
                    { day: "Tue", bars: [{ h: 60, c: "#4a8fff" }, { h: 10, c: "#22c55e" }] },
                    { day: "Wed", bars: [{ h: 50, c: "#4a8fff" }, { h: 30, c: "#22c55e" }] },
                    { day: "Thu", bars: [{ h: 80, c: "#4a8fff" }, { h: 30, c: "#f59e0b" }] },
                    { day: "Fri", bars: [{ h: 40, c: "#4a8fff" }, { h: 10, c: "#e879f9" }] },
                  ].map((d) => (
                    <div key={d.day} className="flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5" style={{ height: 40 }}>
                        {d.bars.map((b, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{ height: `${b.h}%`, background: b.c, opacity: 0.8 }}
                          />
                        ))}
                      </div>
                      <div style={{ color: "#3e3e50", fontSize: 8 }}>{d.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: AI insight + focus */}
            <div className="space-y-2.5">
              {/* AI insight */}
              <div className="rounded-xl p-3" style={{ background: "#0d1117", border: "1px solid #1e2a3a" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={10} style={{ color: "#4a8fff" }} />
                  <span className="font-medium" style={{ color: "#4a8fff", fontSize: 9 }}>AI Summary</span>
                </div>
                <p style={{ color: "#8b8b9a", fontSize: 9, lineHeight: 1.5 }}>
                  This week: authentication refactor shipped. 4 PRs opened, 6 reviews completed, 2 CI fixes.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {["PR #382", "7 commits", "6 reviews"].map((s) => (
                    <span key={s} className="font-mono rounded" style={{ background: "#1e1e2a", color: "#6b6b80", fontSize: 8, padding: "1px 5px" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Focus */}
              <div className="rounded-xl p-3" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "#f0f0f2", fontSize: 10 }}>Focus</div>
                <div className="space-y-1.5">
                  {[
                    { label: "Total focus", val: "4h 21m" },
                    { label: "Meetings", val: "1h 30m" },
                    { label: "Best window", val: "9–11 AM" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span style={{ color: "#6b6b80", fontSize: 9 }}>{f.label}</span>
                      <span className="font-mono font-semibold" style={{ color: "#f0f0f2", fontSize: 9 }}>{f.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dev Health */}
              <div className="rounded-xl p-3" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "#f0f0f2", fontSize: 10 }}>Dev Health</div>
                <div className="space-y-1.5">
                  {[
                    { label: "After-hours", val: "38%", color: "#f59e0b" },
                    { label: "Weekend", val: "3 days", color: "#ef4444" },
                    { label: "PR churn", val: "Moderate", color: "#22c55e" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span style={{ color: "#6b6b80", fontSize: 9 }}>{s.label}</span>
                      <span className="font-mono font-semibold" style={{ color: s.color, fontSize: 9 }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: AlertCircle,
    color: "#ef4444",
    title: "What Needs Me?",
    desc: "Prioritized actions from your engineering activity. CI failures, stale reviews, and approaching deadlines — surfaced before everything else.",
    bullets: ["Failed CI runs", "PR review requests", "Issue deadlines", "Blocking reviews"],
  },
  {
    icon: Activity,
    color: "#4a8fff",
    title: "Week in Code",
    desc: "A visual timeline of everything you shipped — commits, PRs, reviews, releases — followed by an AI narrative grounded in real activity.",
    bullets: ["Visual weekly timeline", "AI narrative", "Project themes", "Exportable summary"],
  },
  {
    icon: Focus,
    color: "#22c55e",
    title: "Focus Intelligence",
    desc: "Understand your actual focus patterns. See focus blocks, meeting load, interruption sources, and your best windows for deep work.",
    bullets: ["Focus block tracking", "Meeting load", "Interruption radar", "Best focus windows"],
  },
  {
    icon: Heart,
    color: "#f59e0b",
    title: "Dev Health",
    desc: "Transparent signals about your work patterns. No opaque scores — just honest data about after-hours work, PR churn, and meeting load.",
    bullets: ["After-hours signals", "Weekend activity", "PR churn rate", "Meeting load trends"],
  },
];

export default function Landing({ onNavigate }: Props) {
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null);

  const sources = [
    { name: "GitHub", color: "#f0f0f2" },
    { name: "CI/CD", color: "#22c55e" },
    { name: "Calendar", color: "#4a8fff" },
    { name: "Slack", color: "#8b5cf6" },
    { name: "Linear / Jira", color: "#f59e0b" },
  ];

  return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#f0f0f2" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-8"
        style={{ height: 56, background: "rgba(10,10,12,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1e1e26" }}
      >
        <div className="flex items-center gap-8">
          <button className="flex items-center gap-2" onClick={() => onNavigate("landing")}>
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-semibold tracking-tight">DevDash</span>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "#6b6b80" }}>
            {[
              { label: "Product", action: "product" },
              { label: "Features", action: "features" },
              { label: "Integrations", action: "integrations" },
              { label: "Pricing", action: "pricing" },
              { label: "Privacy", action: "privacy" },
            ].map(({ label, action }) => (
              <button
                key={label}
                className="transition-all"
                style={{ color: "#6b6b80" }}
                onClick={() => {
                  if (action === "pricing" || action === "privacy") onNavigate(action);
                  else document.getElementById(action)?.scrollIntoView({ behavior: "smooth" });
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("signin")}
            className="text-sm transition-all hidden sm:block"
            style={{ color: "#6b6b80" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{ background: "#4a8fff", color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
          >
            Get Started
            <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 lg:px-20 pt-20 pb-24 max-w-7xl mx-auto">
        <div className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-7"
            style={{ background: "#0d1a2d", border: "1px solid #1a3050", color: "#4a8fff" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4a8fff" }} />
            Now in beta — connect GitHub for free
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            style={{ color: "#f0f0f2", letterSpacing: "-0.025em", lineHeight: 1.08 }}
          >
            Your operating system<br />for software development.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: "#6b6b80", maxWidth: 560 }}>
            DevDash connects your engineering activity, focus patterns, workflows, and AI into one developer-first command center.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("connect")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#4a8fff", color: "#fff" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
            >
              <GitBranch size={15} />
              Connect GitHub
            </button>
            <button
              onClick={() => onNavigate("overview")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: "#111116", border: "1px solid #1e1e26", color: "#a0a0b0" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#2a2a35";
                (e.currentTarget as HTMLElement).style.color = "#f0f0f2";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#1e1e26";
                (e.currentTarget as HTMLElement).style.color = "#a0a0b0";
              }}
            >
              See the dashboard
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        <DashboardPreview />
      </section>

      {/* Problem section */}
      <section id="product" className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-2xl md:text-4xl font-bold mb-4"
            style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}
          >
            Your work is scattered across your tools.
          </h2>
          <p className="text-base" style={{ color: "#6b6b80" }}>
            Every tool captures a fragment. None of them give you the full picture.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {sources.map((s, i) => (
            <div
              key={s.name}
              className="px-4 py-2.5 rounded-lg text-sm font-medium cursor-default transition-all"
              style={{
                background: highlightedSource === i ? "#111116" : "#0c0c10",
                border: `1px solid ${highlightedSource === i ? s.color + "40" : "#1e1e26"}`,
                color: highlightedSource === i ? s.color : "#6b6b80",
              }}
              onMouseEnter={() => setHighlightedSource(i)}
              onMouseLeave={() => setHighlightedSource(null)}
            >
              {s.name}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: "#2e2e3a" }} />
            ))}
          </div>
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl mb-3"
            style={{ background: "#0d1a2d", border: "1px solid #1a3050" }}
          >
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
              <span className="text-white font-bold" style={{ fontSize: 10 }}>D</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "#4a8fff" }}>DevDash</span>
          </div>
          <p
            className="text-sm text-center"
            style={{ color: "#6b6b80", maxWidth: 460 }}
          >
            DevDash turns fragmented engineering activity into context you can actually use.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}
          >
            Everything in one command center.
          </h2>
          <p className="text-sm" style={{ color: "#6b6b80" }}>
            Built specifically for how engineers actually work.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl transition-all"
              style={{ background: "#111116", border: "1px solid #1e1e26" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a35")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#1e1e26")}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${f.color}18`, color: f.color }}
              >
                <f.icon size={17} />
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: "#f0f0f2" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6b80" }}>{f.desc}</p>
              <div className="space-y-1.5">
                {f.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs" style={{ color: "#8b8b9a" }}>
                    <Check size={11} style={{ color: f.color }} />
                    {b}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI section */}
      <section className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={15} style={{ color: "#4a8fff" }} />
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "#4a8fff" }}
              >
                AI Assistant
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}
            >
              Ask your engineering data anything.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#6b6b80" }}>
              DevDash&apos;s AI is grounded in your actual activity. Ask for your standup, a sprint retrospective, or why you felt blocked last week. Every response cites real sources.
            </p>
            <button
              onClick={() => onNavigate("ai-assistant")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "#4a8fff", color: "#fff" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
            >
              Try AI Assistant <ArrowRight size={13} />
            </button>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "#111116", border: "1px solid #1e1e26" }}>
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid #1e1e26" }}
            >
              <Zap size={13} style={{ color: "#4a8fff" }} />
              <span className="text-sm font-semibold" style={{ color: "#f0f0f2" }}>Ask DevDash</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ background: "#1e1e2a", color: "#4a8fff" }}
                >
                  G
                </div>
                <div
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ background: "#1e1e2a", color: "#f0f0f2" }}
                >
                  What did I accomplish this week?
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0d1a2d", color: "#4a8fff" }}
                >
                  <Zap size={13} />
                </div>
                <div>
                  <div
                    className="px-3 py-3 rounded-xl text-sm leading-relaxed mb-2"
                    style={{ background: "#0d1117", border: "1px solid #1e2a3a", color: "#a0a0b0" }}
                  >
                    This week you focused on authentication reliability. You merged PR #382 (auth refactor), pushed 7 commits to{" "}
                    <span style={{ color: "#4a8fff" }}>auth-service</span>, reviewed 6 PRs, and resolved 2 CI failures.
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["PR #382", "7 commits", "6 reviews", "2 CI fixes"].map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-xs font-mono"
                        style={{ background: "#1e1e2a", color: "#6b6b80" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto">
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{ background: "#0c0c10", border: "1px solid #1e1e26" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} style={{ color: "#22c55e" }} />
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "#22c55e" }}
            >
              Privacy
            </span>
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}
          >
            Your engineering data. Your control.
          </h2>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#6b6b80", maxWidth: 480 }}
          >
            DevDash is built for developers, not managers. You control what is private, what is shareable, and what is never collected.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Dev Health", status: "Private by default" },
              { label: "Focus Patterns", status: "Private by default" },
              { label: "Engineering Activity", status: "Private by default" },
              { label: "Reports", status: "Opt-in to share" },
              { label: "Analytics", status: "Opt-in to share" },
              { label: "Manager access", status: "Never without consent" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "#111116" }}
              >
                <CheckCircle size={13} style={{ color: "#22c55e", flexShrink: 0 }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: "#f0f0f2" }}>{item.label}</div>
                  <div className="text-xs" style={{ color: "#6b6b80" }}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "#f0f0f2", letterSpacing: "-0.02em" }}
          >
            Connects to your entire stack.
          </h2>
          <p className="text-sm" style={{ color: "#6b6b80" }}>
            GitHub is the primary integration. Everything else is optional.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { name: "GitHub", color: "#f0f0f2", primary: true },
            { name: "GitLab", color: "#e24329" },
            { name: "GitHub Actions", color: "#2da44e" },
            { name: "Jenkins", color: "#d33833" },
            { name: "CircleCI", color: "#a0a0b0" },
            { name: "Linear", color: "#5e6ad2" },
            { name: "Jira", color: "#0052cc" },
            { name: "Slack", color: "#8b5cf6" },
            { name: "Google Calendar", color: "#1a73e8" },
            { name: "Microsoft Teams", color: "#6264a7" },
          ].map((int) => (
            <div
              key={int.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: int.primary ? "#0d1a2d" : "#111116",
                border: `1px solid ${int.primary ? "#1a3050" : "#1e1e26"}`,
                color: int.primary ? "#4a8fff" : "#a0a0b0",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a35")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = int.primary ? "#1a3050" : "#1e1e26")}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: int.color }} />
              {int.name}
              {int.primary && (
                <span className="text-xs px-1 rounded" style={{ background: "#4a8fff20", color: "#4a8fff", fontSize: 9 }}>Primary</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 lg:px-20 py-28 max-w-7xl mx-auto text-center">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: "#f0f0f2", letterSpacing: "-0.025em", lineHeight: 1.1 }}
        >
          Understand your work.<br />Focus on what matters.
        </h2>
        <p className="text-base mb-8" style={{ color: "#6b6b80" }}>
          Join developers who ship smarter, not harder.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate("connect")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold transition-all"
            style={{ background: "#4a8fff", color: "#fff" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3b7ae8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#4a8fff")}
          >
            <GitBranch size={16} />
            Start with GitHub
          </button>
          <button
            onClick={() => onNavigate("pricing")}
            className="text-sm transition-all"
            style={{ color: "#6b6b80" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f0f0f2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
          >
            View pricing →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-20 py-8" style={{ borderTop: "1px solid #1e1e26" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#4a8fff" }}>
              <span className="text-white font-bold" style={{ fontSize: 8 }}>D</span>
            </div>
            <span className="text-sm font-semibold">DevDash</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: "#6b6b80" }}>
            <button
              onClick={() => onNavigate("pricing")}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
            >
              Pricing
            </button>
            <button
              onClick={() => onNavigate("privacy")}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
            >
              Privacy
            </button>
            <button
              onClick={() => onNavigate("terms")}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a0a0b0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6b80")}
            >
              Terms
            </button>
            <span>© 2026 DevDash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
