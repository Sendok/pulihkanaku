const target = process.argv[2];
if (!target) throw new Error("Usage: node --env-file=.env.production scripts/send-provider-test.mjs EMAIL_OR_PHONE");
if (process.env.CONFIRM_PROVIDER_SEND !== "send-pulihkanaku-test") throw new Error("Set CONFIRM_PROVIDER_SEND=send-pulihkanaku-test to authorize one test message");

const subject = `PulihkanAku provider test ${new Date().toISOString()}`;
let response;
if (target.includes("@")) {
  if (process.env.EMAIL_PROVIDER !== "resend" || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error("Resend is not configured");
  response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [target], subject, text: "Pesan uji PulihkanAku berhasil dikirim. Tidak ada tindakan yang diperlukan." }),
  });
} else {
  if (!process.env.NOTIFICATION_GATEWAY_URL || !process.env.NOTIFICATION_GATEWAY_TOKEN) throw new Error("Notification gateway is not configured");
  response = await fetch(process.env.NOTIFICATION_GATEWAY_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.NOTIFICATION_GATEWAY_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ to: target, channel: "WHATSAPP", template: "pulihkanaku_notification", parameters: { title: "Uji provider PulihkanAku", body: "Pesan uji berhasil dikirim. Tidak ada tindakan yang diperlukan." } }),
  });
}
const body = await response.text();
if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}: ${body.slice(0, 300)}`);
console.log(`Test message accepted by provider (${response.status}).`);
