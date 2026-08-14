import { apiError, json, requireUser } from "@/lib/api";
import { computeAnalytics } from "@/lib/engines/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await computeAnalytics(user.id);
    return json(data);
  } catch (error) {
    return apiError(error);
  }
}
