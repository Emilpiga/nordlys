import "server-only";

import { NextResponse } from "next/server";
import {
  PlannerAuthError,
  authenticatePlannerRequest,
} from "@/lib/look-planner/auth";
import { publishSchedule } from "@/lib/look-planner/publish";
import { ensureSchedule } from "@/lib/look-planner/schedule";
import { getSettings } from "@/lib/look-planner/store";
import { buildPlannerView } from "@/lib/look-planner/view";

const NO_STORE = { "Cache-Control": "no-store" };

/** Re-plans, publishes to the discount function and returns the planner view. */
export async function refreshPlanner(
  shop: string,
  accessToken: string,
  { publish }: { publish: boolean },
) {
  const schedule = await ensureSchedule(shop);
  const settings = publish
    ? await publishSchedule(shop, accessToken, schedule)
    : await getSettings(shop);
  return buildPlannerView(shop, schedule, settings);
}

/** Authenticated planner route: session token in, JSON out, errors mapped. */
export async function plannerRoute(
  request: Request,
  handle: (auth: { shop: string; accessToken: string }) => Promise<unknown>,
) {
  try {
    const auth = await authenticatePlannerRequest(request);
    return NextResponse.json(await handle(auth), { headers: NO_STORE });
  } catch (error) {
    if (error instanceof PlannerAuthError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          // Tells App Bridge to fetch a fresh session token and retry.
          headers: { ...NO_STORE, "X-Shopify-Retry-Invalid-Session-Request": "1" },
        },
      );
    }
    if (error instanceof PlannerInputError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    }
    console.error("Look planner request failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500, headers: NO_STORE },
    );
  }
}

export class PlannerInputError extends Error {}
