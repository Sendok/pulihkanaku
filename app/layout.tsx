import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pulihkanaku.com"),
  title: { default: "PulihkanAku — Pekerjaan nyata, bayaran jelas", template: "%s | PulihkanAku" },
  description: "Platform pekerjaan lokal terverifikasi untuk penghasilan tambahan yang aman.",
  icons: { icon: "/og.png", shortcut: "/og.png" },
  openGraph: { title: "PulihkanAku", description: "Pekerjaan nyata. Bayaran jelas.", type: "website", locale: "id_ID", images: [{ url: "/og.png", width: 1200, height: 630, alt: "PulihkanAku — Pekerjaan nyata. Bayaran jelas." }] },
  twitter: { card: "summary_large_image", title: "PulihkanAku", description: "Pekerjaan nyata. Bayaran jelas.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={jakarta.variable}>{children}</body></html>;
}
