import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { z } from "zod";
import { ensureUserDefaults } from "@/lib/user-bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await requireUser();
    await ensureUserDefaults(sessionUser.id);
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { preferences: true, profile: true, integrations: true },
    });
    return json({ user });
  } catch (error) {
    return apiError(error);
  }
}

const schema = z.object({
  name: z.string().max(80).optional(),
  timezone: z.string().optional(),
  workHoursStart: z.string().optional(),
  workHoursEnd: z.string().optional(),
  afterHoursThreshold: z.string().optional(),
  plan: z.string().optional(),
  preferences: z
    .object({
      afterHoursSignal: z.boolean().optional(),
      weekendSignal: z.boolean().optional(),
      churnSignal: z.boolean().optional(),
      meetingsSignal: z.boolean().optional(),
      longWorkSignal: z.boolean().optional(),
      interruptionSignal: z.boolean().optional(),
      privacyActivity: z.string().optional(),
      privacyDevHealth: z.string().optional(),
      privacyFocus: z.string().optional(),
      privacyAiSummaries: z.string().optional(),
      privacyPerformance: z.string().optional(),
      privacyCalendar: z.string().optional(),
      privacyRepositories: z.string().optional(),
      aiEnabled: z.boolean().optional(),
      notifyEmail: z.boolean().optional(),
      notifySlack: z.boolean().optional(),
      notifyInApp: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireUser();
    const body = schema.parse(await request.json());
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name: body.name,
        timezone: body.timezone,
        workHoursStart: body.workHoursStart,
        workHoursEnd: body.workHoursEnd,
        afterHoursThreshold: body.afterHoursThreshold,
        plan: body.plan,
      },
    });
    if (body.preferences) {
      await prisma.userPreference.upsert({
        where: { userId: sessionUser.id },
        create: { userId: sessionUser.id, ...body.preferences },
        update: body.preferences,
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { preferences: true, profile: true },
    });
    return json({ user });
  } catch (error) {
    return apiError(error);
  }
}
