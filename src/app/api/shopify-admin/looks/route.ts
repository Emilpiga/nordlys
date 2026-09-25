import { LOOK_SLOTS, PIECES_PER_LOOK } from "@/lib/look-planner/config";
import {
  PlannerInputError,
  plannerRoute,
  refreshPlanner,
} from "@/lib/look-planner/handlers";
import {
  autoPickLook,
  plannedWeekStarts,
  setManualLook,
} from "@/lib/look-planner/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LookRequest = {
  weekStart?: string;
  slot?: string;
  /** manual: use productIds · auto: back to the automatic pick · reroll: a new automatic pick */
  action?: "manual" | "auto" | "reroll";
  productIds?: string[];
};

const PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d+$/;

export async function POST(request: Request) {
  return plannerRoute(request, async ({ shop, accessToken }) => {
    const body = (await request.json().catch(() => ({}))) as LookRequest;
    const { weekStart, slot, action } = body;

    if (!weekStart || !plannedWeekStarts().includes(weekStart)) {
      throw new PlannerInputError("Veckan ligger utanför planeringen");
    }
    if (!slot || !LOOK_SLOTS.some((item) => item.key === slot)) {
      throw new PlannerInputError("Okänd look");
    }

    if (action === "manual") {
      const ids = body.productIds ?? [];
      if (
        ids.length !== PIECES_PER_LOOK ||
        new Set(ids).size !== ids.length ||
        !ids.every((id) => PRODUCT_GID.test(id))
      ) {
        throw new PlannerInputError(
          `Välj exakt ${PIECES_PER_LOOK} olika produkter`,
        );
      }
      await setManualLook(shop, weekStart, slot, ids);
    } else if (action === "auto" || action === "reroll") {
      const look = await autoPickLook(shop, weekStart, slot, {
        avoidCurrent: action === "reroll",
      });
      if (!look) {
        throw new PlannerInputError("Hittade inga köpbara produkter för looken");
      }
    } else {
      throw new PlannerInputError("Okänd åtgärd");
    }

    return refreshPlanner(shop, accessToken, { publish: true });
  });
}
