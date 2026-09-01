import Link from "next/link";
import { ArrowUpRight, Circle, GitCommitHorizontal, GitPullRequest, Play, RefreshCw, Sparkles, Target, Timer, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

const metrics = [
  { label: "Commits", value: "47", change: "+12.4%", icon: GitCommitHorizontal, down: false },
  { label: "Reviews", value: "18", change: "+8.1%", icon: GitPullRequest, down: false },
  { label: "Focus time", value: "16h 40m", change: "+5.7%", icon: Timer, down: false },
  { label: "Cycle time", value: "1.8d", change: "-14.2%", icon: Zap, down: true }
];
const weekly = [
  { day: "Mon", commits: 57, reviews: 50 }, { day: "Tue", commits: 79, reviews: 67 },
  { day: "Wed", commits: 36, reviews: 34 }, { day: "Thu", commits: 100, reviews: 100 },
  { day: "Fri", commits: 64, reviews: 50 }, { day: "Sat", commits: 14, reviews: 10 },
  { day: "Sun", commits: 7, reviews: 7 }
];
const tasks = [
  ["Define error budget policy", "platform-api · Today", "bg-amber"],
  ["Refactor webhook retries", "event-router · Tomorrow", "bg-teal"],
  ["Review onboarding copy", "devdash · Mar 18", "bg-teal"],
  ["Investigate p95 latency spike", "platform-api · Mar 19", "bg-red-500"]
];
const reviews = [
  ["Add circuit breaker to webhook delivery", "event-router · 2h"],
  ["Cache team permissions for 5 minutes", "platform-api · 5h"],
  ["Tighten session expiry handling", "devdash · 1d"]
];
const activity = [
  ["Improve retry backoff strategy", "12 min ago · event-router"],
  ["Reviewed “Cache team permissions”", "34 min ago · platform-api"],
  ["Build failed on infra-modules", "1 hr ago · infra-modules"],
  ["Issue moved to In progress", "2 hr ago · platform-api"]
];

export default function OverviewPage() {
  return (
    <SiteShell>
      <div className="rise-in">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[.18em] text-amber">This week</div><h1 className="text-2xl font-extrabold tracking-[-.055em] text-inkText md:text-[30px]">Good morning, Gad.</h1><p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-muted">A clear read on the work that moved forward, and what needs your attention next.</p></div>
          <div className="flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-amber" />Preview workspace</span><Link aria-label="Configure live data" title="Configure live data" href="/integrations" className="rounded-md border border-border bg-card p-2 text-muted hover:text-inkText"><RefreshCw size={14} /></Link></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, change, icon: Icon, down }) => <div key={label} className="soft-card rounded-lg border border-border bg-card p-4 transition-transform duration-200 hover:-translate-y-0.5"><div className="flex items-start justify-between"><span className="font-mono text-[10px] font-medium uppercase tracking-[.12em] text-muted">{label}</span><span className="flex h-7 w-7 items-center justify-center rounded-md bg-mutedBg text-navy"><Icon size={15} /></span></div><div className="metric-number mt-3 text-[28px] font-extrabold text-inkText">{value}</div><div className="mt-1 flex items-center gap-1.5 text-[11px]"><span className={down ? "text-red-600" : "text-teal"}>{down ? <TrendingDown size={13} /> : <TrendingUp size={13} />}</span><span className="font-semibold text-muted">{change}</span><span className="text-muted">vs last week</span></div></div>)}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <section className="soft-card rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between"><div><h2 className="text-[14px] font-bold text-inkText">Weekly pulse</h2><p className="mt-1 text-[11px] text-muted">Output across the last seven days</p></div><div className="flex items-center gap-3 font-mono text-[10px] text-muted"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-amber" />Commits</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-teal" />Reviews</span></div></div>
            <div className="mt-6 flex h-[190px] items-end justify-between gap-2 border-b border-border">{weekly.map((d, i) => <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex h-[145px] w-full max-w-[46px] items-end justify-center gap-1"><span className="w-[45%] rounded-t bg-amber transition-transform hover:-translate-y-1" style={{ height: `${d.commits}%` }} /><span className="w-[45%] rounded-t bg-teal transition-transform hover:-translate-y-1" style={{ height: `${d.reviews}%` }} /></div><span className={`font-mono text-[10px] ${i === 3 ? "font-bold text-inkText" : "text-muted"}`}>{d.day}</span></div>)}</div>
            <div className="mt-4 flex items-center justify-between"><span className="font-mono text-[10px] text-muted">49 commits · 18 reviews · 16h 40m focus</span><Link href="/dashboard" className="flex items-center gap-1 text-[11px] font-bold text-teal">View analytics <ArrowUpRight size={13} /></Link></div>
          </section>

          <section className="relative overflow-hidden rounded-lg bg-navy p-5 text-white">
            <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border-[22px] border-amber/15" /><div className="absolute -right-1 top-2 h-28 w-28 rounded-full border border-amber/15" />
            <div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-white/60"><Target size={14} /> Focus today</div><span className="font-mono text-[10px] text-white/55">02:18:42</span></div><h2 className="mt-8 max-w-[220px] text-[19px] font-extrabold leading-6 tracking-[-.04em]">Ship the reliability plan</h2><p className="mt-1 text-[11px] text-white/60">Personal focus goal</p><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-amber" /></div><div className="mt-2 flex justify-between font-mono text-[10px] text-white/60"><span>4h 05m logged</span><span>6h goal</span></div><Link href="/focus" className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-amber py-2.5 text-[11px] font-bold text-navy"><Play size={13} fill="currentColor" /> Resume session</Link></div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
          <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[14px] font-bold">Today’s queue</h2><p className="mt-1 text-[11px] text-muted">4 items across your workspace</p></div><Link href="/dashboard" className="text-[11px] font-bold text-teal">See all</Link></div>{tasks.map(([title, meta, dot]) => <div key={title} className="flex items-center gap-2.5 border-t border-border py-3"><Circle size={15} className="text-muted" /><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold">{title}</div><div className="mt-0.5 font-mono text-[10px] text-muted">{meta}</div></div><span className={`h-1.5 w-1.5 rounded-full ${dot}`} /></div>)}</section>
          <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[14px] font-bold">Review queue</h2><p className="mt-1 text-[11px] text-muted">Keep work moving</p></div><Link href="/dashboard" className="text-[11px] font-bold text-teal">Open queue</Link></div>{reviews.map(([title, meta]) => <div key={title} className="border-t border-border py-3"><div className="flex items-start gap-2"><GitPullRequest size={15} className="mt-0.5 text-teal" /><div className="min-w-0 flex-1"><div className="text-[12px] font-semibold leading-4">{title}</div><div className="mt-1 font-mono text-[10px] text-muted">{meta}</div></div></div></div>)}</section>
          <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[14px] font-bold">Recent activity</h2><p className="mt-1 text-[11px] text-muted">Across connected tools</p></div><Link href="/timeline" className="text-[11px] font-bold text-teal">Timeline</Link></div>{activity.map(([title, meta]) => <div key={title} className="flex gap-3 border-t border-border py-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber" /><div className="min-w-0"><div className="truncate text-[12px] font-semibold">{title}</div><div className="mt-1 font-mono text-[10px] text-muted">{meta}</div></div></div>)}</section>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-md border border-border bg-card/60 px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center"><Sparkles size={14} className="shrink-0 text-amber" /><span>DevDash observation:</span><span className="font-semibold text-inkText">Your highest leverage move today is clearing the two oldest reviews before starting a new task.</span><Link href="/dashboard" className="sm:ml-auto whitespace-nowrap font-bold text-teal">Read why <ArrowUpRight size={13} className="inline" /></Link></div>
      </div>
    </SiteShell>
  );
}
