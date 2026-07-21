import Link from "next/link";
import { OnboardingForm } from "@/app/_onboarding/onboarding-form";
import { requireAccount } from "@/lib/account";
export const dynamic="force-dynamic";
export default async function WorkerOnboarding(){await requireAccount("/app/onboarding",["WORKER"]);return <main className="auth-shell onboarding-shell"><Link className="brand auth-brand" href="/app"><span className="brand-mark"><span/><span/></span><span>Pulihkan<span>Aku</span></span></Link><section className="auth-card onboarding-card"><p className="eyebrow">Onboarding pekerja</p><h1>Lengkapi profil dan verifikasi identitas.</h1><p>Profil dapat diselesaikan bertahap. Verifikasi identitas diperlukan untuk membuka fitur pekerjaan yang sensitif.</p><OnboardingForm role="WORKER"/></section><Link className="back-link auth-back" href="/app">← Kembali ke dashboard</Link></main>}
