import "server-only";

import { plannerAdminGraphql } from "@/lib/look-planner/admin-api";
import { appClientId } from "@/lib/look-planner/auth";
import type { Schedule } from "@/lib/look-planner/schedule";
import { getSettings, updateSettings } from "@/lib/look-planner/store";

/**
 * Pushes the plan to the "look-bundle-discount" function. The function reads
 * this JSON from its discount's `$app:looks` metafield and picks the current
 * week from the shop-local date, so publishing ahead covers the whole window
 * even if no cron runs for a while.
 */

const DISCOUNT_TITLE = "Veckans look";
const METAFIELD = { namespace: "$app", key: "looks" } as const;

export type FunctionConfig = {
  percent: number;
  message: string;
  /** Monday -> looks that week, each a list of product ids. */
  weeks: Record<string, string[][]>;
};

export function buildFunctionConfig(
  schedule: Schedule,
  percent: number,
): FunctionConfig {
  const weeks: FunctionConfig["weeks"] = {};
  for (const [weekStart, looks] of schedule) {
    const lists = Object.values(looks)
      .map((look) => look.productIds)
      .filter((ids) => ids.length > 0);
    if (lists.length > 0) weeks[weekStart] = lists;
  }
  return { percent, message: `${DISCOUNT_TITLE} −${percent}%`, weeks };
}

type UserError = { field?: string[] | null; message: string };

function assertNoUserErrors(errors: UserError[] | undefined, label: string) {
  if (errors?.length) {
    throw new Error(`${label}: ${errors.map((e) => e.message).join("; ")}`);
  }
}

async function discountExists(shop: string, token: string, id: string) {
  const data = await plannerAdminGraphql<{ discountNode: { id: string } | null }>(
    shop,
    token,
    `#graphql
      query PlannerDiscount($id: ID!) { discountNode(id: $id) { id } }`,
    { id },
  );
  return Boolean(data.discountNode);
}

async function findFunctionId(shop: string, token: string) {
  const data = await plannerAdminGraphql<{
    shopifyFunctions: {
      nodes: { id: string; title: string; apiType: string; appKey: string }[];
    };
  }>(
    shop,
    token,
    `#graphql
      query PlannerFunctions {
        shopifyFunctions(first: 50) { nodes { id title apiType appKey } }
      }`,
  );
  const fn = data.shopifyFunctions.nodes.find(
    (node) => node.appKey === appClientId() && node.apiType.includes("discount"),
  );
  if (!fn) {
    throw new Error(
      "Discount function not found — run `npm run deploy` in shopify-app first",
    );
  }
  return fn.id;
}

async function createDiscount(shop: string, token: string, value: string) {
  const functionId = await findFunctionId(shop, token);
  const data = await plannerAdminGraphql<{
    discountAutomaticAppCreate: {
      automaticAppDiscount: { discountId: string } | null;
      userErrors: UserError[];
    };
  }>(
    shop,
    token,
    `#graphql
      mutation PlannerCreateDiscount($discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $discount) {
          automaticAppDiscount { discountId }
          userErrors { field message }
        }
      }`,
    {
      discount: {
        title: DISCOUNT_TITLE,
        functionId,
        discountClasses: ["PRODUCT"],
        startsAt: new Date().toISOString(),
        // Keep the look price honest: no stacking with other product/order deals.
        combinesWith: {
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: true,
        },
        metafields: [{ ...METAFIELD, type: "json", value }],
      },
    },
  );
  assertNoUserErrors(
    data.discountAutomaticAppCreate.userErrors,
    "discountAutomaticAppCreate",
  );
  return data.discountAutomaticAppCreate.automaticAppDiscount!.discountId;
}

async function writeConfig(
  shop: string,
  token: string,
  discountId: string,
  value: string,
) {
  const data = await plannerAdminGraphql<{
    metafieldsSet: { userErrors: UserError[] };
  }>(
    shop,
    token,
    `#graphql
      mutation PlannerWriteConfig($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { field message } }
      }`,
    {
      metafields: [{ ...METAFIELD, ownerId: discountId, type: "json", value }],
    },
  );
  assertNoUserErrors(data.metafieldsSet.userErrors, "metafieldsSet");
}

/** Publishes the schedule; records success or the error for the planner UI. */
export async function publishSchedule(
  shop: string,
  token: string,
  schedule: Schedule,
) {
  const settings = await getSettings(shop);
  const value = JSON.stringify(
    buildFunctionConfig(schedule, settings.discountPercent),
  );
  try {
    let discountId = settings.discountId;
    if (discountId && !(await discountExists(shop, token, discountId))) {
      discountId = null;
    }
    if (discountId) {
      await writeConfig(shop, token, discountId, value);
    } else {
      discountId = await createDiscount(shop, token, value);
    }
    return updateSettings(shop, {
      discountId,
      lastPublishedAt: new Date().toISOString(),
      lastPublishError: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Look planner publish failed:", message);
    return updateSettings(shop, { lastPublishError: message });
  }
}
