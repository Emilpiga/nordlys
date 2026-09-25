import { initPostHog } from "@/lib/posthog";

try {
  initPostHog();
} catch (error) {
  console.error("PostHog init failed:", error);
}
