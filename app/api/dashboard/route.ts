import { apiError, json, requireUser } from "@/lib/api";
import { getDashboard } from "@/lib/engines/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getDashboard(user.id);
    return json(data);
  } catch (error) {
    return apiError(error);
  }
}
