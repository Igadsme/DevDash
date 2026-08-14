import { apiError, json, requireUser } from "@/lib/api";
import { getWhatNeedsMe } from "@/lib/engines/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await getWhatNeedsMe(user.id);
    return json({ items });
  } catch (error) {
    return apiError(error);
  }
}
