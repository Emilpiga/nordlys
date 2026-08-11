import { ImageResponse } from "next/og";
import { shopifyConfig } from "@/lib/shopify/config";

export const alt = `${shopifyConfig.storeName} — Nordisk hudvård`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const name = shopifyConfig.storeName.toUpperCase();

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
          background: "linear-gradient(145deg, #e8eef1 0%, #f7f9fa 42%, #ddd4d0 100%)",
          color: "#14201c",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "48px",
            height: "1px",
            background: "rgba(20, 32, 28, 0.35)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 500,
              letterSpacing: "0.28em",
              lineHeight: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "#5a6661",
              maxWidth: "720px",
              lineHeight: 1.35,
            }}
          >
            Nordisk hudvård för klar, lugn hy
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9a6f69",
          }}
        >
          <span>Mjuka formler</span>
          <span>Nordiskt ljus</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
