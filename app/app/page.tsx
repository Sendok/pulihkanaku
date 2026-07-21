import{PulihkanAkuApp}from"@/app/pulihkan-aku-app";import{requireAccount}from"@/lib/account";
export const dynamic="force-dynamic";
export default async function WorkerApp(){const account=await requireAccount("/app",["WORKER"]);return<PulihkanAkuApp initialRole="worker" displayName={account.fullName}/>}
