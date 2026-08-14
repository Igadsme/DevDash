import { apiError, json, requireUser } from "@/lib/api";
import { syncIntegration, syncUser } from "@/lib/sync/engine";

export async function POST(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const user = await requireUser();
    const { provider } = await context.params;
    if (provider === "all") {
      const results = await syncUser(user.id);
      return json({ results });
    }
    const result = await syncIntegration(user.id, provider);
    return json(result);
  } catch (error) {
    return apiError(error);
  }
}
