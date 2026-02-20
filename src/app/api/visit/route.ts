import { NextRequest } from "next/server";
import { sendVisitNotification, type VisitEmailPayload } from "@/lib/visit-email";
import { createHash } from "node:crypto";

type VisitRequestBody = {
  path?: string;
  referrer?: string;
  clientTimestamp?: string;
  language?: string;
  timezone?: string;
  eventType?: "session_start" | "route_change";
  visitorId?: string;
  clientHints?: string;
};

const BOT_USER_AGENT_PATTERN =
  /(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|linkedinbot|headless|lighthouse|pagespeed|siteaudit)/i;

const pickHeader = (headers: Headers, headerName: string): string => {
  return headers.get(headerName)?.trim() ?? "";
};

const pickFirstForwardedIp = (value: string): string => {
  if (!value) return "";
  const [firstIp] = value.split(",");
  return firstIp?.trim() ?? "";
};

const getClientIp = (headers: Headers): string => {
  const forwardedFor = pickFirstForwardedIp(pickHeader(headers, "x-forwarded-for"));
  const realIp = pickHeader(headers, "x-real-ip");
  const cfIp = pickHeader(headers, "cf-connecting-ip");
  const vercelForwardedFor = pickFirstForwardedIp(
    pickHeader(headers, "x-vercel-forwarded-for")
  );

  return forwardedFor || realIp || cfIp || vercelForwardedFor || "Unknown";
};

const normalizePath = (path?: string): string => {
  if (!path || !path.trim()) return "/";
  const cleanPath = path.trim();
  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
};

const normalizeValue = (value?: string): string => {
  if (!value || !value.trim()) return "Unknown";
  return value.trim();
};

const buildDeviceSignature = (input: {
  visitorId: string;
  userAgent: string;
  secChUa: string;
  secChUaPlatform: string;
  secChUaMobile: string;
}): string => {
  const raw = [
    input.visitorId,
    input.userAgent,
    input.secChUa,
    input.secChUaPlatform,
    input.secChUaMobile,
  ].join("|");

  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
};

const isLikelyBot = (userAgent: string): boolean => {
  return BOT_USER_AGENT_PATTERN.test(userAgent);
};

export async function POST(request: NextRequest) {
  let body: VisitRequestBody = {};

  try {
    body = (await request.json()) as VisitRequestBody;
  } catch {
    body = {};
  }

  const headers = request.headers;
  const userAgent = normalizeValue(pickHeader(headers, "user-agent"));
  const secChUa = normalizeValue(pickHeader(headers, "sec-ch-ua"));
  const secChUaPlatform = normalizeValue(
    pickHeader(headers, "sec-ch-ua-platform")
  );
  const secChUaMobile = normalizeValue(pickHeader(headers, "sec-ch-ua-mobile"));
  const visitorId = normalizeValue(body.visitorId);
  const eventType = body.eventType ?? "session_start";
  const normalizedClientHints =
    normalizeValue(body.clientHints) !== "Unknown"
      ? normalizeValue(body.clientHints)
      : `sec-ch-ua=${secChUa}; sec-ch-ua-platform=${secChUaPlatform}; sec-ch-ua-mobile=${secChUaMobile}`;

  if (isLikelyBot(userAgent)) {
    return new Response(null, { status: 204 });
  }

  const payload: VisitEmailPayload = {
    ip: getClientIp(headers),
    path: normalizePath(body.path),
    referrer:
      normalizeValue(body.referrer) !== "Unknown"
        ? normalizeValue(body.referrer)
        : normalizeValue(pickHeader(headers, "referer")) !== "Unknown"
        ? normalizeValue(pickHeader(headers, "referer"))
        : "Direct visit",
    userAgent,
    serverTimestamp: new Date().toISOString(),
    clientTimestamp: normalizeValue(body.clientTimestamp),
    country: normalizeValue(pickHeader(headers, "x-vercel-ip-country")),
    region: normalizeValue(pickHeader(headers, "x-vercel-ip-country-region")),
    city: normalizeValue(pickHeader(headers, "x-vercel-ip-city")),
    language: normalizeValue(body.language),
    timezone: normalizeValue(body.timezone),
    visitorId,
    eventType,
    clientHints: normalizedClientHints,
    deviceSignature: buildDeviceSignature({
      visitorId,
      userAgent,
      secChUa,
      secChUaPlatform,
      secChUaMobile,
    }),
  };

  try {
    await sendVisitNotification(payload);
  } catch (error) {
    console.error("Failed to send visit notification:", error);
  }

  return new Response(null, { status: 204 });
}
