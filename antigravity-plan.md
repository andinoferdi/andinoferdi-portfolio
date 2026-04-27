# Remaster Mobile-First: Portfolio AndinoFerdi

## Pemahaman Permintaan

Anda ingin **remaster** (bukan rebuild total) website portfolio agar benar-benar mobile-first: class Tailwind default untuk mobile, breakpoint hanya untuk perluasan ke tablet/desktop. Sekaligus mengurangi lag di mobile pasca-preload screen. Desain, identitas visual, dan fitur utama tetap dipertahankan.

---

## Masalah Utama yang Ditemukan

### 1. Preload System Terlalu Agresif
- `LoadingScreen` memuat **semua** aset non-musik sebelum user masuk halaman utama — termasuk 40+ gambar gallery, project images, certificate images, journey logos.
- Di mobile (koneksi lambat), ini menyebabkan waktu tunggu sangat lama sebelum "Start Experience".
- Setelah preload selesai, **semua konten langsung di-render** bersamaan → jank berat saat transisi masuk halaman.

### 2. Canvas Flappy Bird Game di Loading Screen
- Game Flappy Bird berjalan di `requestAnimationFrame` loop dengan fixed timestep (1/240s) — sangat berat di mobile low-end.
- 4 file audio di-preload bersamaan saat loading screen mount.
- Canvas DPR di-cap di 2, tapi pada mobile high-DPI ini masih bisa berat.

### 3. Backdrop Blur Sudah Dinonaktifkan, Tapi Tidak Konsisten
- `globals.css` menonaktifkan `backdrop-blur-md` dan `backdrop-blur-sm` di mobile.
- Namun beberapa komponen menggunakan `md:backdrop-blur-md` (benar) dan beberapa langsung `backdrop-blur-md` tanpa prefix `md:` (salah — tetap kena disable CSS tapi menambah overhead parsing).

### 4. AOS (Animate On Scroll) Tidak Optimal
- Semua section menggunakan `data-aos` tanpa `data-aos-once="true"` → animasi re-trigger setiap scroll.
- `will-change: transform, opacity` diterapkan ke **semua** `[data-aos]` elemen secara permanen → memakan VRAM di mobile.
- `will-change` seharusnya hanya aktif saat animasi sedang berjalan.

### 5. Framer Motion pada Chatbot Messages
- Setiap pesan chat menggunakan `motion.div` dengan delay berbasis index (`delay: index * 0.1`) → semakin banyak pesan, semakin lambat render.
- `AnimatePresence` pada empty state tidak perlu di-wrap.

### 6. Mini Player Overhead di Mobile
- `window.addEventListener("resize", checkMobile)` tanpa debounce — rerender berlebihan saat resize/orientation change.
- `SmartImage` re-render state pada setiap track change.

### 7. Route Prefetch Terlalu Agresif
- `RoutePrefetch` mulai mem-prefetch 10 gallery images + project images setelah hanya 2 detik delay, bahkan di mobile.
- Ini bersaing dengan konten visible yang sedang loading.

### 8. Pola Desktop-First pada Class Tailwind
- Banyak section masih menggunakan pattern desktop-first:
  - `text-4xl md:text-6xl` → sudah mobile-first ✅
  - `py-20 px-4` → padding terlalu besar untuk mobile
  - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` → sudah benar ✅
  - `backdrop-blur-md` tanpa prefix → desktop-first pattern ❌
  - `min-h-screen` di hero → bisa menyebabkan overflow di mobile ❌

---

## Strategi Remaster

### Fase 1: Performa Kritis (Dampak Terbesar)

#### A. Optimasi Preload System
- **Pisahkan critical vs non-critical assets**: Hanya preload gambar hero (4 profile images), journey logos (3), dan project images pertama (3) saat loading screen.
- **Defer gallery, certificate, dan remaining project images** ke `requestIdleCallback` setelah halaman utama stabil.
- **Di mobile**: Kurangi concurrency preload dari 6 → 2 untuk images.
- **Cap canvas DPR** di mobile ke 1.5 (dari 2).

#### B. Optimasi Loading Screen
- Kurangi fixed timestep game dari 1/240s ke 1/120s di mobile.
- Lazy-load audio game: hanya load `jump.mp3` langsung, sisanya setelah gesture pertama.

#### C. AOS Optimization
- Tambahkan `data-aos-once="true"` ke semua elemen AOS → animasi hanya trigger sekali.
- Ubah `will-change` di CSS: hanya aktif saat animasi belum selesai, reset setelah `aos-animate`.
- Di mobile, kurangi offset AOS agar animasi trigger lebih cepat saat scroll.

### Fase 2: Layout Mobile-First

#### D. Refactor Section Padding & Spacing
- `py-20 px-4` → `py-12 px-4 md:py-20` (mobile padding lebih kecil)
- `mb-16` pada headers → `mb-10 md:mb-16`
- `text-4xl md:text-6xl` sudah benar, tidak perlu diubah.
- `gap-12` → `gap-8 lg:gap-12`
- `pt-26` di hero → `pt-20 md:pt-26`

#### E. Refactor Backdrop Blur
- Ganti semua `backdrop-blur-md` langsung → `md:backdrop-blur-md` agar CSS mobile disable rule tidak perlu override.
- Hapus CSS rule yang men-disable backdrop blur paksa di mobile karena sudah ditangani level class.

#### F. Contact Section
- `backdrop-blur-md` di form card → `md:backdrop-blur-md`
- `gap-12` → `gap-8 lg:gap-12`

### Fase 3: Komponen Interaktif

#### G. Mini Player
- Debounce `resize` listener (150ms).
- Kurangi animasi duration di mobile yang sudah ada (sudah baik, hanya perlu memastikan).

#### H. Chatbot Section
- Hapus `delay: index * 0.1` pada message animation → gunakan delay tetap kecil atau 0 untuk pesan lama.
- Di mobile, kurangi height card chatbot.

#### I. Route Prefetch
- Di mobile, delay prefetch dari 2s → 5s.
- Kurangi batch gallery prefetch dari 10 → 4 gambar.
- Hanya jalankan prefetch jika `navigator.connection?.effectiveType` bukan `2g`/`slow-2g`.

### Fase 4: Image Optimization

#### J. Image Loading Strategy
- Hero profile images: `loading="eager"`, `priority={index === 0}`.
- Gallery images: `loading="lazy"` (sudah benar).
- Project images yang visible (pertama 3): `loading="eager"` di home.
- Journey logos: `loading="lazy"` (sudah benar).
- Tambahkan `sizes` prop yang tepat berdasarkan layout grid.

---

## Daftar File yang Perlu Diubah

### Performa Kritis
| File | Perubahan |
|---|---|
| [globals.css](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/app/globals.css) | Optimasi `will-change` AOS, perbaiki mobile blur rule |
| [loading-screen.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/components/loading-screen.tsx) | Cap DPR mobile, kurangi timestep, optimasi audio lazy load |
| [route-prefetch.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/components/route-prefetch.tsx) | Delay lebih lama di mobile, kurangi batch, cek connection |
| [useAOS.ts](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/hooks/useAOS.ts) | Tambahkan `once: true`, offset mobile lebih kecil |

### Layout Mobile-First
| File | Perubahan |
|---|---|
| [hero-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/hero-section.tsx) | Padding mobile-first, spacing |
| [Introduction-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/Introduction-section.tsx) | Padding, backdrop blur prefix |
| [projects-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/projects-section.tsx) | Padding mobile-first |
| [journey-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/journey-section.tsx) | Padding, backdrop blur prefix, hover disable mobile |
| [techstack-&-certificate-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/techstack-&-certificate-section.tsx) | Padding mobile-first |
| [contact-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/contact-section.tsx) | Padding, gap, backdrop blur prefix |
| [chatbot-section.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/home/chatbot-section.tsx) | Message animation delay, mobile height |
| [gallery/index.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/gallery/index.tsx) | Padding mobile-first |
| [projects/index.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/blocks/projects/index.tsx) | Padding mobile-first |

### Komponen
| File | Perubahan |
|---|---|
| [mini-player.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/components/mini-player.tsx) | Debounce resize, optimasi |
| [navbar.tsx](file:///c:/Users/andin/Downloads/andinoferdi-portfolio/src/components/navbar.tsx) | Verifikasi mobile-first (sudah cukup baik) |

---

## Open Questions

> [!IMPORTANT]
> **Preload Strategy**: Saat ini loading screen memaksa user menunggu **semua** aset non-musik selesai di-download sebelum bisa masuk. Apakah Anda ingin saya mengubahnya agar di mobile hanya memuat critical assets (hero images, first 3 project images, journey logos) lalu sisanya di-lazy-load setelah user masuk halaman? Ini akan **drastis** mengurangi waktu tunggu di mobile.

> [!IMPORTANT]
> **Flappy Bird Game**: Game ini sangat berat di mobile low-end karena canvas rendering + 4 audio files. Opsi: (A) tetap aktif di semua device, (B) nonaktifkan game loop di mobile dan tampilkan static loading screen saja, (C) kurangi fidelitas game di mobile (lower DPR, simplified rendering). Rekomendasi saya: **opsi C** — game tetap ada tapi lebih ringan.

> [!NOTE]
> **Backdrop Blur**: CSS saat ini sudah menonaktifkan backdrop blur di mobile via `!important`. Refactor ke class-level (`md:backdrop-blur-md`) lebih bersih dan menghindari specificity war. Apakah pendekatan ini sesuai harapan Anda?

---

## Verification Plan

### Automated
- `npm run lint` — pastikan tidak ada lint error baru.
- `npm run build` — pastikan build berhasil tanpa error TypeScript.

### Manual (oleh Anda)
- Test di device mobile nyata (Chrome DevTools throttling 4G / perangkat asli).
- Bandingkan waktu dari klik "Start Experience" hingga halaman utama interaktif.
- Scroll seluruh halaman utama dan perhatikan smoothness.
- Buka/expand mini player di mobile.
- Navigasi ke halaman Gallery dan Projects.
- Test chatbot di mobile.
- Verifikasi visual tidak berubah signifikan di desktop.
