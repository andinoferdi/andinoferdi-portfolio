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

Chatbot sekarang memakai route internal `POST /api/chatbot` agar request model tidak langsung dari browser.
Pemilihan model bersifat deterministik dengan primary + fallback dari environment server.

Troubleshooting chatbot:
- Pastikan `OPENROUTER_API_KEY` terisi dan valid di server
- Opsional atur `CHATBOT_MODEL_PRIMARY` dan `CHATBOT_MODEL_FALLBACKS`
- Maksimal 3 gambar per request
- Jika total payload gambar terlalu besar, kompres gambar atau kirim bertahap

## Visit Notification (Brevo)

Notifikasi visit sekarang menggunakan session browser:
- 1 session browser mengirim 1 email notifikasi
- Pindah halaman di session yang sama tidak mengirim email tambahan
- Session baru dihitung saat browser ditutup lalu dibuka lagi
- Metadata device tetap dikirim (Visitor ID + Device Signature + Client Hints) agar perangkat berbeda pada IP sama tetap teridentifikasi
- Di mode development (React Strict Mode), tracker memakai lock state `sending/sent` agar tidak double-send

Dependensi environment:
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `VISIT_ALERT_TO_EMAIL`

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
â”œâ”€â”€ app/                 # Next.js App Router pages
â”œâ”€â”€ blocks/              # Komponen halaman utama
â”œâ”€â”€ components/          # Komponen UI reusable
â”œâ”€â”€ hooks/               # Custom React hooks
â”œâ”€â”€ services/            # Business logic dan data
â”œâ”€â”€ stores/              # State management
â”œâ”€â”€ types/               # TypeScript definitions
â””â”€â”€ lib/                 # Utility functions
```

## Highlights

- **Performance Optimized** - Lazy loading, image optimization, code splitting
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **SEO Friendly** - Meta tags, structured data, sitemap
- **Mobile First** - Responsive design dengan mobile-first approach
- **Error Handling** - Error boundaries untuk graceful error handling

## Kontak

- **WhatsApp**: [wa.me/6281359528944](https://wa.me/6281359528944)

