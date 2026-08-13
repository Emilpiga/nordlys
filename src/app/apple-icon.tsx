import { brandMarkImageResponse } from "@/lib/brand-mark-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return brandMarkImageResponse(size.width);
}
