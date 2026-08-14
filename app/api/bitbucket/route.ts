import { apiError, json, requireUser } from "@/lib/api";
import { syncIntegration } from "@/lib/sync/engine";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncIntegration(user.id, "bitbucket");
    return json(result);
  } catch (error) {
    return apiError(error);
  }
}
