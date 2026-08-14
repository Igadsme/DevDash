import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { z } from "zod";
import { syncUser } from "@/lib/sync/engine";

const schema = z.object({
  timezone: z.string().optional(),
  workHoursStart: z.string().optional(),
  workHoursEnd: z.string().optional(),
  afterHoursThreshold: z.string().optional(),
  selectedRepoIds: z.array(z.string()).optional(),
  afterHoursSignal: z.boolean().optional(),
  weekendSignal: z.boolean().optional(),
  churnSignal: z.boolean().optional(),
  privacyDevHealth: z.string().optional(),
  privacyFocus: z.string().optional(),
  privacyActivity: z.string().optional(),
  complete: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const sessionUser = await requireUser();
    const body = schema.parse(await request.json());
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        timezone: body.timezone,
        workHoursStart: body.workHoursStart,
        workHoursEnd: body.workHoursEnd,
        afterHoursThreshold: body.afterHoursThreshold,
        onboardingCompleted: body.complete ?? undefined,
      },
    });
    await prisma.userPreference.upsert({
      where: { userId: sessionUser.id },
      create: {
        userId: sessionUser.id,
        afterHoursSignal: body.afterHoursSignal,
        weekendSignal: body.weekendSignal,
        churnSignal: body.churnSignal,
        privacyDevHealth: body.privacyDevHealth,
        privacyFocus: body.privacyFocus,
        privacyActivity: body.privacyActivity,
      },
      update: {
        afterHoursSignal: body.afterHoursSignal,
        weekendSignal: body.weekendSignal,
        churnSignal: body.churnSignal,
        privacyDevHealth: body.privacyDevHealth,
        privacyFocus: body.privacyFocus,
        privacyActivity: body.privacyActivity,
      },
    });
    if (body.selectedRepoIds) {
      await prisma.repository.updateMany({
        where: { userId: sessionUser.id },
        data: { selected: false },
      });
      await prisma.repository.updateMany({
        where: { userId: sessionUser.id, id: { in: body.selectedRepoIds } },
        data: { selected: true },
      });
    }
    if (body.complete) {
      void syncUser(sessionUser.id).catch(() => undefined);
    }
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
