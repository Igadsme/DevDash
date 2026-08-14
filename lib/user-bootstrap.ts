import { prisma } from "@/lib/prisma";

export async function ensureUserDefaults(userId: string) {
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, preferences: true },
  });
  return user;
}
