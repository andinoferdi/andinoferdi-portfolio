import "server-only";

import { createClient } from "@supabase/supabase-js";

const JAKARTA_TIMEZONE = "Asia/Jakarta";

type RegisterVisitInput = {
  ip: string;
  path: string;
  referrer: string;
  userAgent: string;
  serverTimestamp: string;
  clientTimestamp?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  timezone?: string;
};

type RegisterVisitResult = {
  isFirstVisitToday: boolean;
  reason?: "unknown_ip" | "already_recorded";
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const isUnknownIp = (ip: string): boolean => {
  if (!ip) return true;
  return ip.trim().toLowerCase() === "unknown";
};

const normalizeTimestamp = (value?: string): string | null => {
  if (!value || !value.trim() || value === "Unknown") return null;
  return value;
};

export const getJakartaVisitDay = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to compute Jakarta visit day.");
  }

  return `${year}-${month}-${day}`;
};

export const registerVisitIfFirstOfDay = async (
  input: RegisterVisitInput
): Promise<RegisterVisitResult> => {
  if (isUnknownIp(input.ip)) {
    return { isFirstVisitToday: false, reason: "unknown_ip" };
  }

  if (!supabase) {
    throw new Error(
      "Visit dedupe unavailable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  const { error } = await supabase.from("portfolio_visit_daily").insert({
    visit_day_jakarta: getJakartaVisitDay(),
    ip: input.ip,
    first_path: input.path,
    first_referrer: input.referrer,
    first_user_agent: input.userAgent,
    first_country: input.country ?? null,
    first_region: input.region ?? null,
    first_city: input.city ?? null,
    first_language: input.language ?? null,
    first_timezone: input.timezone ?? null,
    first_client_timestamp: normalizeTimestamp(input.clientTimestamp),
    first_server_timestamp: input.serverTimestamp,
  });

  if (!error) {
    return { isFirstVisitToday: true };
  }

  if (error.code === "23505") {
    return { isFirstVisitToday: false, reason: "already_recorded" };
  }

  throw new Error(`Visit dedupe insert failed: ${error.message}`);
};

