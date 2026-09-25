import {
  PlannerInputError,
  plannerRoute,
  refreshPlanner,
} from "@/lib/look-planner/handlers";
import { updateSettings } from "@/lib/look-planner/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wholeNumberIn(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max
    ? number
    : null;
}

export async function POST(request: Request) {
  return plannerRoute(request, async ({ shop, accessToken }) => {
    const body = (await request.json().catch(() => ({}))) as {
      discountPercent?: unknown;
      varietyWeeks?: unknown;
    };
    const discountPercent = wholeNumberIn(body.discountPercent, 0, 50);
    const varietyWeeks = wholeNumberIn(body.varietyWeeks, 1, 26);
    if (discountPercent === null) {
      throw new PlannerInputError("Rabatten måste vara 0–50 %");
    }
    if (varietyWeeks === null) {
      throw new PlannerInputError("Variation måste vara 1–26 veckor");
    }
    await updateSettings(shop, { discountPercent, varietyWeeks });
    return refreshPlanner(shop, accessToken, { publish: true });
  });
}
