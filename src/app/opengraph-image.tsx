import { ImageResponse } from "next/og";
import { shopifyConfig } from "@/lib/shopify/config";

export const alt = `${shopifyConfig.storeName} — Nordisk belysning`;
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
          background: "linear-gradient(145deg, #efeae3 0%, #f7f5f1 42%, #e8e0d4 100%)",
          color: "#1a1814",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "48px",
            height: "1px",
            background: "rgba(20, 28, 34, 0.35)",
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
              color: "#6a655c",
              maxWidth: "720px",
              lineHeight: 1.35,
            }}
          >
            Nordisk belysning för lugna rum
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
            color: "#b08a4a",
          }}
        >
          <span>Varmt sken</span>
          <span>Nordiskt ljus</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
