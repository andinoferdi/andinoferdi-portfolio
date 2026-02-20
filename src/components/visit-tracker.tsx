"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type VisitPayload = {
  path: string;
  referrer: string;
  clientTimestamp: string;
  language: string;
  timezone: string;
};

const TRACK_ENDPOINT = "/api/visit";
const VISIT_SESSION_KEY = "portfolio_visit_sent";

export const VisitTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(VISIT_SESSION_KEY) === "1") return;

    const payload: VisitPayload = {
      path: pathname,
      referrer: document.referrer || "Direct visit",
      clientTimestamp: new Date().toISOString(),
      language: navigator.language || "Unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
    };

    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: "no-store",
    })
      .then(() => {
        window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
      })
      .catch(() => undefined);
  }, [pathname]);

  return null;
};
