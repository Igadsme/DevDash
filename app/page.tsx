"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BarChart3, Check, ChevronRight, Clock3, Code2, Command,
  GitPullRequest, Menu, Network, ShieldCheck, Sparkles, X, Zap
} from "lucide-react";

const signals = [
  { label: "repositories", value: "12", detail: "connected", icon: Code2, tone: "teal" },
  { label: "open reviews", value: "04", detail: "2 need you", icon: GitPullRequest, tone: "amber" },
  { label: "focus this week", value: "16h 40m", detail: "+5.7%", icon: Clock3, tone: "violet" }
];

const workItems = [
  { repo: "event-router", title: "Add circuit breaker to webhook delivery", status: "review", age: "2h", color: "teal" },
  { repo: "platform-api", title: "Define error budget policy", status: "in progress", age: "today", color: "amber" },
  { repo: "infra-modules", title: "Terraform validation failed", status: "attention", age: "1h", color: "coral" }
];

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="DevDash home">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-[0_5px_18px_hsl(var(--accent)/.2)]">
        <Command size={18} strokeWidth={2.5} />
      </span>
      <span className={`text-[16px] font-extrabold tracking-[-.05em] ${dark ? "text-[hsl(214_24%_92%)]" : "text-[hsl(var(--foreground))]"}`}>
        dev<span className="text-[hsl(var(--accent))]">dash</span>
      </span>
    </Link>
  );
}

function SignalPreview() {
  return (
    <div className="public-reveal public-reveal-delay-2 relative mx-auto w-full max-w-[570px]">
      <div className="absolute -inset-5 rounded-[28px] bg-[hsl(182_52%_47%/.08)] blur-2xl" />
      <div className="signal-card relative overflow-hidden rounded-[18px] border border-[hsl(214_24%_92%/.14)] bg-[hsl(222_31%_14%/.94)] text-[hsl(214_24%_92%)]">
        <div className="flex items-center justify-between border-b border-[hsl(214_24%_92%/.1)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><Command size={14} /></span>
            <div><div className="text-[11px] font-bold">Overview</div><div className="font-mono-app text-[9px] uppercase tracking-[.13em] text-[hsl(214_24%_92%/.42)]">Thursday · 14 Mar</div></div>
          </div>
          <span className="font-mono-app flex items-center gap-1.5 text-[9px] uppercase tracking-[.1em] text-[hsl(182_52%_62%)]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(182_52%_62%)]" /> synced 2m ago</span>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {signals.map((signal) => {
            const Icon = signal.icon;
            const color = signal.tone === "teal" ? "182 52% 62%" : signal.tone === "amber" ? "38 92% 62%" : "266 48% 68%";
            return (
              <div key={signal.label} className="rounded-xl border border-[hsl(214_24%_92%/.09)] bg-[hsl(222_36%_10%/.5)] p-3">
                <div className="flex items-center justify-between"><span className="font-mono-app text-[9px] uppercase tracking-[.1em] text-[hsl(214_24%_92%/.46)]">{signal.label}</span><Icon size={13} style={{ color: `hsl(${color})` }} /></div>
                <div className="mt-4 text-[23px] font-semibold tracking-[-.06em]" style={{ color: `hsl(${color})` }}>{signal.value}</div>
                <div className="font-mono-app mt-1 text-[9px] text-[hsl(214_24%_92%/.45)]">{signal.detail}</div>
              </div>
            );
          })}
        </div>
        <div className="mx-5 rounded-xl border border-[hsl(214_24%_92%/.09)] bg-[hsl(222_36%_10%/.42)] p-4">
          <div className="flex items-center justify-between"><div><div className="text-[11px] font-bold">Weekly pulse</div><div className="mt-1 text-[9px] text-[hsl(214_24%_92%/.42)]">Output across the last seven days</div></div><BarChart3 size={15} className="text-[hsl(214_24%_92%/.45)]" /></div>
          <div className="mt-5 flex h-[112px] items-end gap-2 border-b border-[hsl(214_24%_92%/.1)]">
            {[46, 70, 38, 88, 62, 25, 10].map((height, index) => <div key={index} className="flex h-full flex-1 items-end gap-1"><span className="w-1/2 rounded-t-[3px] bg-[hsl(var(--accent))]" style={{ height: `${height}%` }} /><span className="w-1/2 rounded-t-[3px] bg-[hsl(182_52%_47%)]" style={{ height: `${Math.max(10, height - 22)}%` }} /></div>)}
          </div>
          <div className="font-mono-app mt-2 flex justify-between text-[9px] text-[hsl(214_24%_92%/.38)]">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between"><span className="font-mono-app text-[9px] uppercase tracking-[.13em] text-[hsl(214_24%_92%/.42)]">Needs attention</span><span className="font-mono-app text-[9px] text-[hsl(var(--accent))]">03 signals</span></div>
          <div className="space-y-2">
            {workItems.map((item) => <div key={item.title} className="flex items-center gap-3 rounded-lg border border-[hsl(214_24%_92%/.08)] px-3 py-2.5"><span className={`h-1.5 w-1.5 rounded-full ${item.color === "teal" ? "bg-[hsl(182_52%_62%)]" : item.color === "amber" ? "bg-[hsl(var(--accent))]" : "bg-[hsl(2_72%_60%)]"}`} /><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold">{item.title}</div><div className="font-mono-app mt-0.5 text-[9px] text-[hsl(214_24%_92%/.4)]">{item.repo} · {item.age}</div></div><span className="font-mono-app text-[8px] uppercase text-[hsl(214_24%_92%/.42)]">{item.status}</span></div>)}
          </div>
        </div>
      </div>
      <div className="float-signal absolute -bottom-6 -left-5 hidden items-center gap-2 rounded-xl border border-[hsl(214_24%_92%/.14)] bg-[hsl(222_31%_14%/.96)] px-3 py-2.5 shadow-xl sm:flex"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(182_52%_47%/.16)] text-[hsl(182_52%_62%)]"><Check size={13} /></span><span><span className="block text-[10px] font-bold">All systems synced</span><span className="font-mono-app text-[9px] text-[hsl(214_24%_92%/.42)]">GitHub · Issues · Calendar</span></span></div>
    </div>
  );
}

const features = [
  { icon: Network, title: "One connected view", body: "Repositories, pull requests, reviews, issues, and focus signals share the same surface." },
  { icon: Sparkles, title: "Useful observations", body: "Patterns become practical next moves — not another dashboard to monitor." },
  { icon: Zap, title: "Designed for momentum", body: "The right context appears at the right moment, without making you hunt for it." }
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="public-page min-h-[100dvh] overflow-hidden">
      <section className="public-dark-field relative text-[hsl(214_24%_92%)]">
        <div className="public-grid pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-5 md:px-8 md:pb-32">
          <header className="flex items-center justify-between">
            <Brand dark />
            <nav className="hidden items-center gap-7 md:flex">
              <a href="#signal" className="text-[11px] font-semibold text-[hsl(214_24%_92%/.62)] transition-colors hover:text-white">The signal</a>
              <a href="#method" className="text-[11px] font-semibold text-[hsl(214_24%_92%/.62)] transition-colors hover:text-white">How it works</a>
              <Link href="/integrations" className="text-[11px] font-semibold text-[hsl(214_24%_92%/.62)] transition-colors hover:text-white">Sign in</Link>
              <Link href="/integrations" className="flex items-center gap-2 rounded-md bg-[hsl(var(--accent))] px-3.5 py-2.5 text-[11px] font-bold text-[hsl(var(--accent-foreground))] transition-transform hover:-translate-y-0.5">Connect GitHub <ArrowRight size={13} /></Link>
            </nav>
            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded-md border border-[hsl(214_24%_92%/.15)] p-2 text-[hsl(214_24%_92%/.75)] md:hidden"><Menu size={17} /></button>
          </header>
          {mobileOpen ? <div className="absolute inset-x-5 top-4 z-10 rounded-xl border border-[hsl(214_24%_92%/.13)] bg-[hsl(222_31%_14%)] p-4 shadow-2xl md:hidden"><div className="flex items-center justify-between"><Brand dark /><button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="rounded p-2 text-[hsl(214_24%_92%/.65)]"><X size={16} /></button></div><div className="mt-5 grid gap-1"><a href="#signal" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold">The signal</a><a href="#method" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold">How it works</a><Link href="/integrations" className="rounded-md px-3 py-3 text-sm font-semibold">Sign in</Link><Link href="/integrations" className="mt-2 rounded-md bg-[hsl(var(--accent))] px-3 py-3 text-center text-sm font-bold text-[hsl(var(--accent-foreground))]">Connect GitHub</Link></div></div> : null}
          <div className="grid items-center gap-14 pt-20 md:grid-cols-[.9fr_1.1fr] md:gap-10 md:pt-28">
            <div className="public-reveal">
              <div className="font-mono-app mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[.19em] text-[hsl(var(--accent))]"><span className="h-px w-8 bg-[hsl(var(--accent))]" /> Engineering, in focus</div>
              <h1 className="display-type max-w-[590px] text-[clamp(3.2rem,7vw,6.4rem)] font-semibold leading-[.96] tracking-[-.085em]">Make the work<br /><span className="text-[hsl(var(--accent))]">legible.</span></h1>
              <p className="mt-7 max-w-[490px] text-[15px] leading-7 text-[hsl(214_24%_92%/.6)] md:text-[16px]">DevDash turns the noise around your codebase into a calm, high-signal workspace — so you can see what matters and move with intent.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/integrations" className="group flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--accent))] px-5 py-3.5 text-[12px] font-bold text-[hsl(var(--accent-foreground))] transition-transform hover:-translate-y-0.5">Connect your workspace <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></Link><Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-md border border-[hsl(214_24%_92%/.18)] px-5 py-3.5 text-[12px] font-bold text-[hsl(214_24%_92%/.76)] transition-colors hover:border-[hsl(214_24%_92%/.4)] hover:text-white">View the dashboard <ChevronRight size={14} /></Link></div>
              <div className="font-mono-app mt-9 flex items-center gap-4 text-[9px] uppercase tracking-[.13em] text-[hsl(214_24%_92%/.38)]"><span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[hsl(182_52%_62%)]" /> private by default</span><span className="h-3 w-px bg-[hsl(214_24%_92%/.18)]" /><span>developer-first insights</span></div>
            </div>
            <SignalPreview />
          </div>
        </div>
        <div className="instrument-line relative mx-auto h-px max-w-[1240px] opacity-40" />
        <div className="font-mono-app relative mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-5 text-[9px] uppercase tracking-[.13em] text-[hsl(214_24%_92%/.4)] sm:flex-row sm:items-center sm:justify-between md:px-8"><span>One read on the whole system</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(182_52%_62%)]" /> built for developers who ship</span></div>
      </section>

      <section id="signal" className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
        <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr] md:gap-24">
          <div className="public-reveal"><div className="font-mono-app mb-5 text-[10px] font-medium uppercase tracking-[.18em] text-[hsl(180_53%_31%)]">01 / The signal</div><h2 className="display-type max-w-[450px] text-[clamp(2.4rem,5vw,4.7rem)] font-semibold leading-[.98] tracking-[-.08em] text-[hsl(var(--foreground))]">Less tab<br />switching.<br /><em className="font-normal text-[hsl(180_53%_31%)]">More signal.</em></h2></div>
          <div className="md:pt-14"><p className="text-subtle max-w-[530px] text-[17px] leading-8">Your engineering work is already connected. DevDash simply gives those connections a place to speak clearly.</p><div className="mt-12 border-t border-[hsl(var(--border))]">{features.map((item, index) => { const Icon = item.icon; return <div key={item.title} className="flex gap-5 border-b border-[hsl(var(--border))] py-6"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(180_53%_31%)]"><Icon size={16} /></span><div><h3 className="text-[14px] font-bold text-[hsl(var(--foreground))]">{item.title}</h3><p className="text-subtle mt-1.5 max-w-[450px] text-[13px] leading-6">{item.body}</p></div><span className="font-mono-app ml-auto text-[10px] text-subtle">0{index + 1}</span></div>; })}</div></div>
        </div>
      </section>

      <section id="method" className="public-dark-field relative overflow-hidden text-[hsl(214_24%_92%)]">
        <div className="public-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
          <div className="grid gap-14 md:grid-cols-[.75fr_1.25fr] md:gap-24">
            <div>
              <div className="font-mono-app mb-5 text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">02 / The method</div>
              <h2 className="display-type max-w-[430px] text-[clamp(2.5rem,5vw,4.8rem)] font-semibold leading-[.98] tracking-[-.08em]">A better<br /><span className="text-[hsl(var(--accent))]">starting point.</span></h2>
              <p className="mt-7 max-w-[360px] text-[14px] leading-7 text-[hsl(214_24%_92%/.55)]">Not a scoreboard. Not surveillance. A considered read on the work, built to return your attention to the craft.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[hsl(214_24%_92%/.12)] bg-[hsl(222_31%_14%/.65)] p-6 sm:col-span-2">
                <div className="flex items-center justify-between"><span className="font-mono-app text-[10px] uppercase tracking-[.14em] text-[hsl(214_24%_92%/.42)]">The morning read</span><Clock3 size={16} className="text-[hsl(var(--accent))]" /></div>
                <div className="mt-9 flex flex-wrap items-end justify-between gap-6"><div><div className="font-mono-app text-[10px] text-[hsl(214_24%_92%/.4)]">Today&apos;s highest leverage move</div><div className="mt-2 max-w-[370px] text-[20px] font-semibold leading-7 tracking-[-.04em]">Clear the two oldest reviews before starting a new task.</div></div><div className="font-mono-app text-[10px] text-[hsl(182_52%_62%)]">01 / 03</div></div>
              </div>
              <div className="rounded-2xl border border-[hsl(214_24%_92%/.12)] bg-[hsl(222_31%_14%/.65)] p-6">
                <div className="font-mono-app text-[10px] uppercase tracking-[.14em] text-[hsl(214_24%_92%/.42)]">Focus</div>
                <div className="mt-8 text-[37px] font-semibold tracking-[-.08em] text-[hsl(182_52%_62%)]">04h<span className="text-[hsl(214_24%_92%/.35)]">:</span>05</div>
                <div className="mt-2 text-[11px] text-[hsl(214_24%_92%/.45)]">logged today</div>
              </div>
              <div className="rounded-2xl border border-[hsl(214_24%_92%/.12)] bg-[hsl(222_31%_14%/.65)] p-6">
                <div className="font-mono-app text-[10px] uppercase tracking-[.14em] text-[hsl(214_24%_92%/.42)]">Health</div>
                <div className="mt-8 text-[37px] font-semibold tracking-[-.08em] text-[hsl(var(--accent))]">94<span className="text-[hsl(214_24%_92%/.35)]">/100</span></div>
                <div className="mt-2 text-[11px] text-[hsl(214_24%_92%/.45)]">platform-api</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36"><div className="flex flex-col justify-between gap-8 border-b border-[hsl(var(--border))] pb-12 md:flex-row md:items-end"><div><div className="font-mono-app mb-5 text-[10px] uppercase tracking-[.18em] text-[hsl(180_53%_31%)]">03 / Made to disappear</div><h2 className="display-type max-w-[670px] text-[clamp(2.5rem,5vw,4.8rem)] font-semibold leading-[.98] tracking-[-.08em] text-[hsl(var(--foreground))]">The best tool<br />returns you to<br /><span className="text-[hsl(180_53%_31%)]">the work.</span></h2></div><Link href="/integrations" className="group flex w-fit items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-5 py-3.5 text-[12px] font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5">Connect your account <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link></div><div className="text-subtle grid gap-8 pt-10 text-[13px] leading-6 sm:grid-cols-3"><div><span className="font-mono-app text-[10px] text-[hsl(180_53%_31%)]">01</span><p className="mt-3">Connect GitHub using the secure integration flow.</p></div><div><span className="font-mono-app text-[10px] text-[hsl(180_53%_31%)]">02</span><p className="mt-3">Let DevDash find the patterns across your work.</p></div><div><span className="font-mono-app text-[10px] text-[hsl(180_53%_31%)]">03</span><p className="mt-3">Start each day with a clearer next move.</p></div></div></section>
      <footer className="border-t border-[hsl(var(--border))]"><div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-7 md:flex-row md:items-center md:justify-between md:px-8"><Brand /><div className="font-mono-app flex items-center gap-5 text-[9px] uppercase tracking-[.12em] text-subtle"><Link href="/integrations" className="hover:text-[hsl(var(--foreground))]">Sign in</Link><Link href="/dashboard" className="hover:text-[hsl(var(--foreground))]">Dashboard</Link><span>devdash / 2026</span></div></div></footer>
    </div>
  );
}
