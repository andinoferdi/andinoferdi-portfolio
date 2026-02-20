import { NextRequest } from "next/server";
import { sendVisitNotification, type VisitEmailPayload } from "@/lib/visit-email";
import { registerVisitIfFirstOfDay } from "@/lib/visit-dedupe";

type VisitRequestBody = {
  path?: string;
  referrer?: string;
  clientTimestamp?: string;
  language?: string;
  timezone?: string;
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
  };

  try {
    const dedupeResult = await registerVisitIfFirstOfDay({
      ip: payload.ip,
      path: payload.path,
      referrer: payload.referrer,
      userAgent: payload.userAgent,
      serverTimestamp: payload.serverTimestamp,
      clientTimestamp: payload.clientTimestamp,
      country: payload.country,
      region: payload.region,
      city: payload.city,
      language: payload.language,
      timezone: payload.timezone,
    });

    if (!dedupeResult.isFirstVisitToday) {
      return new Response(null, { status: 204 });
    }

    await sendVisitNotification(payload);
  } catch (error) {
    console.error("Failed to send visit notification:", error);
  }

  return new Response(null, { status: 204 });
}
