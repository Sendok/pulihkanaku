import{redirect}from"next/navigation";import{requireChatGPTUser}from"@/app/chatgpt-auth";import{findAccountByEmail,roleHome}from"@/lib/account";
export const dynamic="force-dynamic";
export default async function AuthContinue({searchParams}:{searchParams:Promise<{role?:string}>}){const params=await searchParams;const user=await requireChatGPTUser(`/auth/continue?role=${params.role??"worker"}`);const account=await findAccountByEmail(user.email);if(account)redirect(roleHome(account.role));redirect(`/daftar?role=${params.role==="business"?"business":"worker"}`)}
