import Link from "next/link";
import { OnboardingForm } from "@/app/_onboarding/onboarding-form";
import { requireAccount } from "@/lib/account";
export const dynamic="force-dynamic";
export default async function BusinessOnboarding(){await requireAccount("/business/onboarding",["BUSINESS_OWNER"]);return <main className="auth-shell onboarding-shell"><Link className="brand auth-brand" href="/business"><span className="brand-mark"><span/><span/></span><span>Pulihkan<span>Aku</span></span></Link><section className="auth-card onboarding-card"><p className="eyebrow">Onboarding bisnis</p><h1>Verifikasi bisnis sebelum memasang pekerjaan.</h1><p>Informasi penanggung jawab dan bukti usaha membantu melindungi pekerja dari lowongan palsu.</p><OnboardingForm role="BUSINESS_OWNER"/></section><Link className="back-link auth-back" href="/business">← Kembali ke dashboard</Link></main>}
