import{PulihkanAkuApp}from"@/app/pulihkan-aku-app";import{requireAccount}from"@/lib/account";
export const dynamic="force-dynamic";
export default async function BusinessApp(){const account=await requireAccount("/business",["BUSINESS_OWNER","BUSINESS_STAFF","BUSINESS_HR"]);return<PulihkanAkuApp initialRole="business" displayName={account.businessName??account.fullName}/>}
