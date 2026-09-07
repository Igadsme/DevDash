import { subDays } from "date-fns";

export function retentionCutoff(days: number, now = new Date()) {
  return subDays(now, Math.max(7, Math.min(3_650, Math.trunc(days))));
}
