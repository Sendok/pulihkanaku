import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, Injectable, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { createHash, createHmac, pbkdf2Sync, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { Pool, PoolClient } from "pg";
import type { Queue } from "bullmq";
import { POSTGRES, RateLimitService, WORK_QUEUE } from "../infrastructure.module.js";

type Purpose = "CONTACT_VERIFICATION" | "ACCOUNT_RECOVERY";
class TooManyRequestsException extends HttpException { constructor(message:string){super(message,HttpStatus.TOO_MANY_REQUESTS)} }
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const normalizeIdentifier = (value: string) => value.includes("@") ? value.trim().toLowerCase() : value.replace(/\D/g, "").replace(/^0/, "62");
const otpHash = (id: string, identifier: string, code: string) => createHmac("sha256", process.env.OTP_SECRET ?? process.env.SESSION_SECRET ?? "local-otp-secret-change-me").update(`${id}:${identifier}:${code}`).digest("hex");

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) @MaxLength(160) fullName!: string;
  @IsOptional() @Matches(/^(?:\+62|62|0)\d{8,13}$/) phone?: string;
  @IsIn(["WORKER", "BUSINESS_OWNER"]) role!: "WORKER" | "BUSINESS_OWNER";
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
}
export class LoginDto { @IsString() identifier!: string; @IsString() password!: string; }
export class RequestOtpDto {
  @IsString() identifier!: string;
  @IsIn(["EMAIL", "SMS", "WHATSAPP"]) channel!: "EMAIL" | "SMS" | "WHATSAPP";
  @IsIn(["CONTACT_VERIFICATION", "ACCOUNT_RECOVERY"]) purpose!: Purpose;
}
export class VerifyOtpDto extends RequestOtpDto { @Matches(/^\d{6}$/) code!: string; }
export class ResetPasswordDto { @IsString() recoveryToken!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; }

@Injectable()
export class AuthService {
  constructor(@Inject(POSTGRES) private readonly pool: Pool, @Inject(WORK_QUEUE) private readonly queue: Queue, private readonly limits: RateLimitService) {}

  private hashPassword(password: string, salt = randomBytes(32).toString("base64url"), iterations = 310_000) {
    return { salt, iterations, hash: pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url") };
  }
  private async issueSession(client: PoolClient, userId: string, request: Request) {
    const token = randomBytes(32).toString("base64url");
    await client.query(`insert into user_sessions(user_id,token_hash,device_name,ip_hash,user_agent_hash,expires_at,last_seen_at)
      values($1,$2,$3,$4,$5,now()+interval '30 days',now())`, [userId, sha256(token), (request.get("user-agent") ?? "Perangkat tidak dikenal").slice(0, 200), sha256(request.ip ?? "unknown"), sha256(request.get("user-agent") ?? "unknown")]);
    return token;
  }
  async register(body: RegisterDto, request: Request) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const password = this.hashPassword(body.password);
      const user = await client.query<{id:string}>(`insert into users(email,full_name,phone_e164,role,status) values($1,$2,$3,$4,'ACTIVE') returning id`, [body.email.toLowerCase(), body.fullName.trim(), body.phone ? `+${normalizeIdentifier(body.phone)}` : null, body.role]);
      await client.query(`insert into user_credentials(user_id,password_hash,password_salt,password_iterations,password_updated_at) values($1,$2,$3,$4,now())`, [user.rows[0].id, password.hash, password.salt, password.iterations]);
      if (body.role === "WORKER") await client.query(`insert into worker_profiles(user_id,full_name,city,district,bio,onboarding_status,verification_level,profile_completion,payout_status) values($1,$2,'','','','PROFILE_REQUIRED','BASIC',10,'NOT_CONFIGURED')`, [user.rows[0].id, body.fullName.trim()]);
      const token = await this.issueSession(client, user.rows[0].id, request);
      await client.query("commit");
      return { user: { id: user.rows[0].id, email: body.email.toLowerCase(), role: body.role }, token };
    } catch (error: unknown) {
      await client.query("rollback");
      if ((error as {code?:string}).code === "23505") throw new ConflictException("Email atau nomor telepon sudah digunakan.");
      throw error;
    } finally { client.release(); }
  }
  async login(body: LoginDto, request: Request) {
    const identifier = normalizeIdentifier(body.identifier);
    const rate = await this.limits.consume(`login:${sha256(identifier)}:${sha256(request.ip ?? "")}`, 10, 900);
    if (!rate.allowed) throw new TooManyRequestsException("Terlalu banyak percobaan masuk.");
    const result = await this.pool.query<{id:string;email:string;role:string;status:string;password_hash:string;password_salt:string;password_iterations:number;failed_attempts:number;locked_until:Date|null}>(`select u.id,u.email,u.role,u.status,c.password_hash,c.password_salt,c.password_iterations,c.failed_attempts,c.locked_until from users u join user_credentials c on c.user_id=u.id where lower(u.email)=$1 or u.phone_e164=$2 limit 1`, [identifier, `+${identifier}`]);
    const row = result.rows[0];
    if (!row || row.status !== "ACTIVE" || (row.locked_until && row.locked_until > new Date())) throw new UnauthorizedException("Email/telepon atau kata sandi tidak valid.");
    const actual = this.hashPassword(body.password, row.password_salt, row.password_iterations).hash;
    const valid = actual.length === row.password_hash.length && timingSafeEqual(Buffer.from(actual), Buffer.from(row.password_hash));
    if (!valid) {
      const failures = row.failed_attempts + 1;
      await this.pool.query(`update user_credentials set failed_attempts=$2,locked_until=case when $2>=5 then now()+interval '15 minutes' else null end,updated_at=now() where user_id=$1`, [row.id, failures]);
      throw new UnauthorizedException("Email/telepon atau kata sandi tidak valid.");
    }
    const client = await this.pool.connect();
    try { await client.query("begin"); await client.query(`update user_credentials set failed_attempts=0,locked_until=null,updated_at=now() where user_id=$1`, [row.id]); const token = await this.issueSession(client, row.id, request); await client.query("commit"); return { user: { id: row.id, email: row.email, role: row.role }, token }; } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }
  async requestOtp(body: RequestOtpDto, ip: string) {
    const identifier = normalizeIdentifier(body.identifier);
    const identifierHash = sha256(identifier);
    const rate = await this.limits.consume(`otp:${identifierHash}:${sha256(ip)}`, 5, 3600);
    if (!rate.allowed) throw new TooManyRequestsException("Batas pengiriman OTP tercapai. Coba lagi nanti.");
    const cooldown = await this.limits.consume(`otp-cooldown:${identifierHash}:${body.purpose}`, 1, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60));
    if (!cooldown.allowed) throw new TooManyRequestsException("Tunggu sebelum meminta OTP baru.");
    if (body.purpose === "ACCOUNT_RECOVERY") await this.pool.query(`select id from users where lower(email)=$1 or phone_e164=$2 limit 1`, [identifier, `+${identifier}`]);
    const id = randomUUID();
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.pool.query(`insert into otp_requests(id,identifier_hash,channel,purpose,code_hash,expires_at,last_sent_at) values($1,$2,$3,$4,$5,now()+($6*interval '1 second'),now())`, [id, identifierHash, body.channel, body.purpose, otpHash(id, identifier, code), Number(process.env.OTP_TTL_SECONDS ?? 300)]);
    await this.queue.add("notification.send-otp", { otpRequestId: id, identifier, channel: body.channel, code, purpose: body.purpose }, { jobId: `otp:${id}`, removeOnComplete: true });
    return { requestId: id, expiresInSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300), ...(process.env.NODE_ENV === "development" ? { developmentCode: code } : {}) };
  }
  async verifyOtp(body: VerifyOtpDto) {
    const identifier = normalizeIdentifier(body.identifier); const identifierHash = sha256(identifier);
    const result = await this.pool.query<{id:string;code_hash:string;attempts:number;expires_at:Date;consumed_at:Date|null}>(`select id,code_hash,attempts,expires_at,consumed_at from otp_requests where identifier_hash=$1 and purpose=$2 and channel=$3 order by created_at desc limit 1`, [identifierHash, body.purpose, body.channel]);
    const row = result.rows[0]; const max = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
    if (!row || row.consumed_at || row.expires_at <= new Date() || row.attempts >= max) throw new BadRequestException("OTP tidak valid atau kedaluwarsa.");
    const expected = otpHash(row.id, identifier, body.code); const valid = timingSafeEqual(Buffer.from(expected), Buffer.from(row.code_hash));
    if (!valid) { await this.pool.query(`update otp_requests set attempts=attempts+1 where id=$1`, [row.id]); throw new BadRequestException("OTP tidak valid atau kedaluwarsa."); }
    await this.pool.query(`update otp_requests set consumed_at=now() where id=$1 and consumed_at is null`, [row.id]);
    if (body.purpose === "CONTACT_VERIFICATION") {
      const field = identifier.includes("@") ? "email_verified_at" : "phone_verified_at";
      const where = identifier.includes("@") ? "lower(email)=$1" : "phone_e164=$1";
      await this.pool.query(`update users set ${field}=now(),updated_at=now() where ${where}`, [identifier.includes("@") ? identifier : `+${identifier}`]);
      return { verified: true, purpose: body.purpose };
    }
    const recoveryToken = randomBytes(32).toString("base64url");
    await this.limits.setOnce(`recovery:${sha256(recoveryToken)}`, identifier, 600);
    return { verified: true, purpose: body.purpose, recoveryToken, recoveryTokenExpiresInSeconds: 600 };
  }
  async resetPassword(body: ResetPasswordDto) {
    const key = `recovery:${sha256(body.recoveryToken)}`;
    const identifier = await this.limits.getDelete(key);
    if (!identifier) throw new BadRequestException("Token pemulihan tidak valid atau kedaluwarsa.");
    const password = this.hashPassword(body.password);
    const result = await this.pool.query(`update user_credentials c set password_hash=$1,password_salt=$2,password_iterations=$3,password_updated_at=now(),failed_attempts=0,locked_until=null,updated_at=now() from users u where c.user_id=u.id and (lower(u.email)=$4 or u.phone_e164=$5) returning c.user_id`, [password.hash,password.salt,password.iterations,identifier,`+${identifier}`]);
    if (!result.rowCount) throw new BadRequestException("Akun tidak ditemukan.");
    await this.pool.query(`update user_sessions set revoked_at=now() where user_id=$1 and revoked_at is null`, [result.rows[0].user_id]);
    return { reset: true, sessionsRevoked: true };
  }
  async sessionFrom(request: Request) {
    const bearer = request.get("authorization")?.replace(/^Bearer\s+/i, "");
    const cookie = request.headers.cookie?.split(";").map(v=>v.trim()).find(v=>v.startsWith("pulihkanaku_session="))?.split("=")[1];
    const token = bearer ?? cookie; if (!token) throw new UnauthorizedException("Sesi diperlukan.");
    const result = await this.pool.query<{session_id:string;user_id:string;email:string;role:string;device_name:string;created_at:Date;last_seen_at:Date}>(`select s.id session_id,u.id user_id,u.email,u.role,s.device_name,s.created_at,s.last_seen_at from user_sessions s join users u on u.id=s.user_id where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now() and u.status='ACTIVE'`, [sha256(token)]);
    if (!result.rows[0]) throw new UnauthorizedException("Sesi tidak valid."); return result.rows[0];
  }
  async sessions(userId: string) { return (await this.pool.query(`select id,device_name,created_at,last_seen_at,expires_at from user_sessions where user_id=$1 and revoked_at is null and expires_at>now() order by last_seen_at desc`, [userId])).rows; }
  async revokeSession(sessionId: string) { await this.pool.query(`update user_sessions set revoked_at=now() where id=$1`, [sessionId]); }
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private cookie(response: Response, token: string) { response.cookie("pulihkanaku_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30*24*60*60*1000 }); }
  @Post("register") async register(@Body() body:RegisterDto,@Req() req:Request,@Res({passthrough:true}) res:Response){const out=await this.auth.register(body,req);this.cookie(res,out.token);return{user:out.user};}
  @Post("login") @HttpCode(200) async login(@Body() body:LoginDto,@Req() req:Request,@Res({passthrough:true}) res:Response){const out=await this.auth.login(body,req);this.cookie(res,out.token);return{user:out.user};}
  @Post("request-otp") @HttpCode(202) requestOtp(@Body() body:RequestOtpDto,@Req() req:Request){return this.auth.requestOtp(body,req.ip??"unknown")}
  @Post("verify-otp") @HttpCode(200) verifyOtp(@Body() body:VerifyOtpDto){return this.auth.verifyOtp(body)}
  @Post("reset-password") @HttpCode(200) reset(@Body() body:ResetPasswordDto){return this.auth.resetPassword(body)}
  @Get("sessions") async sessions(@Req() req:Request){const session=await this.auth.sessionFrom(req);return{sessions:await this.auth.sessions(session.user_id),currentSessionId:session.session_id}}
  @Post("logout") @HttpCode(204) async logout(@Req() req:Request,@Res({passthrough:true}) res:Response){const session=await this.auth.sessionFrom(req);await this.auth.revokeSession(session.session_id);res.clearCookie("pulihkanaku_session",{path:"/"});}
}
