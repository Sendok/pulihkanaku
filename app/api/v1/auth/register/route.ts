import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { fail,ok,requestId } from "@/lib/api-response";
import { normalizeIndonesianPhone } from "@/lib/domain/phone";

export const dynamic="force-dynamic";
type Registration={role?:"WORKER"|"BUSINESS_OWNER";fullName?:string;phone?:string;city?:string;district?:string;businessName?:string;businessCategory?:string;termsAccepted?:boolean;privacyAccepted?:boolean;marketingConsent?:boolean};

export async function POST(request:Request){
  const reqId=requestId(request);const platformUser=await getChatGPTUser();const demoEmail=process.env.NODE_ENV!=="production"?request.headers.get("x-demo-email"):null;const email=(platformUser?.email??demoEmail)?.trim().toLowerCase();
  if(!email)return fail("UNAUTHENTICATED","Verifikasi identitas diperlukan sebelum mendaftar.",reqId,401);
  const body=await request.json().catch(()=>null)as Registration|null;
  if(!body||!["WORKER","BUSINESS_OWNER"].includes(body.role??"")||!body.fullName?.trim()||body.fullName.trim().length<3||!body.city?.trim()||!body.district?.trim())return fail("VALIDATION_ERROR","Lengkapi role, nama, kota, dan kecamatan.",reqId,422);
  if(!body.termsAccepted||!body.privacyAccepted)return fail("CONSENT_REQUIRED","Persetujuan syarat dan kebijakan privasi diperlukan.",reqId,422);
  if(body.role==="BUSINESS_OWNER"&&(!body.businessName?.trim()||!body.businessCategory?.trim()))return fail("VALIDATION_ERROR","Lengkapi nama dan kategori bisnis.",reqId,422);
  let phone:string;try{phone=normalizeIndonesianPhone(body.phone??"")}catch{return fail("PHONE_INVALID","Gunakan nomor Indonesia yang aktif, misalnya 081234567890.",reqId,422)}
  const d1=getD1();const existing=await d1.prepare("SELECT id,role FROM users WHERE email=? OR phone_e164=? LIMIT 1").bind(email,phone).first<{id:string;role:string}>();if(existing)return fail("ACCOUNT_ALREADY_EXISTS","Akun dengan email atau nomor ini sudah terdaftar.",reqId,409,{role:existing.role});
  const userId=crypto.randomUUID();const now=Date.now();const statements=[
    d1.prepare("INSERT INTO users (id,email,full_name,phone_e164,role,status,created_at,updated_at) VALUES (?,?,?,?,?,'ACTIVE',?,?)").bind(userId,email,body.fullName.trim(),phone,body.role,now,now),
    d1.prepare("INSERT INTO user_consents (id,user_id,type,version,granted,granted_at,created_at) VALUES (?,?, 'TERMS','2026-07-22',1,?,?)").bind(crypto.randomUUID(),userId,now,now),
    d1.prepare("INSERT INTO user_consents (id,user_id,type,version,granted,granted_at,created_at) VALUES (?,?, 'PRIVACY','2026-07-22',1,?,?)").bind(crypto.randomUUID(),userId,now,now),
    d1.prepare("INSERT INTO user_consents (id,user_id,type,version,granted,granted_at,created_at) VALUES (?,?, 'MARKETING','2026-07-22',?,?,?)").bind(crypto.randomUUID(),userId,body.marketingConsent?1:0,now,now),
    d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,?,?,'USER_REGISTERED','USER',?,NULL,'ACTIVE',?,?)").bind(crypto.randomUUID(),email,body.role,userId,reqId,now),
  ];
  if(body.role==="WORKER")statements.push(d1.prepare("INSERT INTO worker_profiles (id,user_id,full_name,city,district,onboarding_status,verification_level,profile_completion,created_at,updated_at) VALUES (?,?,?, ?,?,'BASIC_COMPLETE','BASIC',35,?,?)").bind(crypto.randomUUID(),userId,body.fullName.trim(),body.city.trim(),body.district.trim(),now,now));
  else statements.push(d1.prepare("INSERT INTO businesses (id,owner_user_id,name,category,city,verification_status,trust_score,created_at,updated_at) VALUES (?,?,?,?,?,'DRAFT',0,?,?)").bind(crypto.randomUUID(),userId,body.businessName?.trim(),body.businessCategory?.trim(),body.city.trim(),now,now));
  try{await d1.batch(statements);return ok({id:userId,email,role:body.role,next:body.role==="WORKER"?"/app":"/business"},201)}catch{return fail("REGISTRATION_FAILED","Pendaftaran belum dapat diselesaikan. Silakan coba kembali.",reqId,409)}
}
