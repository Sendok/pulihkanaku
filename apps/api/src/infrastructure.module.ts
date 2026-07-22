import { Global, Inject, Injectable, Module, OnApplicationShutdown } from "@nestjs/common";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { createPostgresDatabase } from "@pulihkanaku/database";
import type { Pool } from "pg";

export const POSTGRES = Symbol("POSTGRES");
export const REDIS = Symbol("REDIS");
export const WORK_QUEUE = Symbol("WORK_QUEUE");

@Injectable()
export class RateLimitService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}
  async consume(scope: string, limit: number, windowSeconds: number) {
    const key = `rate:${scope}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, windowSeconds);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  }
  async cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(`cache:${key}`);
    if (cached) return JSON.parse(cached) as T;
    const value = await loader();
    await this.redis.set(`cache:${key}`, JSON.stringify(value), "EX", ttlSeconds);
    return value;
  }
  setOnce(key: string, value: string, ttlSeconds: number) { return this.redis.set(key, value, "EX", ttlSeconds, "NX"); }
  getDelete(key: string) { return this.redis.getdel(key); }
}

@Injectable()
export class ObjectStorageService {
  private readonly client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT ?? "http://localhost:9000",
    region: process.env.STORAGE_REGION ?? "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "minio", secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "minio-development-only" },
  });
  readonly bucket = process.env.STORAGE_BUCKET_PRIVATE ?? "pulihkanaku-private";
  async presignPut(objectKey: string, mimeType: string) {
    return getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, ContentType: mimeType, ServerSideEncryption: "AES256" }), { expiresIn: 300 });
  }
  async head(objectKey: string) { return this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey })); }
}

@Injectable()
export class InfrastructureLifecycle implements OnApplicationShutdown {
  constructor(@Inject(POSTGRES) private readonly pool: Pool, @Inject(REDIS) private readonly redis: Redis, @Inject(WORK_QUEUE) private readonly queue: Queue) {}
  async onApplicationShutdown() { await this.queue.close(); await this.redis.quit(); await this.pool.end(); }
}

@Global()
@Module({
  providers: [
    { provide: POSTGRES, useFactory: () => createPostgresDatabase(process.env.DATABASE_URL ?? "postgres://pulihkanaku:pulihkanaku@localhost:5432/pulihkanaku").pool },
    { provide: REDIS, useFactory: () => new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null, enableReadyCheck: true }) },
    { provide: WORK_QUEUE, inject: [REDIS], useFactory: (connection: Redis) => new Queue("pulihkanaku", { connection, defaultJobOptions: { attempts: 6, backoff: { type: "exponential", delay: 30_000 }, removeOnComplete: 500, removeOnFail: 2000 } }) },
    RateLimitService, ObjectStorageService, InfrastructureLifecycle,
  ],
  exports: [POSTGRES, REDIS, WORK_QUEUE, RateLimitService, ObjectStorageService],
})
export class InfrastructureModule {}
