import { ImageResponse } from "next/og";
import { BRAND_CREAM, BRAND_INK, BRAND_MARK_V_PATH, BRAND_MUTED, BRAND_PAPER } from "@/lib/brand";
import { shopifyConfig } from "@/lib/shopify/config";

export const alt = `${shopifyConfig.storeName} — Produkter för vardagen`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const name = shopifyConfig.storeName;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: BRAND_PAPER,
          color: BRAND_INK,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              background: BRAND_INK,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 64 64">
              <path d={BRAND_MARK_V_PATH} fill={BRAND_CREAM} />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 400,
            color: BRAND_MUTED,
            maxWidth: "720px",
            lineHeight: 1.35,
          }}
        >
          Produkter till hemmet och vardagen
        </div>
      </div>
    ),
    { ...size },
  );
}
