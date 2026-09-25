import { plannerRoute, refreshPlanner } from "@/lib/look-planner/handlers";
import { getSettings } from "@/lib/look-planner/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPUBLISH_AFTER_MS = 60 * 60 * 1000;

/** Planner state. Publishes when the function config is missing or stale. */
export async function GET(request: Request) {
  return plannerRoute(request, async ({ shop, accessToken }) => {
    const settings = await getSettings(shop);
    const lastPublished = settings.lastPublishedAt
      ? Date.parse(settings.lastPublishedAt)
      : 0;
    const publish =
      !settings.discountId ||
      Boolean(settings.lastPublishError) ||
      Date.now() - lastPublished > REPUBLISH_AFTER_MS;
    return refreshPlanner(shop, accessToken, { publish });
  });
}
