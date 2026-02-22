"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type VisitPayload = {
  path: string;
  referrer: string;
  clientTimestamp: string;
  language: string;
  timezone: string;
  eventType: "session_start" | "route_change";
  visitorId: string;
  clientHints?: string;
};

const TRACK_ENDPOINT = "/api/visit";
const VISIT_SESSION_KEY = "portfolio_visit_sent";
const VISIT_STATE_KEY = "portfolio_visit_state";
const VISIT_LAST_ATTEMPT_KEY = "portfolio_visit_last_attempt";
const VISIT_LAST_FAILED_PATH_KEY = "portfolio_visit_last_failed_path";
const VISIT_LAST_FAILED_AT_KEY = "portfolio_visit_last_failed_at";
const VISITOR_COOKIE_KEY = "portfolio_visitor_id";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // 2 years
const RETRY_COOLDOWN_MS = 3000;
const SAME_PATH_FAILURE_COOLDOWN_MS = 15000;

type VisitState = "idle" | "sending" | "sent";

type UserAgentDataLike = {
  brands?: Array<{ brand: string; version: string }>;
  platform?: string;
  mobile?: boolean;
};

const generateVisitorId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const getCookieValue = (key: string): string | null => {
  if (typeof document === "undefined") return null;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedKey}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookieValue = (key: string, value: string, maxAgeSeconds: number): void => {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
};

const getOrCreateVisitorId = (): string => {
  const existingVisitorId = getCookieValue(VISITOR_COOKIE_KEY);
  if (existingVisitorId) return existingVisitorId;

  const newVisitorId = generateVisitorId();
  setCookieValue(VISITOR_COOKIE_KEY, newVisitorId, VISITOR_COOKIE_MAX_AGE_SECONDS);
  return newVisitorId;
};

const buildClientHints = (): string => {
  if (typeof navigator === "undefined") return "Unknown";

  const uaData = (navigator as Navigator & { userAgentData?: UserAgentDataLike })
    .userAgentData;

  if (!uaData) return "Unknown";

  const brands =
    uaData.brands?.map((brand) => `${brand.brand}/${brand.version}`).join(", ") ??
    "Unknown";
  const platform = uaData.platform ?? "Unknown";
  const mobile = uaData.mobile === true ? "true" : "false";

  return `brands=${brands}; platform=${platform}; mobile=${mobile}`;
};

export const VisitTracker = () => {
  const pathname = usePathname();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;

    if (typeof window === "undefined") return;
    if (inFlightRef.current) return;

    if (window.sessionStorage.getItem(VISIT_SESSION_KEY) === "1") return;

    const currentState =
      (window.sessionStorage.getItem(VISIT_STATE_KEY) as VisitState | null) ??
      "idle";

    if (currentState === "sending" || currentState === "sent") return;

    const now = Date.now();
    const lastAttemptRaw = window.sessionStorage.getItem(VISIT_LAST_ATTEMPT_KEY);
    const lastAttempt = lastAttemptRaw ? Number(lastAttemptRaw) : 0;

    if (Number.isFinite(lastAttempt) && now - lastAttempt < RETRY_COOLDOWN_MS) {
      return;
    }

    const lastFailedPath = window.sessionStorage.getItem(VISIT_LAST_FAILED_PATH_KEY);
    const lastFailedAtRaw = window.sessionStorage.getItem(VISIT_LAST_FAILED_AT_KEY);
    const lastFailedAt = lastFailedAtRaw ? Number(lastFailedAtRaw) : 0;
    const isSamePathFailure =
      lastFailedPath === pathname &&
      Number.isFinite(lastFailedAt) &&
      now - lastFailedAt < SAME_PATH_FAILURE_COOLDOWN_MS;

    if (isSamePathFailure) {
      return;
    }

    inFlightRef.current = true;
    window.sessionStorage.setItem(VISIT_STATE_KEY, "sending");
    window.sessionStorage.setItem(VISIT_LAST_ATTEMPT_KEY, String(now));

    const payload: VisitPayload = {
      path: pathname,
      referrer: document.referrer || "Direct visit",
      clientTimestamp: new Date().toISOString(),
      language: navigator.language || "Unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
      eventType: "session_start",
      visitorId: getOrCreateVisitorId(),
      clientHints: buildClientHints(),
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
        window.sessionStorage.setItem(VISIT_STATE_KEY, "sent");
        window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
        window.sessionStorage.removeItem(VISIT_LAST_FAILED_PATH_KEY);
        window.sessionStorage.removeItem(VISIT_LAST_FAILED_AT_KEY);
      })
      .catch(() => {
        window.sessionStorage.setItem(VISIT_STATE_KEY, "idle");
        window.sessionStorage.setItem(VISIT_LAST_FAILED_PATH_KEY, pathname);
        window.sessionStorage.setItem(VISIT_LAST_FAILED_AT_KEY, String(Date.now()));
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [pathname]);

  return null;
};
