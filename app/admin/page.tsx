import{PulihkanAkuApp}from"@/app/pulihkan-aku-app";import{requireAccount}from"@/lib/account";
export const dynamic="force-dynamic";
export default async function AdminApp(){const account=await requireAccount("/admin",["SUPPORT_AGENT","VERIFICATION_AGENT","FINANCE_ADMIN","OPERATIONS_ADMIN","SUPER_ADMIN"]);return<PulihkanAkuApp initialRole="admin" displayName={account.fullName}/>}
