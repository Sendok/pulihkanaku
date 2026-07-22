import { DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadServiceEnvironment } from "@pulihkanaku/config";
import { createPostgresDatabase } from "@pulihkanaku/database";
import { Redis } from "ioredis";
import { randomUUID } from "node:crypto";
import { connect } from "node:net";

type Check = { name: string; ok: boolean; detail: string; durationMs: number };

async function timed(name: string, action: () => Promise<string>): Promise<Check> {
  const started = Date.now();
  try { return { name, ok: true, detail: await action(), durationMs: Date.now() - started }; }
  catch (error) { return { name, ok: false, detail: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started }; }
}

function clamScan(host: string, port: number, payload: Buffer) {
  return new Promise<string>((resolve, reject) => {
    const socket = connect(port, host);
    let response = "";
    const timer = setTimeout(() => socket.destroy(new Error("ClamAV timeout")), 15_000);
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      const size = Buffer.alloc(4);
      size.writeUInt32BE(payload.length);
      socket.write(size);
      socket.write(payload);
      socket.end(Buffer.alloc(4));
    });
    socket.on("data", (chunk) => { response += chunk.toString("utf8"); });
    socket.on("error", reject);
    socket.on("close", () => {
      clearTimeout(timer);
      if (response) resolve(response.replace(/\0/g, "").trim());
      else reject(new Error("ClamAV returned no response"));
    });
  });
}

async function main() {
  const env = loadServiceEnvironment();
  const { pool } = createPostgresDatabase(env.DATABASE_URL, env.DATABASE_POOL_MAX);
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 5_000 });
  const storage = new S3Client({
    endpoint: env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: env.STORAGE_ACCESS_KEY, secretAccessKey: env.STORAGE_SECRET_KEY },
  });
  const probeKey = `preflight/${randomUUID()}.txt`;
  const redisKey = `preflight:${randomUUID()}`;
  const requiredTables = ["users", "jobs", "job_assignments", "payouts", "provider_webhooks", "messages", "risk_cases", "support_tickets"];

  const checks: Check[] = [];
  checks.push(await timed("postgres", async () => {
    const result = await pool.query<{ missing: string[] }>(
      "select coalesce(array_agg(name) filter (where to_regclass('public.' || name) is null), '{}') missing from unnest($1::text[]) name",
      [requiredTables],
    );
    const missing = result.rows[0]?.missing ?? [];
    if (missing.length) throw new Error(`missing tables: ${missing.join(", ")}`);
    return `${requiredTables.length} required tables found`;
  }));
  checks.push(await timed("redis", async () => {
    await redis.set(redisKey, "ok", "EX", 30);
    if (await redis.get(redisKey) !== "ok") throw new Error("read-after-write failed");
    await redis.del(redisKey);
    return "ping and read/write succeeded";
  }));
  checks.push(await timed("minio", async () => {
    await storage.send(new HeadBucketCommand({ Bucket: env.STORAGE_BUCKET_PRIVATE }));
    await storage.send(new PutObjectCommand({ Bucket: env.STORAGE_BUCKET_PRIVATE, Key: probeKey, Body: "pulihkanaku-preflight", ContentType: "text/plain" }));
    await storage.send(new HeadObjectCommand({ Bucket: env.STORAGE_BUCKET_PRIVATE, Key: probeKey }));
    await storage.send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET_PRIVATE, Key: probeKey }));
    return "private bucket read/write/delete succeeded";
  }));
  checks.push(await timed("clamav-clean", async () => {
    const response = await clamScan(env.CLAMAV_HOST, env.CLAMAV_PORT, Buffer.from("pulihkanaku clean probe"));
    if (!response.includes("OK")) throw new Error(response);
    return response;
  }));
  checks.push(await timed("clamav-signature", async () => {
    const signature = ["X5O!P%@AP[4\\PZX54(P^)7CC)7}$", "EICAR-STANDARD-ANTIVIRUS-TEST-FILE!", "$H+H*"].join("");
    const response = await clamScan(env.CLAMAV_HOST, env.CLAMAV_PORT, Buffer.from(signature));
    if (!response.includes("FOUND")) throw new Error(`test signature was not detected: ${response}`);
    return "standard harmless antivirus test signature detected";
  }));
  checks.push(await timed("worker-heartbeat", async () => {
    const heartbeat = await redis.get("service:worker:heartbeat");
    if (!heartbeat || Date.now() - Date.parse(heartbeat) > 45_000) throw new Error("worker heartbeat is missing or stale");
    return heartbeat;
  }));

  await Promise.allSettled([pool.end(), redis.quit(), storage.destroy()]);
  console.table(checks);
  if (checks.some((check) => !check.ok)) process.exitCode = 1;
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
