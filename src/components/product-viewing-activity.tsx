"use client";

import { useEffect, useState } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/presence-constants";

type ProductViewingActivityProps = {
  productId: string;
};

type PresenceResponse =
  | { ok: true; others: number }
  | { ok: false; reason?: string; others?: number };

/**
 * Live count of other active sessions on this PDP.
 * Hidden when presence isn't configured, the request fails, or nobody else is here.
 */
export function ProductViewingActivity({
  productId,
}: ProductViewingActivityProps) {
  const { dict, t } = useDictionary();
  const [others, setOthers] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeout: number;

    const beat = async () => {
      try {
        const response = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await response.json()) as PresenceResponse;
        if (cancelled) return;
        if (response.ok && data.ok) {
          setOthers(Math.max(0, data.others));
        } else {
          setOthers(null);
        }
      } catch {
        if (!cancelled) setOthers(null);
      }
    };

    const schedule = () => {
      timeout = window.setTimeout(() => {
        void beat().finally(() => {
          if (!cancelled) schedule();
        });
      }, PRESENCE_HEARTBEAT_MS);
    };

    void beat().finally(() => {
      if (!cancelled) schedule();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [productId]);

  if (others == null || others < 1) return null;

  const label =
    others === 1
      ? dict.products.viewingOne
      : t(dict.products.viewingMany, { count: others });

  return (
    <p
      className="flex items-center gap-2.5 text-sm font-light leading-relaxed text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
        <span className="animate-live-ping absolute inset-0 rounded-full bg-glow/55" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-glow" />
      </span>
      {label}
    </p>
  );
}
