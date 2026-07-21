import { cookies } from "next/headers";
import { getD1 } from "@/db";
export { hashPassword,validatePassword,verifyPassword } from "./credentials";
export { safeReturnPath } from "./paths";

export const SESSION_COOKIE="pulihkanaku_session";
export const SESSION_MAX_AGE_SECONDS=60*60*24*30;

export async function createSession(request:Request,userId:string):Promise<{token:string;cookie:string;sessionId:string}>{
  const token=base64url(randomBytes(32));const tokenHash=await sha256(token);const now=Date.now();const sessionId=crypto.randomUUID();const userAgent=request.headers.get("user-agent")??"Unknown device";const deviceName=deviceLabel(userAgent);const ip=clientIp(request);const pepper=sessionPepper();
  await getD1().prepare("INSERT INTO user_sessions (id,user_id,token_hash,device_name,ip_hash,user_agent_hash,expires_at,last_seen_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(sessionId,userId,tokenHash,deviceName,await sha256(`${pepper}:${ip}`),await sha256(`${pepper}:${userAgent}`),now+SESSION_MAX_AGE_SECONDS*1000,now,now).run();
  return{token,sessionId,cookie:sessionCookie(token)};
}

export async function sessionUserFromRequest(request:Request):Promise<{id:string;email:string;role:string;status:string;sessionId:string}|null>{const token=parseCookie(request.headers.get("cookie")??"")[SESSION_COOKIE];return token?sessionUserFromToken(token):null}
export async function sessionUserFromCookies():Promise<{id:string;email:string;role:string;status:string;sessionId:string}|null>{const token=(await cookies()).get(SESSION_COOKIE)?.value;return token?sessionUserFromToken(token):null}

async function sessionUserFromToken(token:string){if(token.length<40||token.length>100)return null;const tokenHash=await sha256(token);const now=Date.now();const row=await getD1().prepare("SELECT u.id,u.email,u.role,u.status,s.id session_id,s.last_seen_at FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1").bind(tokenHash,now).first<{id:string;email:string;role:string;status:string;session_id:string;last_seen_at:number}>();if(!row||row.status!=="ACTIVE")return null;if(now-row.last_seen_at>300_000)await getD1().prepare("UPDATE user_sessions SET last_seen_at=? WHERE id=?").bind(now,row.session_id).run();return{id:row.id,email:row.email,role:row.role,status:row.status,sessionId:row.session_id}}

export async function revokeSessionToken(token:string|null):Promise<void>{if(!token)return;await getD1().prepare("UPDATE user_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL").bind(Date.now(),await sha256(token)).run()}
export async function revokeAllUserSessions(userId:string):Promise<void>{await getD1().prepare("UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL").bind(Date.now(),userId).run()}

export async function consumeAuthRateLimit(request:Request,identifier:string,action:string,limit=10,windowMs=15*60_000):Promise<boolean>{const now=Date.now();const pepper=sessionPepper();const keyHash=await sha256(`${pepper}:${clientIp(request)}:${identifier.trim().toLowerCase()}`);const d1=getD1();const row=await d1.prepare("SELECT id,window_started_at,attempts,blocked_until FROM auth_rate_limits WHERE key_hash=? AND action=? LIMIT 1").bind(keyHash,action).first<{id:string;window_started_at:number;attempts:number;blocked_until:number|null}>();if(row?.blocked_until&&row.blocked_until>now)return false;if(!row){await d1.prepare("INSERT INTO auth_rate_limits (id,key_hash,action,window_started_at,attempts,updated_at) VALUES (?,?,?,?,1,?)").bind(crypto.randomUUID(),keyHash,action,now,now).run();return true}if(now-row.window_started_at>windowMs){await d1.prepare("UPDATE auth_rate_limits SET window_started_at=?,attempts=1,blocked_until=NULL,updated_at=? WHERE id=?").bind(now,now,row.id).run();return true}const attempts=row.attempts+1;const blocked=attempts>limit?now+windowMs:null;await d1.prepare("UPDATE auth_rate_limits SET attempts=?,blocked_until=?,updated_at=? WHERE id=?").bind(attempts,blocked,now,row.id).run();return attempts<=limit}

export function assertSameOrigin(request:Request):boolean{if(["GET","HEAD","OPTIONS"].includes(request.method))return true;const origin=request.headers.get("origin");if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
export function clearSessionCookie():string{return`${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV==="production"?"; Secure":""}`}

function sessionCookie(token:string):string{return`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${process.env.NODE_ENV==="production"?"; Secure":""}`}
function sessionPepper():string{const value=process.env.SESSION_SECRET;if(value&&value.length>=32)return value;if(process.env.NODE_ENV!=="production")return"pulihkanaku-local-session-secret-only";throw new Error("SESSION_SECRET_MISSING")}
function clientIp(request:Request):string{return request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown"}
function deviceLabel(userAgent:string):string{const browser=/Edg/i.test(userAgent)?"Edge":/Chrome/i.test(userAgent)?"Chrome":/Firefox/i.test(userAgent)?"Firefox":/Safari/i.test(userAgent)?"Safari":"Browser";const os=/Android/i.test(userAgent)?"Android":/iPhone|iPad/i.test(userAgent)?"iOS":/Windows/i.test(userAgent)?"Windows":/Mac OS/i.test(userAgent)?"macOS":"Perangkat";return`${browser} · ${os}`}
function randomBytes(length:number){const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);return bytes}
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return base64url(new Uint8Array(digest))}
function base64url(bytes:Uint8Array){let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function parseCookie(header:string):Record<string,string>{const result:Record<string,string>={};for(const part of header.split(";")){const index=part.indexOf("=");if(index>0)result[part.slice(0,index).trim()]=part.slice(index+1).trim()}return result}
