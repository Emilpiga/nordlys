import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand catalog purge. Call from Shopify Admin webhooks
 * (products/create|update|delete, collections/*) or manually:
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "tags": ["products"], "paths": ["/"] }
 *
 * Without a body, purges the usual catalog tags + home/products routes.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const headerSecret = request.headers.get("x-revalidate-secret") ?? "";
  if (token !== secret && headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let tags = ["products", "collections"];
  let paths = ["/", "/products"];

  try {
    const body = (await request.json()) as {
      tags?: string[];
      paths?: string[];
      handle?: string;
    };
    if (body.tags?.length) tags = body.tags;
    if (body.paths?.length) paths = body.paths;
    if (body.handle) {
      tags = [...new Set([...tags, `product:${body.handle}`])];
      paths = [...new Set([...paths, `/products/${body.handle}`])];
    }
  } catch {
    // Empty / non-JSON body → default catalog purge (Shopify webhook-friendly).
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, revalidated: { tags, paths } });
}
