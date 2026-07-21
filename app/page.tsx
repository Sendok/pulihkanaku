import type { Metadata } from "next";
import { PulihkanAkuApp } from "./pulihkan-aku-app";

export const metadata: Metadata = {
  title: "PulihkanAku — Pekerjaan nyata, bayaran jelas",
  description:
    "Temukan pekerjaan harian, shift, paid trial, dan proyek lokal terverifikasi di Tulungagung, Kediri, dan Blitar.",
  alternates: { canonical: "https://pulihkanaku.com" },
};

export default function Home() {
  return <PulihkanAkuApp />;
}
