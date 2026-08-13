import { brandMarkImageResponse } from "@/lib/brand-mark-image";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return brandMarkImageResponse(size.width);
}
