import { apiError, json, requireUser } from "@/lib/api";
import { computeFocus } from "@/lib/engines/focus";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const focus = await computeFocus(user.id);
    return json(focus);
  } catch (error) {
    return apiError(error);
  }
}
