import "server-only";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export type VisitEmailPayload = {
  ip: string;
  path: string;
  referrer: string;
  userAgent: string;
  serverTimestamp: string;
  clientTimestamp?: string;
  country?: string;
  city?: string;
  region?: string;
  language?: string;
  timezone?: string;
};

type BrevoRecipient = {
  email: string;
  name?: string;
};

type BrevoEmailRequest = {
  sender: BrevoRecipient;
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent: string;
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const toSafeValue = (value?: string): string => {
  if (!value || !value.trim()) return "Unknown";
  return value.trim();
};

const buildSubject = (path: string): string => {
  return `[Portfolio] New Visit - ${path}`;
};

const buildTextContent = (payload: VisitEmailPayload): string => {
  return [
    "Someone visited your portfolio.",
    "",
    "Visit Details:",
    `IP Address: ${toSafeValue(payload.ip)}`,
    `Path: ${toSafeValue(payload.path)}`,
    `Referrer: ${toSafeValue(payload.referrer)}`,
    `User Agent: ${toSafeValue(payload.userAgent)}`,
    `Country: ${toSafeValue(payload.country)}`,
    `Region: ${toSafeValue(payload.region)}`,
    `City: ${toSafeValue(payload.city)}`,
    `Language: ${toSafeValue(payload.language)}`,
    `Timezone: ${toSafeValue(payload.timezone)}`,
    `Server Timestamp: ${toSafeValue(payload.serverTimestamp)}`,
    `Client Timestamp: ${toSafeValue(payload.clientTimestamp)}`,
  ].join("\n");
};

const buildHtmlContent = (payload: VisitEmailPayload): string => {
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <p>Someone visited your portfolio.</p>
    <div style="background:#f3f4f6; border-radius:8px; padding:16px; margin-top:16px;">
      <p style="margin:0 0 12px 0;"><strong>Visit Details:</strong></p>
      <p style="margin:4px 0;"><strong>IP Address:</strong> ${escapeHtml(toSafeValue(payload.ip))}</p>
      <p style="margin:4px 0;"><strong>Path:</strong> ${escapeHtml(toSafeValue(payload.path))}</p>
      <p style="margin:4px 0;"><strong>Referrer:</strong> ${escapeHtml(toSafeValue(payload.referrer))}</p>
      <p style="margin:4px 0;"><strong>User Agent:</strong> ${escapeHtml(toSafeValue(payload.userAgent))}</p>
      <p style="margin:4px 0;"><strong>Country:</strong> ${escapeHtml(toSafeValue(payload.country))}</p>
      <p style="margin:4px 0;"><strong>Region:</strong> ${escapeHtml(toSafeValue(payload.region))}</p>
      <p style="margin:4px 0;"><strong>City:</strong> ${escapeHtml(toSafeValue(payload.city))}</p>
      <p style="margin:4px 0;"><strong>Language:</strong> ${escapeHtml(toSafeValue(payload.language))}</p>
      <p style="margin:4px 0;"><strong>Timezone:</strong> ${escapeHtml(toSafeValue(payload.timezone))}</p>
      <p style="margin:4px 0;"><strong>Server Timestamp:</strong> ${escapeHtml(toSafeValue(payload.serverTimestamp))}</p>
      <p style="margin:4px 0;"><strong>Client Timestamp:</strong> ${escapeHtml(toSafeValue(payload.clientTimestamp))}</p>
    </div>
  </div>
  `;
};

export const sendVisitNotification = async (
  payload: VisitEmailPayload
): Promise<void> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "Andino Portfolio";
  const toEmail =
    process.env.VISIT_ALERT_TO_EMAIL ?? "andinoferdiansah@gmail.com";

  if (!apiKey || !senderEmail) {
    console.warn(
      "Visit notification skipped: BREVO_API_KEY or BREVO_SENDER_EMAIL is missing."
    );
    return;
  }

  const subject = buildSubject(toSafeValue(payload.path));
  const requestBody: BrevoEmailRequest = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [{ email: toEmail }],
    subject,
    htmlContent: buildHtmlContent(payload),
    textContent: buildTextContent(payload),
  };

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Brevo email request failed with status ${response.status}: ${errorText}`
    );
  }
};
