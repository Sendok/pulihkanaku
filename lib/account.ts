import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { businesses, users, workerProfiles } from "@/db/schema";
import { isRole, type Role } from "./domain/authorization";

export type Account = { id:string;email:string;fullName:string;role:Role;businessName:string|null;profileCompletion:number;verificationStatus:string };

export async function findAccountByEmail(email:string):Promise<Account|null>{
  const [row]=await getDb().select({id:users.id,email:users.email,fullName:users.fullName,role:users.role,status:users.status,businessName:businesses.name,profileCompletion:workerProfiles.profileCompletion,workerVerification:workerProfiles.verificationLevel,businessVerification:businesses.verificationStatus}).from(users).leftJoin(businesses,eq(businesses.ownerUserId,users.id)).leftJoin(workerProfiles,eq(workerProfiles.userId,users.id)).where(eq(users.email,email.trim().toLowerCase())).limit(1);
  if(!row||row.status!=="ACTIVE"||!isRole(row.role))return null;
  return{id:row.id,email:row.email,fullName:row.fullName||row.email,role:row.role,businessName:row.businessName??null,profileCompletion:row.profileCompletion??35,verificationStatus:row.workerVerification??row.businessVerification??"DRAFT"};
}

export function roleHome(role:Role):string{
  if(role==="WORKER")return"/app";
  if(["BUSINESS_OWNER","BUSINESS_STAFF","BUSINESS_HR"].includes(role))return"/business";
  if(["SUPPORT_AGENT","VERIFICATION_AGENT","FINANCE_ADMIN","OPERATIONS_ADMIN","SUPER_ADMIN"].includes(role))return"/admin";
  return"/";
}

export async function requireAccount(returnTo:string,allowed?:readonly Role[]):Promise<Account>{
  const identity=await requireChatGPTUser(returnTo);
  const account=await findAccountByEmail(identity.email);
  if(!account)redirect(`/daftar?return_to=${encodeURIComponent(returnTo)}`);
  if(allowed&&!allowed.includes(account.role))redirect(`/akses-ditolak?from=${encodeURIComponent(returnTo)}`);
  return account;
}
