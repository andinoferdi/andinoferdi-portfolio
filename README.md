# Andino Ferdiansah Portfolio

Portfolio website modern yang menampilkan proyek, pengalaman, dan kemampuan saya sebagai Full-Stack Developer.

## Fitur Utama

- **Responsive Design** - Optimal di semua perangkat (desktop, tablet, mobile)
- **Dark/Light Mode** - Toggle tema sesuai preferensi
- **Music Player** - Mini player dengan playlist musik favorit
- **AI Chatbot** - Chat dengan AI tentang proyek dan pengalaman saya
- **Interactive Gallery** - Galeri foto perjalanan dan momen penting
- **Tech Stack Showcase** - Tampilan interaktif tech stack dengan canvas effects
- **Certificates** - Showcase sertifikat profesional dengan 3D cards
- **Smooth Animations** - Animasi AOS (Animate On Scroll) yang halus
- **Modern UI/UX** - Desain yang clean dan user-friendly

## Teknologi yang Digunakan

- **Framework**: Next.js 15 dengan App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion, AOS
- **Icons**: Lucide React, Tabler Icons
- **UI Components**: Radix UI, Custom Components
- **Audio**: HTML5 Audio API dengan custom hooks

## Halaman

- **Home** - Hero section, proyek terbaru, journey timeline, tech stack, certificates, AI chatbot
- **Projects** - Portfolio lengkap semua proyek dengan detail teknologi
- **Tech & Certs** - Daftar lengkap tech stack dan sertifikat profesional
- **Gallery** - Koleksi foto perjalanan dan momen penting

## Project Terbaru

- **SIKAS** - Aplikasi manajemen keuangan personal modern untuk mencatat pemasukan, pengeluaran, dan ringkasan bulanan dengan antarmuka yang bersih dan mudah digunakan.
- **Tech Stack** - Next.js, TypeScript, Tailwind CSS
- **Live URL** - [sikas-noyu.vercel.app](https://sikas-noyu.vercel.app/)
- **Repository** - [github.com/andinoferdi/SIKAS](https://github.com/andinoferdi/SIKAS)

## Music Player

Mini player yang selalu tersedia dengan fitur:
- Play/pause, next/previous track
- Volume control
- Progress bar dengan seek functionality
- Expandable player dengan kontrol lengkap
- Loading state untuk audio dan album art

## AI Chatbot

Chat dengan AI yang mengetahui tentang:
- Proyek dan teknologi yang digunakan
- Pengalaman kerja dan pendidikan
- Skills dan kemampuan
- Informasi CV dan kontak

Routing model chatbot menggunakan `openrouter/free` (Auto Free) untuk stabilitas text + image.
Model spesifik disembunyikan dari UI agar tidak terkena perubahan endpoint model gratis.

Troubleshooting chatbot:
- Pastikan `NEXT_PUBLIC_OPENROUTER_API_KEY` terisi dan valid
- Maksimal 3 gambar per request
- Jika total payload gambar terlalu besar, kompres gambar atau kirim bertahap

## Visit Notification (Brevo)

Notifikasi visit sekarang menggunakan dedupe harian:
- 1 IP hanya mengirim 1 email notifikasi per hari (WIB / Asia Jakarta)
- Pindah halaman di hari yang sama tidak mengirim email tambahan
- IP yang sama pada hari berikutnya akan mengirim email lagi
- Jika IP tidak terbaca, notifikasi di-skip

Dependensi environment:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `VISIT_ALERT_TO_EMAIL`

SQL table yang dibutuhkan di Supabase:

```sql
create table if not exists public.portfolio_visit_daily (
  id bigserial primary key,
  visit_day_jakarta date not null,
  ip text not null,
  first_path text,
  first_referrer text,
  first_user_agent text,
  first_country text,
  first_region text,
  first_city text,
  first_language text,
  first_timezone text,
  first_client_timestamp timestamptz,
  first_server_timestamp timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (visit_day_jakarta, ip)
);

create index if not exists idx_portfolio_visit_daily_day
  on public.portfolio_visit_daily (visit_day_jakarta);

create index if not exists idx_portfolio_visit_daily_ip
  on public.portfolio_visit_daily (ip);
```

## Animasi

- **AOS (Animate On Scroll)** - Animasi fade, slide saat scroll
- **Framer Motion** - Animasi smooth untuk transitions
- **Loading Screen** - Preloader dengan progress tracking
- **Hover Effects** - Interactive hover animations

## Menjalankan Proyek

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build

# Jalankan production server
npm start
```

## Struktur Proyek

```
src/
├── app/                 # Next.js App Router pages
├── blocks/              # Komponen halaman utama
├── components/          # Komponen UI reusable
├── hooks/               # Custom React hooks
├── services/            # Business logic dan data
├── stores/              # State management
├── types/               # TypeScript definitions
└── lib/                 # Utility functions
```

## Highlights

- **Performance Optimized** - Lazy loading, image optimization, code splitting
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **SEO Friendly** - Meta tags, structured data, sitemap
- **Mobile First** - Responsive design dengan mobile-first approach
- **Error Handling** - Error boundaries untuk graceful error handling

## Kontak

- **WhatsApp**: [wa.me/6281359528944](https://wa.me/6281359528944)
