import { getD1 } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { normalizeIndonesianPhone } from "@/lib/domain/phone";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";

type WorkerBody = { birthYear?:number;bio?:string;skills?:string[];availability?:string[];preferredJobTypes?:string[];vehicles?:string[];maxDistanceKm?:number;emergencyContactName?:string;emergencyContactPhone?:string };
type BusinessBody = { representativeName?:string;district?:string;address?:string;nib?:string;jobRulesAccepted?:boolean };

export async function GET(request: Request) {
  const reqId=requestId(request);const identity=await requireApiIdentity(request);
  if(!identity)return fail("UNAUTHENTICATED","Silakan masuk untuk membuka onboarding.",reqId,401);
  const d1=getD1();
  if(identity.role==="WORKER"){
    const profile=await d1.prepare("SELECT full_name,city,district,birth_year,bio,skills,availability,preferred_job_types,vehicles,max_distance_km,emergency_contact_name,emergency_contact_phone,payout_status,onboarding_status,verification_level,profile_completion FROM worker_profiles WHERE user_id=? LIMIT 1").bind(identity.id).first();
    return ok({role:identity.role,profile});
  }
  if(identity.role==="BUSINESS_OWNER"){
    const profile=await d1.prepare("SELECT id,name,category,city,district,address,representative_name,nib,onboarding_status,verification_status FROM businesses WHERE owner_user_id=? ORDER BY created_at LIMIT 1").bind(identity.id).first();
    return ok({role:identity.role,profile});
  }
  return fail("FORBIDDEN","Onboarding ini hanya tersedia untuk worker dan pemilik bisnis.",reqId,403);
}

export async function PUT(request: Request) {
  const reqId=requestId(request);const identity=await requireApiIdentity(request);
  if(!identity)return fail("UNAUTHENTICATED","Silakan masuk untuk menyimpan onboarding.",reqId,401);
  const body=await request.json().catch(()=>null) as WorkerBody&BusinessBody|null;const now=Date.now();const d1=getD1();
  if(!body)return fail("VALIDATION_ERROR","Data onboarding tidak valid.",reqId,422);
  if(identity.role==="WORKER"){
    const year=new Date().getFullYear();const birthYear=Number(body.birthYear);const skills=cleanList(body.skills,10);const availability=cleanList(body.availability,14);const jobTypes=cleanList(body.preferredJobTypes,10);const vehicles=cleanList(body.vehicles,5);const distance=Number(body.maxDistanceKm);
    if(!Number.isInteger(birthYear)||birthYear<1940||birthYear>year-17||skills.length<1||availability.length<1||jobTypes.length<1||!Number.isInteger(distance)||distance<1||distance>100)return fail("VALIDATION_ERROR","Lengkapi tahun lahir, kemampuan, ketersediaan, minat kerja, dan jarak maksimal.",reqId,422);
    let emergencyPhone:string|null=null;if(body.emergencyContactPhone?.trim()){try{emergencyPhone=normalizeIndonesianPhone(body.emergencyContactPhone)}catch{return fail("PHONE_INVALID","Nomor kontak darurat tidak valid.",reqId,422)}}
    const current=await d1.prepare("SELECT onboarding_status FROM worker_profiles WHERE user_id=? LIMIT 1").bind(identity.id).first<{onboarding_status:string}>();if(!current)return fail("PROFILE_NOT_FOUND","Profil worker tidak ditemukan.",reqId,404);
    const [updated]=await d1.batch([
      d1.prepare("UPDATE worker_profiles SET birth_year=?,bio=?,skills=?,availability=?,preferred_job_types=?,vehicles=?,max_distance_km=?,emergency_contact_name=?,emergency_contact_phone=?,onboarding_status='COMPLETE',profile_completion=80,updated_at=? WHERE user_id=?").bind(birthYear,cleanText(body.bio,500),JSON.stringify(skills),JSON.stringify(availability),JSON.stringify(jobTypes),JSON.stringify(vehicles),distance,cleanOptional(body.emergencyContactName,100),emergencyPhone,now,identity.id),
      d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,?,?,'WORKER_ONBOARDING_COMPLETED','USER',?,?,'COMPLETE',?,?)").bind(crypto.randomUUID(),identity.email,identity.role,identity.id,current.onboarding_status,reqId,now),
    ]);
    if(!updated.success||(updated.meta.changes??0)!==1)return fail("PROFILE_NOT_FOUND","Profil worker tidak ditemukan.",reqId,404);
    return ok({onboardingStatus:"COMPLETE",profileCompletion:80,next:"/app/onboarding#verifikasi"});
  }
  if(identity.role==="BUSINESS_OWNER"){
    if(!body.representativeName?.trim()||body.representativeName.trim().length<3||!body.district?.trim()||!body.address?.trim()||body.address.trim().length<10||!body.jobRulesAccepted)return fail("VALIDATION_ERROR","Lengkapi penanggung jawab, kecamatan, alamat, dan persetujuan aturan lowongan.",reqId,422);
    const current=await d1.prepare("SELECT id,onboarding_status,verification_status FROM businesses WHERE owner_user_id=? ORDER BY created_at LIMIT 1").bind(identity.id).first<{id:string;onboarding_status:string;verification_status:string}>();if(!current)return fail("BUSINESS_NOT_FOUND","Bisnis tidak ditemukan.",reqId,404);if(!["DRAFT","NEEDS_REVISION","REJECTED"].includes(current.verification_status))return fail("BUSINESS_UPDATE_NOT_ALLOWED","Data bisnis tidak dapat diubah pada status saat ini.",reqId,409);
    const [updated]=await d1.batch([
      d1.prepare("UPDATE businesses SET representative_name=?,district=?,address=?,nib=?,onboarding_status='COMPLETE',updated_at=? WHERE id=?").bind(body.representativeName.trim().slice(0,100),body.district.trim().slice(0,100),body.address.trim().slice(0,500),cleanOptional(body.nib,50),now,current.id),
      d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,?,?,'BUSINESS_ONBOARDING_COMPLETED','BUSINESS',?,?,'COMPLETE',?,?)").bind(crypto.randomUUID(),identity.email,identity.role,current.id,current.onboarding_status,reqId,now),
    ]);
    if(!updated.success||(updated.meta.changes??0)!==1)return fail("BUSINESS_UPDATE_NOT_ALLOWED","Data bisnis tidak dapat diubah pada status saat ini.",reqId,409);
    return ok({onboardingStatus:"COMPLETE",next:"/business/onboarding#verifikasi"});
  }
  return fail("FORBIDDEN","Onboarding ini hanya tersedia untuk worker dan pemilik bisnis.",reqId,403);
}

function cleanList(value:unknown,limit:number):string[]{return Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==="string").map(item=>item.trim()).filter(Boolean))].slice(0,limit):[]}
function cleanText(value:unknown,limit:number):string{return typeof value==="string"?value.trim().slice(0,limit):""}
function cleanOptional(value:unknown,limit:number):string|null{const text=cleanText(value,limit);return text||null}
