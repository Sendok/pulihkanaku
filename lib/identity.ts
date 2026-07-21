import { getChatGPTUser } from "@/app/chatgpt-auth";
import type { Role } from "./domain/authorization";

export type Identity = { email: string; role: Role };

export async function requireApiIdentity(request: Request): Promise<Identity | null> {
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser?.email) return { email: chatGPTUser.email.toLowerCase(), role: "BUSINESS_OWNER" };
  if (process.env.NODE_ENV !== "production") {
    const email = request.headers.get("x-demo-user");
    const role = request.headers.get("x-demo-role") as Role | null;
    if (email && role) return { email: email.toLowerCase(), role };
  }
  return null;
}
