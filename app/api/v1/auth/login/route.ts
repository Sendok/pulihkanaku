import { getD1 } from "@/db";
import { fail,requestId } from "@/lib/api-response";
import { roleReturnPath } from "@/lib/account";
import { isRole } from "@/lib/domain/authorization";
import { normalizeIndonesianPhone } from "@/lib/domain/phone";
import { assertSameOrigin,consumeAuthRateLimit,createSession,verifyPassword } from "@/lib/security/auth";

export const dynamic="force-dynamic";

export async function POST(request:Request){
  const reqId=requestId(request);if(!assertSameOrigin(request))return fail("INVALID_ORIGIN","Origin tidak valid.",reqId,403);const body=await request.json().catch(()=>null)as{identifier?:string;password?:string;returnTo?:string}|null;const identifier=body?.identifier?.trim().toLowerCase()??"";
  if(!identifier||!body?.password)return fail("VALIDATION_ERROR","Masukkan email/nomor telepon dan kata sandi.",reqId,422);
  if(!(await consumeAuthRateLimit(request,identifier,"login",10,15*60_000)))return fail("RATE_LIMITED","Terlalu banyak percobaan masuk. Coba kembali dalam 15 menit.",reqId,429);
  let phone:string|null=null;if(!identifier.includes("@")){try{phone=normalizeIndonesianPhone(identifier)}catch{return fail("INVALID_CREDENTIALS","Email, nomor telepon, atau kata sandi salah.",reqId,401)}}
  const d1=getD1();const row=await d1.prepare("SELECT u.id,u.email,u.role,u.status,c.password_hash,c.password_salt,c.password_iterations,c.failed_attempts,c.locked_until FROM users u JOIN user_credentials c ON c.user_id=u.id WHERE u.email=? OR u.phone_e164=? LIMIT 1").bind(identifier,phone).first<{id:string;email:string;role:string;status:string;password_hash:string;password_salt:string;password_iterations:number;failed_attempts:number;locked_until:number|null}>();const now=Date.now();
  if(!row)return fail("INVALID_CREDENTIALS","Email, nomor telepon, atau kata sandi salah.",reqId,401);
  if(row.status!=="ACTIVE")return fail("ACCOUNT_UNAVAILABLE","Akun tidak aktif. Hubungi dukungan PulihkanAku.",reqId,403);
  if(row.locked_until&&row.locked_until>now)return fail("ACCOUNT_TEMPORARILY_LOCKED","Akun dikunci sementara karena terlalu banyak percobaan.",reqId,423);
  const valid=await verifyPassword(body.password,row.password_hash,row.password_salt,row.password_iterations);
  if(!valid){const attempts=row.failed_attempts+1;const lockedUntil=attempts>=5?now+15*60_000:null;await d1.prepare("UPDATE user_credentials SET failed_attempts=?,locked_until=?,updated_at=? WHERE user_id=?").bind(attempts,lockedUntil,now,row.id).run();await d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,reason,created_at) VALUES (?,?,'SYSTEM','LOGIN_FAILED','USER',?,'ACTIVE','ACTIVE',?,'INVALID_PASSWORD',?)").bind(crypto.randomUUID(),row.email,row.id,reqId,now).run();return fail("INVALID_CREDENTIALS","Email, nomor telepon, atau kata sandi salah.",reqId,401)}
  if(!isRole(row.role))return fail("ACCOUNT_ROLE_INVALID","Role akun tidak valid.",reqId,403);
  await d1.prepare("UPDATE user_credentials SET failed_attempts=0,locked_until=NULL,updated_at=? WHERE user_id=?").bind(now,row.id).run();const session=await createSession(request,row.id);await d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,?,?,'LOGIN_SUCCEEDED','SESSION',?,NULL,'ACTIVE',?,?)").bind(crypto.randomUUID(),row.email,row.role,session.sessionId,reqId,now).run();const next=roleReturnPath(row.role,body.returnTo);
  return Response.json({success:true,data:{role:row.role,next}},{headers:{"set-cookie":session.cookie,"cache-control":"no-store"}});
}
