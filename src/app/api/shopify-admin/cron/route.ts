import { NextResponse } from "next/server";
import { storedOfflineToken } from "@/lib/look-planner/auth";
import { publishSchedule } from "@/lib/look-planner/publish";
import { ensureSchedule } from "@/lib/look-planner/schedule";
import { shopifyConfig } from "@/lib/shopify/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily Vercel Cron: keeps the planning window filled and the discount
 * function's config current, whether or not anyone opens the planner.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = shopifyConfig.storeDomain;
  const schedule = await ensureSchedule(shop);
  const token = await storedOfflineToken(shop);
  if (!token) {
    // The planner hasn't been opened since install — nothing to publish with.
    return NextResponse.json({ ok: true, published: false, weeks: schedule.size });
  }
  const settings = await publishSchedule(shop, token, schedule);
  return NextResponse.json({
    ok: !settings.lastPublishError,
    published: !settings.lastPublishError,
    error: settings.lastPublishError,
  });
}
