import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { isRole, type Role } from "./domain/authorization";

export type Identity = { id: string; email: string; role: Role };

export async function requireApiIdentity(request: Request): Promise<Identity | null> {
  const chatGPTUser = await getChatGPTUser();
  const demoEmail = process.env.NODE_ENV !== "production" ? request.headers.get("x-demo-user") : null;
  const email = (chatGPTUser?.email ?? demoEmail)?.trim().toLowerCase();
  if (!email) return null;
  const [account] = await getDb().select({ id: users.id, email: users.email, role: users.role, status: users.status }).from(users).where(eq(users.email, email)).limit(1);
  if (!account || account.status !== "ACTIVE" || !isRole(account.role)) return null;
  return { id: account.id, email: account.email, role: account.role };
}
