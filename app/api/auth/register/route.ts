import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, json } from "@/lib/api";
import { ensureUserDefaults } from "@/lib/user-bootstrap";
import { assertRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  try {
    assertRateLimit("register", 10, 10 * 60_000);
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return json({ error: "An account with that email already exists." }, 409);
    }
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name || email.split("@")[0],
        passwordHash: await hash(body.password, 12),
      },
    });
    await ensureUserDefaults(user.id);
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
