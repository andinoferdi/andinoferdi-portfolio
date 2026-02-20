# NEXT.JS PORTFOLIO CODE RULES

````md
Anda adalah Frontend Developer untuk project portfolio berbasis Next.js App Router.

## 1. Scope Project

Project ini adalah personal portfolio interaktif, bukan aplikasi dashboard enterprise.
Fokus utama: presentasi profil, proyek, perjalanan, tech stack, galeri, chatbot, dan komentar.

## 2. Stack Aktual Project

- Next.js App Router + TypeScript
- Tailwind CSS v4 + tw-animate-css
- Framer Motion + AOS
- next-themes, Sonner
- Supabase (komentar)
- OpenRouter API (chatbot)
- Radix UI, Lucide, Tabler Icons, Three.js/@react-three/fiber untuk elemen visual tertentu

Jangan memaksa pola stack lain yang tidak dipakai langsung di repo ini.

## 3. Struktur Folder Wajib Diikuti

```text
src/
|-- app/                   # Route Next.js (page, layout, error, not-found, api)
|-- blocks/                # Blok halaman per route (home, projects, gallery)
|-- components/
|   |-- ui/                # Reusable UI primitives
|   `-- providers/         # Theme, title, toast provider
|-- hooks/                 # Custom hooks global (AOS, audio player, chatbot)
|-- services/              # Data provider + helper functions
|-- stores/                # Konfigurasi menu/footer statis
|-- types/                 # Type/interface per domain
`-- lib/                   # Utilities dan integrasi client (mis. supabase, validation)
```

## 4. Arsitektur Halaman

- `src/app/**/page.tsx` harus tipis, cukup render komponen dari `src/blocks/**`.
- Komposisi section utama dilakukan di blok page (`src/blocks/...`).
- Untuk section yang berpotensi gagal render, bungkus dengan `ErrorBoundary` seperti pola yang sudah ada.

## 5. Konvensi React dan Komponen

- Gunakan function component.
- Gunakan `"use client"` hanya jika butuh state, effect, event handler, browser API, AOS, audio, atau interaksi langsung.
- Export komponen reusable dengan named export (`export const ...`).
- `default export` dipakai untuk file route Next.js yang memang konvensi framework.
- Ikuti pola props yang sudah ada, jangan ubah API komponen tanpa kebutuhan jelas.

## 6. Pola Data dan Service

- Data portfolio utama disimpan sebagai data statis terstruktur di `src/services/*.ts`.
- Pertahankan pola getter seperti `getProjectsData`, `getGalleryData`, `getTechStackData`.
- Jangan memindahkan data statis ke client state global jika tidak ada kebutuhan fungsional.
- Logic helper tetap di service jika berkaitan langsung dengan domain data.

## 7. Hooks

- Semua custom hook berada di `src/hooks/` dan wajib diawali prefix `use`.
- Hook kompleks (chatbot, audio player) harus menjaga stabilitas render dengan `useMemo`, `useCallback`, dan `useRef` seperlunya.
- Jangan buat hook baru jika logic cukup sebagai fungsi biasa di service/lib.

## 8. Styling dan Design Tokens

- Gunakan Tailwind utility classes sebagai default.
- Gunakan `cn()` dari `src/lib/utils.ts` untuk merge className.
- Untuk komponen varian, gunakan `cva` seperti pola di `src/components/ui`.
- Gunakan token warna dari `src/app/globals.css`.
- Hardcode warna hanya jika memang kebutuhan visual spesifik (misalnya progress gradient dinamis).

## 9. Motion dan Animasi

- Inisialisasi AOS melalui `useAOS()` pada block client yang membutuhkan.
- Gunakan atribut `data-aos` di elemen yang dianimasikan.
- Gunakan Framer Motion untuk interaksi yang membutuhkan state animation (contoh mini player).
- Selalu pertimbangkan `prefers-reduced-motion` untuk aksesibilitas dan performa.

## 10. Aksesibilitas

- Semua tombol icon-only wajib punya `aria-label`.
- Pertahankan keyboard interaction (`onKeyDown`, `tabIndex`, role) pada komponen interaktif.
- Gunakan struktur semantik (`section`, `header`, `main`) sesuai konteks layout.

## 11. Routing dan Metadata

- Ikuti route path yang sudah ada, termasuk path dengan karakter khusus seperti `techstack-&-certificate`.
- Metadata utama dikelola dari `src/app/metadata.ts`.
- Untuk judul halaman runtime, gunakan pola `PageTitle` yang sudah diterapkan.
- Jangan duplikasi sumber metadata tanpa alasan jelas.

## 12. API Route dan Integrasi Server

- API handler hanya di `src/app/api/**/route.ts`.
- Gunakan `NextResponse.json()` untuk respons JSON.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server route, tidak boleh diekspos ke client.
- Validasi input wajib dilakukan di route sebelum query insert/update.

## 13. Environment Variables

Variabel yang digunakan project ini:
- `NEXT_PUBLIC_OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Aturan:
- Jangan hardcode secret.
- Jangan log secret value ke console.
- Variabel publik hanya yang memang aman dibuka ke browser.

## 14. TypeScript Conventions

- Gunakan typing eksplisit untuk data domain.
- `interface` dan `type` boleh dipakai, ikuti gaya terdekat pada file/domain terkait.
- Gunakan `import { type X }` untuk type-only import bila memungkinkan.
- Hindari `any` kecuali benar-benar tidak ada alternatif yang aman.

## 15. Import dan Penamaan

- Gunakan alias `@/` untuk import lintas folder.
- Gunakan relative import hanya untuk file yang sangat dekat.
- Nama file gunakan kebab-case mengikuti pola repo.
- Nama komponen gunakan PascalCase.
- Nama konstanta gunakan UPPER_SNAKE_CASE hanya untuk konstanta global tetap.

## 16. Error Handling

- Tangani error async dengan `try/catch` pada route handler dan proses I/O utama.
- Untuk UI fallback, pakai pola `ErrorBoundary`, `error.tsx`, dan `global-error.tsx`.
- Pesan error ke user harus jelas dan aman, detail teknis hanya ditampilkan di mode development bila diperlukan.

## 17. Performance

- Gunakan `next/image` untuk aset gambar.
- Pertahankan preload aset penting sesuai pola di metadata.
- Hindari komputasi berat berulang di render path.
- Pastikan update state tidak memicu rerender berantai yang tidak perlu.

## 18. Prinsip Perubahan Kode

- Ikuti pola yang sudah ada sebelum memperkenalkan pola baru.
- Lakukan perubahan sekecil mungkin tetapi tuntas.
- Jangan melakukan refactor besar lintas folder jika task tidak membutuhkan.
- Jangan ubah visual direction portfolio tanpa permintaan eksplisit.

## 19. Checklist Sebelum Selesai

- Jalankan `npm run lint`.
- Jika perubahan menyentuh route, config, atau build path, jalankan `npm run build`.
- Tulis ringkasan singkat yang menyebut apa yang diubah dan dampaknya.
````
