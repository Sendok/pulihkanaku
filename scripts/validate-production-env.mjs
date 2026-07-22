import { Buffer } from "node:buffer";

const failures = [];
const warnings = [];
const required = ["POSTGRES_PASSWORD", "REDIS_PASSWORD", "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD", "SESSION_SECRET", "OTP_SECRET", "PAYOUT_ENCRYPTION_KEY", "CORS_ORIGINS"];
const placeholder = /(change[-_ ]?me|replace[-_ ]?me|example\.com|development[-_ ]?only)/i;
const value = (key) => process.env[key]?.trim() ?? "";

for (const key of required) {
  if (!value(key)) failures.push(`${key} is required`);
  else if (placeholder.test(value(key))) failures.push(`${key} still contains a placeholder`);
}
for (const key of ["POSTGRES_PASSWORD", "REDIS_PASSWORD", "MINIO_ROOT_PASSWORD", "SESSION_SECRET", "OTP_SECRET"]) {
  if (value(key) && value(key).length < 24) failures.push(`${key} must contain at least 24 characters`);
}
if (value("SESSION_SECRET") && value("SESSION_SECRET") === value("OTP_SECRET")) failures.push("SESSION_SECRET and OTP_SECRET must be independent");
try {
  if (Buffer.from(value("PAYOUT_ENCRYPTION_KEY"), "base64url").length !== 32) failures.push("PAYOUT_ENCRYPTION_KEY must decode to exactly 32 bytes");
} catch { failures.push("PAYOUT_ENCRYPTION_KEY must be valid base64url"); }

for (const origin of value("CORS_ORIGINS").split(",").map((item) => item.trim()).filter(Boolean)) {
  if (!origin.startsWith("https://")) failures.push(`CORS origin must use HTTPS: ${origin}`);
  if (origin.endsWith("/")) failures.push(`CORS origin must not end with '/': ${origin}`);
}

const payout = value("PAYOUT_PROVIDER") || "disabled";
if (!new Set(["disabled", "xendit"]).has(payout)) failures.push("PAYOUT_PROVIDER must be disabled or xendit in production");
if (payout === "xendit") {
  for (const key of ["XENDIT_SECRET_API_KEY", "XENDIT_WEBHOOK_TOKEN", "PAYOUT_PROVIDER_LICENSE_REFERENCE"]) {
    if (!value(key) || placeholder.test(value(key))) failures.push(`${key} is required for Xendit payouts`);
  }
} else warnings.push("Payout is disabled; no money movement will be attempted.");

const email = value("EMAIL_PROVIDER") || "disabled";
if (!new Set(["disabled", "resend"]).has(email)) failures.push("EMAIL_PROVIDER must be disabled or resend in production");
if (email === "resend" && (!value("RESEND_API_KEY") || !value("EMAIL_FROM"))) failures.push("RESEND_API_KEY and EMAIL_FROM are required for Resend");
if (value("NOTIFICATION_GATEWAY_URL") && !value("NOTIFICATION_GATEWAY_TOKEN")) failures.push("NOTIFICATION_GATEWAY_TOKEN is required when a notification gateway is configured");
if (email === "disabled" && !value("NOTIFICATION_GATEWAY_URL")) warnings.push("OTP/notifications are disabled; account recovery cannot deliver codes.");

const goLive = value("GO_LIVE").toLowerCase() === "true";
if (goLive && payout !== "xendit") failures.push("GO_LIVE=true requires PAYOUT_PROVIDER=xendit");
if (goLive && email === "disabled" && !value("NOTIFICATION_GATEWAY_URL")) failures.push("GO_LIVE=true requires at least one notification provider");

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}
console.log(`Environment valid for ${goLive ? "go-live" : "staging/infrastructure"} deployment.`);
