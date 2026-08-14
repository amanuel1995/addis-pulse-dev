"use client";

import { useEffect } from "react";

export function CampaignVisitTracker({ qrToken }: { qrToken: string }) {
  useEffect(() => {
    const key = `rideperk-visit:${qrToken}`;
    const existing = sessionStorage.getItem(key);
    if (existing) return;
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
    void fetch("/api/v1/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken, sessionId }),
      keepalive: true,
    }).catch(() => sessionStorage.removeItem(key));
  }, [qrToken]);
  return null;
}
