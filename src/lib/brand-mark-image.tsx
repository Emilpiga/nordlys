import { ImageResponse } from "next/og";
import { BRAND_CREAM, BRAND_INK, BRAND_MARK_V_PATH } from "@/lib/brand";

export function brandMarkImageResponse(size: number, rounded = false) {
  const radius = rounded ? Math.round(size * 0.22) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND_INK,
          borderRadius: radius,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 64 64"
        >
          <path d={BRAND_MARK_V_PATH} fill={BRAND_CREAM} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
