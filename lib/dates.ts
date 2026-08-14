export function startOfDay(date: Date, timeZone?: string) {
  const d = new Date(date);
  if (!timeZone) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function relativeTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatHour(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function weekdayShort(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString("en-US", opts).replace(/, \d{4}/, "")} – ${end.toLocaleDateString("en-US", opts)}`;
}

export function hourInTz(date: Date, timeZone: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(date),
  );
  return hour === 24 ? 0 : hour;
}

export function weekdayInTz(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(date);
}

export function parseHm(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
