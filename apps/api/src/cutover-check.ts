import { loadServiceEnvironment } from "@pulihkanaku/config";
import { createPostgresDatabase } from "@pulihkanaku/database";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

async function main() {
  const env = loadServiceEnvironment();
  const { pool } = createPostgresDatabase(env.DATABASE_URL, env.DATABASE_POOL_MAX);
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
  const queue = new Queue("pulihkanaku", { connection: redis });
  const database = await pool.query<{ metric: string; count: number }>(`
    select 'payouts_in_flight' metric, count(*)::int from payouts where status in ('SCHEDULED','PROCESSING','RETRY_QUEUED')
    union all select 'webhooks_pending', count(*)::int from provider_webhooks where status <> 'PROCESSED'
    union all select 'document_scans_pending', count(*)::int from verification_documents where scan_status in ('PENDING','SCANNING','ERROR')
    union all select 'evidence_scans_pending', count(*)::int from assignment_evidence where scan_status in ('PENDING','SCANNING','ERROR')
    union all select 'disputes_open', count(*)::int from disputes where status not in ('RESOLVED','CLOSED')
  `);
  const queueCounts = await queue.getJobCounts("active", "waiting", "delayed", "failed");
  const report = { checkedAt: new Date().toISOString(), database: Object.fromEntries(database.rows.map((row) => [row.metric, row.count])), queue: queueCounts };
  console.log(JSON.stringify(report, null, 2));
  const databaseBlockers = database.rows.filter((row) => row.count > 0);
  const queueBlockers = (queueCounts.active ?? 0) + (queueCounts.waiting ?? 0) + (queueCounts.delayed ?? 0);
  if (process.env.REQUIRE_QUIESCENT === "true" && (databaseBlockers.length || queueBlockers)) {
    console.error("Cutover blocked: drain in-flight workflows and resolve the listed records first.");
    process.exitCode = 1;
  }
  await queue.close();
  await redis.quit();
  await pool.end();
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
