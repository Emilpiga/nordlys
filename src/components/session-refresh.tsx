"use client";

import { useEffect, useRef } from "react";

/**
 * When the layout renders a logged-in customer, token rotation may have
 * happened without being able to Set-Cookie (RSC). Persist via Route Handler.
 */
export function SessionRefresh({ enabled }: { enabled: boolean }) {
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;
    void fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => {
      /* ignore — next navigation will retry */
    });
  }, [enabled]);

  return null;
}
