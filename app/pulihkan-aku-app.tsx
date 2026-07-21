"use client";

import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Heart,
  House,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Role = "worker" | "business" | "admin";
type Job = {
  id: string;
  title: string;
  business: string;
  location: string;
  distance: string;
  schedule: string;
  pay: number;
  unit: string;
  category: string;
  tags: string[];
  applicants: number;
  match: number;
  accent: string;
};

const jobs: Job[] = [
  {
    id: "job_tlg_001",
    title: "Admin Marketplace",
    business: "Kirana Home Living",
    location: "Kedungwaru, Tulungagung",
    distance: "2,4 km",
    schedule: "Besok · 09.00–17.00",
    pay: 175000,
    unit: "per shift",
    category: "Administrasi",
    tags: ["Dibayar setelah selesai", "Makan siang"],
    applicants: 8,
    match: 94,
    accent: "coral",
  },
  {
    id: "job_tlg_002",
    title: "Penjaga Booth Festival",
    business: "Ruang Rasa Event",
    location: "Kauman, Tulungagung",
    distance: "4,1 km",
    schedule: "Sabtu · 14.00–22.00",
    pay: 200000,
    unit: "per acara",
    category: "Event",
    tags: ["Pekerjaan cepat", "2 orang"],
    applicants: 12,
    match: 89,
    accent: "peach",
  },
  {
    id: "job_tlg_003",
    title: "Foto Produk UMKM",
    business: "Dapur Mbok Sri",
    location: "Boyolangu, Tulungagung",
    distance: "5,8 km",
    schedule: "Jumat · Fleksibel 4 jam",
    pay: 250000,
    unit: "per proyek",
    category: "Kreatif",
    tags: ["Paid trial", "Portofolio opsional"],
    applicants: 5,
    match: 84,
    accent: "gold",
  },
];

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function Logo() {
  return (
    <a className="brand" href="#atas" aria-label="PulihkanAku, kembali ke atas">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span>Pulihkan<span>Aku</span></span>
    </a>
  );
}

function Verified({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "verified compact" : "verified"}>
      <BadgeCheck size={14} aria-hidden="true" /> Terverifikasi
    </span>
  );
}

function JobCard({ job, onOpen, onSave, saved }: { job: Job; onOpen: () => void; onSave: () => void; saved: boolean }) {
  return (
    <article className="job-card">
      <div className="job-topline">
        <span className={`job-icon ${job.accent}`} aria-hidden="true">
          {job.category.slice(0, 1)}
        </span>
        <button className={`icon-button ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? `Hapus ${job.title} dari simpanan` : `Simpan ${job.title}`}>
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="eyebrow coral-text">{job.match}% cocok untukmu</p>
      <h3>{job.title}</h3>
      <div className="business-name">
        <span>{job.business}</span><Verified compact />
      </div>
      <div className="job-meta">
        <span><MapPin size={15} /> {job.location} · {job.distance}</span>
        <span><CalendarDays size={15} /> {job.schedule}</span>
      </div>
      <div className="tag-row">
        {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="job-footer">
        <div>
          <strong>{money.format(job.pay)}</strong>
          <small>{job.unit}</small>
        </div>
        <button className="text-button" onClick={onOpen}>Lihat detail <ArrowRight size={16} /></button>
      </div>
    </article>
  );
}

function JobDetail({ job, applied, onClose, onApply }: { job: Job; applied: boolean; onClose: () => void; onApply: () => void }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="job-detail" role="dialog" aria-modal="true" aria-labelledby="job-detail-title">
        <button className="modal-close" onClick={onClose} aria-label="Tutup detail pekerjaan"><X /></button>
        <div className="detail-badge"><ShieldCheck size={18} /> Dana pekerjaan sudah tersedia</div>
        <p className="eyebrow">{job.category} · {job.match}% cocok</p>
        <h2 id="job-detail-title">{job.title}</h2>
        <div className="business-name large"><span>{job.business}</span><Verified /></div>
        <div className="detail-pay">
          <Banknote />
          <div><span>Bayaran yang kamu terima</span><strong>{money.format(job.pay)}</strong><small>Tanpa biaya untuk melamar</small></div>
        </div>
        <div className="detail-grid">
          <div><CalendarDays /><span><small>Jadwal</small>{job.schedule}</span></div>
          <div><MapPin /><span><small>Lokasi</small>{job.location}</span></div>
          <div><Clock3 /><span><small>Durasi</small>8 jam, termasuk istirahat</span></div>
          <div><Users /><span><small>Pelamar</small>{job.applicants} pelamar · 2 dibutuhkan</span></div>
        </div>
        <div className="detail-copy">
          <h3>Yang akan kamu kerjakan</h3>
          <ul>
            <li><Check /> Membantu operasional harian sesuai briefing.</li>
            <li><Check /> Mencatat hasil kerja melalui aplikasi.</li>
            <li><Check /> Berkoordinasi dengan penanggung jawab di lokasi.</li>
          </ul>
        </div>
        <div className="safety-inline"><ShieldCheck /> Pencari kerja tidak pernah diminta membayar biaya pendaftaran, deposit, atau memberikan kode OTP.</div>
        <button className="primary-button full" onClick={onApply} disabled={applied}>
          {applied ? <><Check size={19} /> Lamaran terkirim</> : <>Lamar tanpa biaya <ArrowRight size={18} /></>}
        </button>
      </section>
    </div>
  );
}

function WorkerDashboard({ onBack, displayName = "Pengguna", profileCompletion = 35, verificationStatus = "BASIC" }: { onBack: () => void; displayName?: string; profileCompletion?: number; verificationStatus?: string }) {
  const [selected, setSelected] = useState<Job | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const visibleJobs = useMemo(() => jobs.filter((job) => `${job.title} ${job.business} ${job.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="product-shell">
      <header className="product-header">
        <Logo />
        <div className="header-actions"><button className="icon-button" aria-label="Notifikasi"><Bell size={20} /></button><a className="profile-chip" href="/akun/keamanan"><span>{displayName.slice(0,2).toUpperCase()}</span><span><small>Akun pekerja</small>{displayName}</span><ChevronDown size={16} /></a></div>
      </header>
      <main className="dashboard-main">
        <section className="welcome-row">
          <div><button className="back-link" onClick={onBack}>← Kembali ke halaman utama</button><p className="eyebrow">Ruang pekerja</p><h1>Selamat datang, {displayName}.</h1><p>Mari cari peluang yang paling sesuai hari ini.</p></div>
          <a className="profile-progress" href={verificationStatus==="IDENTITY_VERIFIED"?"/app/payout":"/app/onboarding"}><div className="progress-ring">{profileCompletion}<span>%</span></div><div><strong>{verificationStatus==="IDENTITY_VERIFIED"?"Tambahkan rekening payout":"Lengkapi profil dan verifikasi"}</strong><span>{verificationStatus==="IDENTITY_VERIFIED"?"Rekening dienkripsi dan diverifikasi":"Buka akses fitur pekerjaan sensitif"}</span></div><ArrowRight /></a>
        </section>
        <section className="stats-grid">
          <article className="income-stat"><div><span className="stat-icon"><WalletCards /></span><span>Pendapatan bulan ini</span></div><strong>{money.format(975000)}</strong><small><TrendingUp size={14} /> Naik Rp325.000 dari Juni</small></article>
          <article><div><span className="stat-icon soft"><BriefcaseBusiness /></span><span>Pekerjaan aktif</span></div><strong>1</strong><small>Stock opname · besok</small></article>
          <article><div><span className="stat-icon green"><Star /></span><span>Skor keandalan</span></div><strong>92<span>/100</span></strong><small>Sangat baik · 8 pekerjaan selesai</small></article>
        </section>
        <section className="dashboard-section">
          <div className="section-title"><div><p className="eyebrow">Rekomendasi untukmu</p><h2>Pekerjaan yang paling cocok</h2></div><a href="#semua">Lihat semua <ArrowRight size={16} /></a></div>
          <div className="job-toolbar"><label><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pekerjaan atau bisnis" aria-label="Cari pekerjaan" /></label><button className="outline-button"><SlidersHorizontal size={17} /> Filter</button></div>
          <div className="jobs-grid" id="semua">
            {visibleJobs.length ? visibleJobs.map((job) => <JobCard key={job.id} job={job} saved={saved.includes(job.id)} onSave={() => setSaved((current) => current.includes(job.id) ? current.filter((id) => id !== job.id) : [...current, job.id])} onOpen={() => setSelected(job)} />) : <div className="empty-state"><Search /><h3>Belum menemukan yang pas</h3><p>Coba kata lain atau atur ulang filter pencarian.</p></div>}
          </div>
        </section>
      </main>
      <nav className="bottom-nav" aria-label="Navigasi pekerja">
        <a className="active" href="#atas"><House />Beranda</a><a href="#semua"><Search />Cari kerja</a><a href="#aktivitas"><BriefcaseBusiness />Aktivitas</a><a href="#pesan"><MessageCircle />Pesan</a><a href="#profil"><CircleUserRound />Profil</a>
      </nav>
      {selected && <JobDetail job={selected} applied={applied.includes(selected.id)} onClose={() => setSelected(null)} onApply={() => setApplied((current) => [...current, selected.id])} />}
    </div>
  );
}

function BusinessDashboard({ onBack, displayName = "Bisnis Anda", verificationStatus = "DRAFT" }: { onBack: () => void; displayName?: string; verificationStatus?: string }) {
  const [published, setPublished] = useState(false);
  return (
    <div className="product-shell business-shell">
      <header className="product-header"><Logo /><div className="header-actions"><button className="icon-button" aria-label="Notifikasi"><Bell size={20} /></button><a className="profile-chip" href="/akun/keamanan"><span>{displayName.slice(0,2).toUpperCase()}</span><span><small>Akun bisnis</small>{displayName}</span><ChevronDown size={16} /></a></div></header>
      <main className="dashboard-main">
        <section className="welcome-row"><div><button className="back-link" onClick={onBack}>← Kembali ke halaman utama</button><p className="eyebrow">Dashboard bisnis</p><h1>Selamat datang, {displayName}.</h1><p>Semua kebutuhan tenaga hari ini dalam kendali.</p></div><button className="primary-button" onClick={() => setPublished(true)}><BriefcaseBusiness size={18} /> Buat pekerjaan</button></section>
        {verificationStatus!=="VERIFIED"&&<a className="verification-banner" href="/business/onboarding"><ShieldCheck/><span><strong>Verifikasi bisnis diperlukan</strong>Lengkapi data agar pekerjaan dapat ditinjau dan dipublikasikan.</span><ArrowRight/></a>}
        {published && <div className="success-banner"><Check /> Draft pekerjaan baru sudah dibuat. Lengkapi detail dan pendanaan sebelum dipublikasikan.<button onClick={() => setPublished(false)} aria-label="Tutup"><X /></button></div>}
        <section className="stats-grid business-stats"><article><div><span className="stat-icon"><BriefcaseBusiness /></span><span>Pekerjaan aktif</span></div><strong>4</strong><small>2 shift dimulai hari ini</small></article><article><div><span className="stat-icon soft"><Users /></span><span>Kandidat baru</span></div><strong>18</strong><small>7 kandidat sangat sesuai</small></article><article><div><span className="stat-icon green"><Banknote /></span><span>Dana pekerjaan</span></div><strong>{money.format(2400000)}</strong><small>Semua pekerjaan terdanai</small></article></section>
        <div className="business-grid">
          <section className="panel"><div className="section-title"><div><p className="eyebrow">Hari ini</p><h2>Shift yang berjalan</h2></div><button className="text-button">Kelola shift <ArrowRight /></button></div>
            {[{time:"08.00",title:"Stock opname gudang",people:"6/6 hadir",status:"Berjalan"},{time:"14.00",title:"Operator live commerce",people:"2/3 terisi",status:"Butuh 1 pekerja"},{time:"16.00",title:"Packing pesanan",people:"4/4 terisi",status:"Siap"}].map((item) => <div className="shift-row" key={item.title}><span className="shift-time">{item.time}</span><span><strong>{item.title}</strong><small>{item.people}</small></span><span className={item.status.includes("Butuh") ? "status warning" : "status success"}>{item.status}</span><button className="icon-button"><ArrowRight /></button></div>)}
          </section>
          <aside className="panel candidate-panel"><div className="section-title"><div><p className="eyebrow">Kandidat terbaru</p><h2>Siap ditinjau</h2></div></div>{["Arini Rahma","Bagus Pratama","Dewi Lestari"].map((name, index) => <div className="candidate" key={name}><span className={`avatar avatar-${index}`}>{name.split(" ").map(x => x[0]).join("")}</span><span><strong>{name}</strong><small><Star size={12} fill="currentColor" /> {94-index*3}% cocok</small></span><button className="outline-button small">Tinjau</button></div>)}<button className="text-button full-link">Lihat 18 kandidat <ArrowRight /></button></aside>
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Navigasi bisnis"><a className="active"><LayoutDashboard />Beranda</a><a><BriefcaseBusiness />Pekerjaan</a><a><Users />Kandidat</a><a><MessageCircle />Pesan</a><a><Building2 />Bisnis</a></nav>
    </div>
  );
}

function AdminDashboard({ onBack }: { onBack: () => void }) {
  return <div className="admin-shell"><aside className="admin-sidebar"><Logo /><nav><a className="active"><LayoutDashboard />Overview</a><a><Users />Workers</a><a><Building2 />Businesses</a><a><BriefcaseBusiness />Jobs</a><a href="/admin/verifications"><ShieldCheck />Verifications</a><a><WalletCards />Payments</a><a><MessageCircle />Disputes <span>3</span></a></nav><button className="back-link light" onClick={onBack}>← Halaman utama</button></aside><main className="admin-main"><header><div><p className="eyebrow">Operations center</p><h1>Ringkasan platform</h1></div><div className="header-actions"><button className="icon-button"><Bell /></button><span className="admin-avatar">SA</span></div></header><section className="admin-stats"><article><span>Worker aktif</span><strong>1.248</strong><small>+8,2% bulan ini</small></article><article><span>Bisnis terverifikasi</span><strong>186</strong><small>12 menunggu review</small></article><article><span>GMV bulan ini</span><strong>Rp184,6 jt</strong><small>+12,4% bulan ini</small></article><article><span>Sengketa terbuka</span><strong>3</strong><small>Semua dalam SLA</small></article></section><section className="admin-content"><div className="panel"><div className="section-title"><div><p className="eyebrow">Perlu perhatian</p><h2>Antrean verifikasi bisnis</h2></div><a className="outline-button small" href="/admin/verifications">Lihat semua</a></div><div className="admin-table"><div className="table-head"><span>Bisnis</span><span>Kota</span><span>Diajukan</span><span>Risiko</span><span /></div>{[["Sumber Rejeki Mart","Kediri","2 jam lalu","Rendah"],["CV Berkah Logistik","Blitar","4 jam lalu","Sedang"],["Kopi Lereng Wilis","Tulungagung","Kemarin","Rendah"]].map(row => <div className="table-row" key={row[0]}>{row.map((cell,index)=><span key={cell} className={index===3 ? `risk ${cell === "Sedang" ? "medium" : "low"}` : ""}>{cell}</span>)}<a className="text-button" href="/admin/verifications">Tinjau <ArrowRight /></a></div>)}</div></div><aside className="panel"><p className="eyebrow">Kesehatan sistem</p><h2>Semua layanan normal</h2><div className="health-list">{["API","Database","Queue & Redis","Object storage","Payment webhook"].map(x=><span key={x}><i />{x}<small>Normal</small></span>)}</div></aside></section></main></div>;
}

function Landing({ onEnter }: { onEnter: (role: Role) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [city, setCity] = useState("Tulungagung");
  const [query, setQuery] = useState("");
  const filtered = jobs.filter(job => job.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div id="atas">
      <header className="landing-header"><Logo /><nav className={menuOpen ? "open" : ""} aria-label="Navigasi utama"><a href="#cara-kerja" onClick={() => setMenuOpen(false)}>Cara kerja</a><a href="#pekerjaan" onClick={() => setMenuOpen(false)}>Cari pekerjaan</a><a href="#bisnis" onClick={() => setMenuOpen(false)}>Untuk bisnis</a><a href="#keamanan" onClick={() => setMenuOpen(false)}>Keamanan</a></nav><div className="desktop-actions"><button className="login-button" onClick={() => onEnter("worker")}>Masuk</button><button className="primary-button" onClick={() => onEnter("business")}>Pasang pekerjaan</button></div><button className="mobile-menu" aria-label="Buka menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></header>
      <main>
        <section className="hero-section">
          <div className="hero-glow one" /><div className="hero-glow two" />
          <div className="hero-copy"><div className="trust-pill"><ShieldCheck size={16} /> Aman, jelas, dan tanpa biaya melamar</div><h1>Dapatkan penghasilan dari pekerjaan yang <span>nyata.</span></h1><p>Temukan pekerjaan harian, shift, paid trial, dan proyek lokal sesuai kemampuan serta waktu yang kamu miliki.</p><div className="hero-actions"><button className="primary-button large" onClick={() => onEnter("worker")}>Cari pekerjaan <ArrowRight /></button><button className="secondary-button large" onClick={() => onEnter("business")}><Building2 /> Butuh tenaga kerja</button></div><div className="community-proof"><div className="avatar-stack"><span>AR</span><span>BP</span><span>DL</span><span>+</span></div><p><strong>1.200+ orang</strong> sudah bergabung di Jawa Timur</p></div></div>
          <div className="hero-visual" aria-label="Contoh peluang pekerjaan terverifikasi"><div className="floating-note note-safe"><ShieldCheck /> <span><strong>Bisnis terverifikasi</strong><small>Identitas sudah diperiksa</small></span></div><div className="opportunity-card"><div className="opportunity-top"><span className="job-icon coral">A</span><Verified /></div><p className="eyebrow">Peluang di dekatmu</p><h2>Admin Toko</h2><p className="business-line">Kirana Home Living</p><div className="mini-info"><span><MapPin /> Kedungwaru · 2,4 km</span><span><CalendarDays /> Besok, 09.00–17.00</span></div><div className="opportunity-pay"><span>Bayaran diterima</span><strong>Rp175.000</strong><small>per shift</small></div><button className="primary-button full" onClick={() => onEnter("worker")}>Lihat pekerjaan <ArrowRight /></button></div><div className="floating-note note-pay"><Banknote /> <span><strong>Bayaran jelas</strong><small>Terlihat sebelum melamar</small></span></div></div>
        </section>
        <section className="safety-bar" id="keamanan"><ShieldCheck /><p><strong>Ingat, melamar selalu gratis.</strong> Jangan pernah membayar deposit atau membagikan kode OTP kepada siapa pun.</p><a href="#cara-kerja">Pelajari keamanan <ArrowRight /></a></section>
        <section className="jobs-section" id="pekerjaan"><div className="section-heading"><div><p className="eyebrow">Peluang terbaru</p><h2>Pekerjaan nyata di dekatmu</h2><p>Nominal bayaran dan jadwal selalu terlihat sebelum kamu melamar.</p></div><button className="text-button" onClick={() => onEnter("worker")}>Lihat semua pekerjaan <ArrowRight /></button></div><div className="public-search"><label className="search-wide"><Search /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari pekerjaan, mis. admin toko" aria-label="Cari pekerjaan" /></label><label className="city-select"><MapPin /><select value={city} onChange={(e)=>setCity(e.target.value)} aria-label="Pilih kota"><option>Tulungagung</option><option>Kediri</option><option>Blitar</option></select><ChevronDown /></label><button className="primary-button" onClick={() => onEnter("worker")}>Cari</button></div><div className="jobs-grid public-jobs">{filtered.map(job=><JobCard job={job} key={job.id} saved={false} onSave={()=>onEnter("worker")} onOpen={()=>onEnter("worker")} />)}</div></section>
        <section className="how-section" id="cara-kerja"><div className="section-heading centered"><div><p className="eyebrow">Cara kerja</p><h2>Tiga langkah menuju peluang baru</h2><p>Tak perlu CV panjang. Ceritakan kemampuanmu, lalu pilih pekerjaan yang paling pas.</p></div></div><div className="steps-grid">{[{icon:<Sparkles/>,n:"01",title:"Lengkapi profil praktis",copy:"Pilih kemampuan, jadwal, dan area kerja yang kamu inginkan."},{icon:<Search/>,n:"02",title:"Temukan pekerjaan",copy:"Lihat bayaran, jadwal, lokasi, dan detail tugas sebelum melamar."},{icon:<Banknote/>,n:"03",title:"Kerjakan & terima bayaran",copy:"Check-in, kirim hasil, lalu pantau payout secara transparan."}].map(item=><article key={item.n}><span className="step-icon">{item.icon}</span><small>{item.n}</small><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div></section>
        <section className="business-cta" id="bisnis"><div><p className="eyebrow light-text">Untuk bisnis lokal</p><h2>Tenaga yang tepat, saat kamu membutuhkannya.</h2><p>Temukan pekerja terverifikasi untuk shift, event, proyek singkat, dan kebutuhan operasional harian.</p><button className="cream-button" onClick={() => onEnter("business")}>Mulai pasang pekerjaan <ArrowRight /></button></div><div className="business-metrics"><article><Users/><strong>18</strong><span>Kandidat baru</span><small>7 sangat sesuai</small></article><article><Clock3/><strong>4,2 jam</strong><span>Rata-rata terisi</span><small>Di Tulungagung</small></article><article><BadgeCheck/><strong>96%</strong><span>Completion rate</span><small>30 hari terakhir</small></article></div></section>
      </main>
      <footer><Logo /><p>Membuka peluang penghasilan lokal secara aman dan manusiawi.</p><div><button onClick={()=>onEnter("admin")} className="footer-link">Masuk admin</button><span>© 2026 PulihkanAku</span></div></footer>
    </div>
  );
}

export function PulihkanAkuApp({ initialRole = null, displayName, profileCompletion, verificationStatus }: { initialRole?: Role | null; displayName?: string; profileCompletion?: number; verificationStatus?: string }) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const goHome = () => window.location.assign("/");
  const enter = (target: Role) => window.location.assign(`/masuk?role=${target}`);
  if (role === "worker") return <WorkerDashboard onBack={goHome} displayName={displayName} profileCompletion={profileCompletion} verificationStatus={verificationStatus} />;
  if (role === "business") return <BusinessDashboard onBack={goHome} displayName={displayName} verificationStatus={verificationStatus} />;
  if (role === "admin") return <AdminDashboard onBack={() => setRole(null)} />;
  return <Landing onEnter={enter} />;
}
