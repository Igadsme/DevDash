import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn("soft-card rounded-lg border border-border bg-card p-5", className)}>{children}</section>;
}

export function SectionHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="text-[14px] font-bold text-inkText">{title}</h2><p className="mt-1 text-[11px] text-muted">{description}</p></div>{action}</div>;
}

export function EmptyState({ title, body, link }: { title: string; body: string; link?: { href: string; label: string } }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-canvas/50 p-8 text-center"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-mutedBg text-muted"><Circle size={17} /></span><p className="text-[13px] font-bold text-inkText">{title}</p><p className="mt-1 max-w-xs text-[12px] leading-5 text-muted">{body}</p>{link ? <Link href={link.href} className="mt-4 rounded-md bg-navy px-3 py-2 text-[11px] font-bold text-amber">{link.label}</Link> : null}</div>;
}
