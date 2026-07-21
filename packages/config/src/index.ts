import{z}from"zod";
export const serviceEnvironment=z.object({NODE_ENV:z.enum(["development","test","production"]).default("development"),DATABASE_URL:z.string().url(),REDIS_URL:z.string().url(),STORAGE_ENDPOINT:z.string().url(),STORAGE_BUCKET_PRIVATE:z.string().min(1)});
export type ServiceEnvironment=z.infer<typeof serviceEnvironment>;
