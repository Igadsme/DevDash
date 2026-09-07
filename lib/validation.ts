import { z } from "zod";

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4_000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: z.iso.datetime().nullable().optional(),
  repositoryId: z.string().cuid().nullable().optional(),
  pullRequestId: z.string().cuid().nullable().optional(),
  issueId: z.string().cuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(10).default([]),
});
export const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
});
export const focusCreateSchema = z.object({
  plannedMinutes: z.number().int().min(5).max(180),
  repositoryId: z.string().cuid().nullable().optional(),
  taskId: z.string().cuid().nullable().optional(),
});
export const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  aiEnabled: z.boolean(),
  excludePrivateFromAi: z.boolean(),
  privateRepositories: z.boolean(),
  smallPrThreshold: z.number().int().min(10).max(2_000),
  interruptionCostMinutes: z.number().int().min(5).max(60),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid IANA timezone, such as America/New_York."),
  retentionDays: z.number().int().min(7).max(3_650),
  notifyReviews: z.boolean(),
  notifyPipelines: z.boolean(),
  notifyTasks: z.boolean(),
  notifySyncFailures: z.boolean(),
});
