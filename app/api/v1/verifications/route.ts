import { getD1, getUploads } from "@/db";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertAuthorized } from "@/lib/domain/authorization";
import { safeDocumentName, validateVerificationFile } from "@/lib/domain/verification-document";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic="force-dynamic";

export async function GET(request:Request){
  const reqId=requestId(request);const identity=await requireApiIdentity(request);if(!identity)return fail("UNAUTHENTICATED","Silakan masuk untuk melihat verifikasi.",reqId,401);
  const d1=getD1();
  if(["VERIFICATION_AGENT","OPERATIONS_ADMIN","SUPER_ADMIN"].includes(identity.role)){
    const rows=await d1.prepare("SELECT v.id,v.subject_type,v.status,v.submitted_at,v.version,u.full_name,u.email,b.name business_name,(SELECT COUNT(*) FROM verification_documents d WHERE d.submission_id=v.id) document_count FROM verification_submissions v JOIN users u ON u.id=v.user_id LEFT JOIN businesses b ON b.id=v.business_id WHERE v.status IN ('SUBMITTED','UNDER_REVIEW') ORDER BY v.submitted_at ASC LIMIT 50").all();return ok({items:rows.results});
  }
  const rows=await d1.prepare("SELECT id,subject_type,status,submitted_at,reviewed_at,review_reason,expires_at,version FROM verification_submissions WHERE user_id=? ORDER BY submitted_at DESC LIMIT 10").bind(identity.id).all();return ok({items:rows.results});
}

export async function POST(request:Request){
  const reqId=requestId(request);const identity=await requireApiIdentity(request);if(!identity)return fail("UNAUTHENTICATED","Silakan masuk untuk mengajukan verifikasi.",reqId,401);
  try{assertAuthorized(identity.role,"verification:submit")}catch{return fail("FORBIDDEN","Akun ini tidak dapat mengajukan verifikasi.",reqId,403)}
  const form=await request.formData().catch(()=>null);if(!form)return fail("VALIDATION_ERROR","Form verifikasi tidak valid.",reqId,422);
  const identityDocument=form.get("identityDocument");const businessDocument=form.get("businessDocument");
  if(!(identityDocument instanceof File))return fail("IDENTITY_DOCUMENT_REQUIRED","Unggah dokumen identitas dalam format JPG, PNG, atau PDF.",reqId,422);
  if(identity.role==="BUSINESS_OWNER"&&!(businessDocument instanceof File))return fail("BUSINESS_DOCUMENT_REQUIRED","Unggah dokumen atau bukti tempat usaha.",reqId,422);
  const files=[{file:identityDocument,type:"IDENTITY"},...(businessDocument instanceof File?[{file:businessDocument,type:"BUSINESS"}]:[])];
  try{for(const item of files)await validateVerificationFile(item.file)}catch(cause){const code=cause instanceof Error?cause.message:"INVALID_FILE";return fail(code,"Dokumen harus berupa JPG, PNG, atau PDF yang valid dengan ukuran maksimal 5 MB.",reqId,422)}
  const d1=getD1();const profile=identity.role==="WORKER"?await d1.prepare("SELECT NULL id,onboarding_status FROM worker_profiles WHERE user_id=? LIMIT 1").bind(identity.id).first<{id:string|null;onboarding_status:string}>():await d1.prepare("SELECT id,onboarding_status FROM businesses WHERE owner_user_id=? ORDER BY created_at LIMIT 1").bind(identity.id).first<{id:string;onboarding_status:string}>();
  if(!profile||profile.onboarding_status!=="COMPLETE")return fail("ONBOARDING_REQUIRED","Selesaikan profil sebelum mengajukan verifikasi.",reqId,409);
  const active=await d1.prepare("SELECT id FROM verification_submissions WHERE user_id=? AND status IN ('SUBMITTED','UNDER_REVIEW') LIMIT 1").bind(identity.id).first();if(active)return fail("VERIFICATION_ALREADY_ACTIVE","Pengajuan verifikasi sedang diproses.",reqId,409);
  const submissionId=crypto.randomUUID();const now=Date.now();const prefix=`verification/${identity.id}/${submissionId}`;const uploads=getUploads();const stored:string[]=[];
  try{
    const documents=[];
    for(const item of files){const extension=item.file.type==="image/jpeg"?"jpg":item.file.type==="image/png"?"png":"pdf";const key=`${prefix}/${item.type.toLowerCase()}-${crypto.randomUUID()}.${extension}`;await uploads.put(key,await item.file.arrayBuffer(),{httpMetadata:{contentType:item.file.type},customMetadata:{owner:identity.id,submission:submissionId,type:item.type}});stored.push(key);documents.push({id:crypto.randomUUID(),type:item.type,key,fileName:safeDocumentName(item.file.name),mime:item.file.type,size:item.file.size})}
    const statements=[d1.prepare("INSERT INTO verification_submissions (id,user_id,subject_type,business_id,status,submitted_at,version,created_at,updated_at) VALUES (?,?,?,?, 'SUBMITTED',?,1,?,?)").bind(submissionId,identity.id,identity.role==="WORKER"?"WORKER":"BUSINESS",identity.role==="BUSINESS_OWNER"?profile.id:null,now,now,now),...documents.map(doc=>d1.prepare("INSERT INTO verification_documents (id,submission_id,user_id,type,object_key,file_name,mime_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(doc.id,submissionId,identity.id,doc.type,doc.key,doc.fileName,doc.mime,doc.size,now)),identity.role==="WORKER"?d1.prepare("UPDATE worker_profiles SET onboarding_status='VERIFICATION_SUBMITTED',profile_completion=90,updated_at=? WHERE user_id=?").bind(now,identity.id):d1.prepare("UPDATE businesses SET verification_status='SUBMITTED',updated_at=? WHERE owner_user_id=?").bind(now,identity.id),d1.prepare("INSERT INTO audit_logs (id,actor_email,actor_role,action,entity_type,entity_id,previous_state,next_state,request_id,created_at) VALUES (?,?,?,'VERIFICATION_SUBMITTED','VERIFICATION',?,NULL,'SUBMITTED',?,?)").bind(crypto.randomUUID(),identity.email,identity.role,submissionId,reqId,now)];
    await d1.batch(statements);return ok({id:submissionId,status:"SUBMITTED",documentCount:documents.length,next:identity.role==="WORKER"?"/app":"/business"},201);
  }catch{await Promise.all(stored.map(key=>uploads.delete(key).catch(()=>undefined)));return fail("VERIFICATION_SUBMIT_FAILED","Pengajuan belum dapat disimpan. Dokumen yang gagal tidak dipertahankan.",reqId,409)}
}
