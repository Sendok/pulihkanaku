import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jobs, businesses, businessMembers } from "@/db/schema";
import { fail, ok, requestId } from "@/lib/api-response";
import { assertAuthorized } from "@/lib/domain/authorization";
import { requireApiIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reqId = requestId(request);
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get("city") ?? "Tulungagung";
    const rows = await getDb().select({
      id: jobs.id, slug: jobs.slug, title: jobs.title, category: jobs.category,
      business: businesses.name, city: jobs.city, district: jobs.district,
      startsAt: jobs.startsAt, endsAt: jobs.endsAt, payAmount: jobs.payAmount,
      workerCount: jobs.workerCount, status: jobs.status, fundingStatus: jobs.fundingStatus,
    }).from(jobs).innerJoin(businesses, eq(jobs.businessId, businesses.id))
      .where(eq(jobs.city, city)).orderBy(asc(jobs.startsAt)).limit(30);
    return ok({ items: rows, nextCursor: null });
  } catch {
    return fail("DATABASE_UNAVAILABLE", "Daftar pekerjaan belum dapat dimuat. Silakan coba kembali.", reqId, 503);
  }
}

export async function POST(request: Request) {
  const reqId = requestId(request);
  const identity = await requireApiIdentity(request);
  if (!identity) return fail("UNAUTHENTICATED", "Silakan masuk untuk membuat pekerjaan.", reqId, 401);
  try { assertAuthorized(identity.role, "job:create"); } catch { return fail("FORBIDDEN", "Akun ini tidak dapat membuat pekerjaan.", reqId, 403); }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.title !== "string" || body.title.trim().length < 5 || !Number.isSafeInteger(body.payAmount) || Number(body.payAmount) < 10_000) {
    return fail("VALIDATION_ERROR", "Periksa judul dan nominal pembayaran pekerjaan.", reqId, 422);
  }
  const now = new Date();
  const id = crypto.randomUUID();
  const businessId = typeof body.businessId === "string" ? body.businessId : "business_kirana";
  try {
    const [ownedBusiness] = await getDb().select({ id: businesses.id, verificationStatus: businesses.verificationStatus, membershipRole: businessMembers.role }).from(businesses).innerJoin(businessMembers,and(eq(businessMembers.businessId,businesses.id),eq(businessMembers.userId,identity.id),eq(businessMembers.status,"ACTIVE"))).where(and(eq(businesses.id, businessId))).limit(1);
    if (!ownedBusiness) return fail("BUSINESS_NOT_OWNED", "Bisnis tidak ditemukan atau bukan milik akun ini.", reqId, 403);
    if(!["BUSINESS_OWNER","BUSINESS_STAFF","BUSINESS_HR"].includes(ownedBusiness.membershipRole))return fail("BUSINESS_MEMBERSHIP_REQUIRED","Membership bisnis tidak memiliki izin membuat pekerjaan.",reqId,403);
    if (ownedBusiness.verificationStatus !== "VERIFIED") return fail("BUSINESS_VERIFICATION_REQUIRED", "Bisnis harus terverifikasi sebelum membuat pekerjaan.", reqId, 403);
    await getDb().insert(jobs).values({
      id, businessId, createdByEmail: identity.email, slug: `${String(body.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(0, 8)}`,
      title: String(body.title).trim(), category: typeof body.category === "string" ? body.category : "Lainnya",
      description: typeof body.description === "string" ? body.description : "Detail pekerjaan akan dilengkapi.",
      city: typeof body.city === "string" ? body.city : "Tulungagung", district: typeof body.district === "string" ? body.district : "Kedungwaru",
      startsAt: new Date(typeof body.startsAt === "string" ? body.startsAt : now.getTime() + 86_400_000),
      endsAt: new Date(typeof body.endsAt === "string" ? body.endsAt : now.getTime() + 115_200_000),
      payAmount: Number(body.payAmount), workerCount: Number.isSafeInteger(body.workerCount) ? Number(body.workerCount) : 1,
      status: "DRAFT", fundingStatus: "UNFUNDED", version: 1, createdAt: now, updatedAt: now,
    });
    return ok({ id, status: "DRAFT", version: 1 }, 201);
  } catch {
    return fail("JOB_CREATE_FAILED", "Pekerjaan belum dapat dibuat. Tidak ada pembayaran yang diproses.", reqId, 409);
  }
}
