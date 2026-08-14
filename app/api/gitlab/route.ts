import { apiError, json, requireUser } from "@/lib/api";
import { syncIntegration } from "@/lib/sync/engine";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncIntegration(user.id, "gitlab");
    return json(result);
  } catch (error) {
    return apiError(error);
  }
}
