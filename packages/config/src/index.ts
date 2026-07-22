import { z } from "zod";

const placeholder = /(replace[-_ ]?me|change[-_ ]?me|example\.com|development[-_ ]?only)/i;
const base64UrlKey = z.string().refine((value) => {
  try { return Buffer.from(value, "base64url").length === 32; } catch { return false; }
}, "must be a 32-byte base64url key");

export const serviceEnvironment = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  REDIS_URL: z.string().url(),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET_PRIVATE: z.string().min(1),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(8),
  SESSION_SECRET: z.string().min(32),
  OTP_SECRET: z.string().min(32),
  PAYOUT_ENCRYPTION_KEY: base64UrlKey,
  CORS_ORIGINS: z.string().min(1),
  PAYOUT_PROVIDER: z.enum(["disabled", "mock", "xendit"]).default("disabled"),
  XENDIT_API_URL: z.string().url().default("https://api.xendit.co"),
  XENDIT_SECRET_API_KEY: z.string().optional().default(""),
  XENDIT_WEBHOOK_TOKEN: z.string().optional().default(""),
  PAYOUT_PROVIDER_LICENSE_REFERENCE: z.string().optional().default(""),
  EMAIL_PROVIDER: z.enum(["disabled", "mock", "resend"]).default("disabled"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  NOTIFICATION_GATEWAY_URL: z.string().optional().default(""),
  NOTIFICATION_GATEWAY_TOKEN: z.string().optional().default(""),
  CLAMAV_HOST: z.string().min(1).default("localhost"),
  CLAMAV_PORT: z.coerce.number().int().min(1).max(65535).default(3310),
  METRICS_TOKEN: z.string().optional().default(""),
  ALERT_WEBHOOK_URL: z.string().optional().default(""),
  ALERT_WEBHOOK_TOKEN: z.string().optional().default(""),
}).superRefine((environment, context) => {
  if (environment.NODE_ENV !== "production") return;
  for (const key of ["SESSION_SECRET", "OTP_SECRET", "STORAGE_SECRET_KEY"] as const) {
    if (placeholder.test(environment[key])) context.addIssue({ code: "custom", path: [key], message: "placeholder value is forbidden in production" });
  }
  const origins = environment.CORS_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => !origin.startsWith("https://"))) {
    context.addIssue({ code: "custom", path: ["CORS_ORIGINS"], message: "production origins must use https://" });
  }
  if (environment.PAYOUT_PROVIDER === "xendit") {
    for (const key of ["XENDIT_SECRET_API_KEY", "XENDIT_WEBHOOK_TOKEN", "PAYOUT_PROVIDER_LICENSE_REFERENCE"] as const) {
      if (!environment[key] || placeholder.test(environment[key])) context.addIssue({ code: "custom", path: [key], message: "required when PAYOUT_PROVIDER=xendit" });
    }
  }
  if (environment.EMAIL_PROVIDER === "resend" && (!environment.RESEND_API_KEY || !environment.EMAIL_FROM)) {
    context.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "RESEND_API_KEY and EMAIL_FROM are required when EMAIL_PROVIDER=resend" });
  }
  if (environment.NOTIFICATION_GATEWAY_URL && !environment.NOTIFICATION_GATEWAY_TOKEN) {
    context.addIssue({ code: "custom", path: ["NOTIFICATION_GATEWAY_TOKEN"], message: "required when NOTIFICATION_GATEWAY_URL is set" });
  }
  if (!environment.METRICS_TOKEN || environment.METRICS_TOKEN.length < 24) context.addIssue({ code: "custom", path: ["METRICS_TOKEN"], message: "production metrics endpoint requires a token of at least 24 characters" });
  if (environment.ALERT_WEBHOOK_URL && !environment.ALERT_WEBHOOK_TOKEN) context.addIssue({ code: "custom", path: ["ALERT_WEBHOOK_TOKEN"], message: "required when ALERT_WEBHOOK_URL is set" });
});

export function loadServiceEnvironment(source: NodeJS.ProcessEnv = process.env) {
  return serviceEnvironment.parse(source);
}

export type ServiceEnvironment = z.infer<typeof serviceEnvironment>;
