import { brandMarkImageResponse } from "@/lib/brand-mark-image";

export const contentType = "image/png";

export function GET() {
  return brandMarkImageResponse(32);
}
