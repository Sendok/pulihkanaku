const timeout = Number(process.env.PROVIDER_PROBE_TIMEOUT_MS ?? 10_000);
async function probe(name, url, init) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}: ${text.slice(0, 200)}`);
  console.log(`PASS ${name} (${response.status})`);
}

const checks = [];
if (process.env.PAYOUT_PROVIDER === "xendit") {
  if (!process.env.XENDIT_SECRET_API_KEY) throw new Error("XENDIT_SECRET_API_KEY is required");
  const authorization = `Basic ${Buffer.from(`${process.env.XENDIT_SECRET_API_KEY}:`).toString("base64")}`;
  checks.push(probe("Xendit credentials", `${process.env.XENDIT_API_URL ?? "https://api.xendit.co"}/balance`, { headers: { authorization } }));
}
if (process.env.EMAIL_PROVIDER === "resend") {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required");
  checks.push(probe("Resend credentials", "https://api.resend.com/domains", { headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` } }));
}
if (process.env.NOTIFICATION_GATEWAY_HEALTH_URL) {
  checks.push(probe("Notification gateway", process.env.NOTIFICATION_GATEWAY_HEALTH_URL, { headers: process.env.NOTIFICATION_GATEWAY_TOKEN ? { authorization: `Bearer ${process.env.NOTIFICATION_GATEWAY_TOKEN}` } : {} }));
}
if (!checks.length) throw new Error("No provider is enabled. Configure Xendit, Resend, or NOTIFICATION_GATEWAY_HEALTH_URL first.");
await Promise.all(checks);
