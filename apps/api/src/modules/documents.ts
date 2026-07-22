import { BadRequestException, Body, Controller, Inject, Injectable, Param, Post, Req } from "@nestjs/common";
import { IsIn, IsInt, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { randomUUID } from "node:crypto";
import type { Request } from "express";
import type { Pool } from "pg";
import type { Queue } from "bullmq";
import { AuthService } from "./auth.js";
import { ObjectStorageService, POSTGRES, WORK_QUEUE } from "../infrastructure.module.js";

const allowedMimes = ["application/pdf", "image/jpeg", "image/png"] as const;
export class PresignDocumentDto {
  @IsString() @MaxLength(180) fileName!: string;
  @IsIn(allowedMimes) mimeType!: typeof allowedMimes[number];
  @IsInt() @Min(1) @Max(10_000_000) sizeBytes!: number;
}
export class CompleteVerificationDocumentDto extends PresignDocumentDto {
  @IsUUID() submissionId!: string;
  @IsUUID() documentId!: string;
  @IsString() objectKey!: string;
  @IsIn(["KTP", "SELFIE", "NIB", "SUPPORTING"]) type!: string;
}
export class CompleteEvidenceDto extends PresignDocumentDto {
  @IsUUID() evidenceId!: string;
  @IsString() objectKey!: string;
  @IsIn(["PHOTO", "DOCUMENT"]) type!: string;
  @IsString() @MaxLength(1000) note!: string;
}

@Injectable()
export class DocumentService {
  constructor(@Inject(POSTGRES) private readonly pool:Pool,@Inject(WORK_QUEUE) private readonly queue:Queue,private readonly storage:ObjectStorageService,private readonly auth:AuthService){}
  async presign(request:Request,body:PresignDocumentDto,scope:"verification"|"evidence"){
    const session=await this.auth.sessionFrom(request);const id=randomUUID();const safeName=body.fileName.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100);const objectKey=`${scope}/${session.user_id}/${id}/${safeName}`;
    return{id,objectKey,uploadUrl:await this.storage.presignPut(objectKey,body.mimeType),expiresInSeconds:300,requiredHeaders:{"content-type":body.mimeType,"x-amz-server-side-encryption":"AES256"}};
  }
  private async verifyObject(objectKey:string,userId:string,mimeType:string,sizeBytes:number){if(!objectKey.includes(`/${userId}/`))throw new BadRequestException("Object key tidak sesuai pengguna.");const head=await this.storage.head(objectKey);if(Number(head.ContentLength)!==sizeBytes||head.ContentType!==mimeType)throw new BadRequestException("Metadata dokumen tidak sesuai upload.");}
  async completeVerification(request:Request,body:CompleteVerificationDocumentDto){const s=await this.auth.sessionFrom(request);await this.verifyObject(body.objectKey,s.user_id,body.mimeType,body.sizeBytes);const owns=await this.pool.query(`select id from verification_submissions where id=$1 and user_id=$2`,[body.submissionId,s.user_id]);if(!owns.rowCount)throw new BadRequestException("Submission verifikasi tidak ditemukan.");await this.pool.query(`insert into verification_documents(id,submission_id,user_id,type,object_key,file_name,mime_type,size_bytes,scan_status) values($1,$2,$3,$4,$5,$6,$7,$8,'PENDING')`,[body.documentId,body.submissionId,s.user_id,body.type,body.objectKey,body.fileName,body.mimeType,body.sizeBytes]);await this.queue.add("document.scan",{table:"verification_documents",documentId:body.documentId,objectKey:body.objectKey},{jobId:`scan:verification:${body.documentId}`});return{id:body.documentId,scanStatus:"PENDING"};}
  async completeEvidence(request:Request,assignmentId:string,body:CompleteEvidenceDto){const s=await this.auth.sessionFrom(request);await this.verifyObject(body.objectKey,s.user_id,body.mimeType,body.sizeBytes);const owns=await this.pool.query(`select id from job_assignments where id=$1 and worker_user_id=$2`,[assignmentId,s.user_id]);if(!owns.rowCount)throw new BadRequestException("Penugasan tidak ditemukan.");await this.pool.query(`insert into assignment_evidence(id,assignment_id,type,note,object_key,mime_type,scan_status,captured_at) values($1,$2,$3,$4,$5,$6,'PENDING',now())`,[body.evidenceId,assignmentId,body.type,body.note,body.objectKey,body.mimeType]);await this.queue.add("document.scan",{table:"assignment_evidence",documentId:body.evidenceId,objectKey:body.objectKey},{jobId:`scan:evidence:${body.evidenceId}`});return{id:body.evidenceId,scanStatus:"PENDING"};}
}

@Controller()
export class DocumentController{
  constructor(private readonly documents:DocumentService){}
  @Post("verification/documents/presign") presignVerification(@Req() req:Request,@Body() body:PresignDocumentDto){return this.documents.presign(req,body,"verification")}
  @Post("verification/documents/complete") completeVerification(@Req() req:Request,@Body() body:CompleteVerificationDocumentDto){return this.documents.completeVerification(req,body)}
  @Post("assignments/:id/evidence/presign") presignEvidence(@Req() req:Request,@Body() body:PresignDocumentDto){return this.documents.presign(req,body,"evidence")}
  @Post("assignments/:id/evidence/complete") completeEvidence(@Req() req:Request,@Param("id") id:string,@Body() body:CompleteEvidenceDto){return this.documents.completeEvidence(req,id,body)}
}
