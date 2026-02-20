# J. PANDUAN KODING NEXT.JS APP ROUTER

````md
Peran
Anda adalah Frontend Developer untuk project portfolio berbasis Next.js App Router.

1. Stack
Project ini memakai Next.js App Router, React, TypeScript strict, Tailwind CSS v4, Framer Motion, AOS, Sonner, next-themes, Supabase, OpenRouter, Zod, Lucide React, Tabler Icons, serta utilitas `clsx`, `tailwind-merge`, dan `class-variance-authority` (cva).

2. Struktur folder

```text
src/
|-- app/                   // Route Next.js (page, layout, error, not-found, metadata, api)
|-- blocks/                // Komposisi section per halaman
|-- components/
|   |-- ui/                // UI primitives dan komponen dasar
|   `-- providers/         // Provider global (theme, toast, title)
|-- hooks/                 // Custom hooks reusable
|-- services/              // Data domain statis dan helper akses data/API
|-- stores/                // Konfigurasi statis (menu/navbar/footer)
|-- types/                 // Interface/type domain
`-- lib/                   // Utilitas umum dan integrasi eksternal
```

Pola arsitektur utama project ini adalah `blocks/services/types`.

3. Routing dan konvensi App Router
- File route di `src/app/**/page.tsx` dibuat tipis dan fokus merender block dari `src/blocks/**`.
- API route wajib di `src/app/api/**/route.ts`.
- Pertahankan slug route yang sudah ada, termasuk `techstack-&-certificate`.
- File `error.tsx`, `global-error.tsx`, dan `not-found.tsx` dipakai sesuai konvensi route yang sudah berjalan di repo.

4. Aturan dasar
- Ikuti pola file terdekat terlebih dahulu sebelum menambah pola baru.
- Gunakan nama yang deskriptif dan early return.
- Gunakan alias `@/` untuk import lintas folder.
- Hapus import yang tidak dipakai.
- Hindari refactor besar lintas folder jika task tidak meminta itu.
- Fokus pada perubahan minimal yang menyelesaikan masalah sampai tuntas.

5. View layer dan komponen
- Mayoritas komponen interaktif di repo ini adalah Client Component dengan `"use client"`.
- `default export` dipakai untuk file route di `src/app/**`.
- Komponen reusable di `components`, `blocks`, dan `hooks` diutamakan memakai named export.
- Gunakan `.tsx` untuk file berisi JSX dan `.ts` untuk non-JSX.
- Pertahankan pola komposisi halaman berbasis `blocks`.

6. Hooks
- Semua custom hook berada di `src/hooks/`.
- Hook dipakai untuk logic UI reusable seperti audio player, chatbot state, dan inisialisasi animasi.
- Untuk data async di komponen, pola saat ini menggunakan `useState`, `useEffect`, `useRef`, `useCallback`, dan `useMemo` sesuai kebutuhan.
- Jangan memecah arsitektur ke struktur fitur baru jika tidak ada kebutuhan langsung di task.

7. Data fetching
- Gunakan `fetch` langsung di service atau route handler.
- Di komponen client, data async dikelola dengan `useState` dan `useEffect` bila dibutuhkan.
- Pertahankan pola service sebagai lapisan akses data, misalnya service chatbot, contact, dan preload asset.
- Streaming chatbot mengikuti parser stream yang sudah ada di service OpenRouter.

8. Error handling
- Pakai `try/catch` pada proses async dan akses jaringan.
- Gunakan `console.error` untuk logging error teknis saat debugging.
- Tampilkan pesan user-friendly ke UI lewat toast atau fallback component.
- Gunakan fallback dari `ErrorBoundary`, `error.tsx`, dan `global-error.tsx` untuk kegagalan render.

9. Form handling
- Validasi form mengikuti pola saat ini: schema Zod + local state berbasis `useState`.
- Untuk upload gambar, wajib melewati validasi ketat di `lib/file-validation`.
- Pesan validasi ditampilkan dengan jelas ke user lewat toast.
- Hindari menambahkan abstraction form baru bila pola saat ini sudah cukup.

10. State management
- Tidak ada state library global tambahan yang aktif di repo ini.
- Gunakan local state React sebagai default.
- Folder `src/stores/` dipakai untuk konfigurasi statis seperti menu navbar dan footer, bukan untuk state server data runtime.

11. Service layer
- `src/services/` adalah sumber logic domain: data statis, helper transformasi, dan wrapper API.
- Pisahkan logic bisnis dari komponen UI.
- Hindari akses endpoint langsung dari komponen jika sudah ada service terkait.
- Jaga fungsi service tetap kecil, fokus, dan mudah diuji manual.

12. Styling
- Gunakan Tailwind utility first.
- Gunakan `cn()` untuk merge className dinamis.
- Gunakan `cva` untuk komponen varian di layer UI.
- Gunakan token CSS variable dari `src/app/globals.css` sebagai sumber tema.
- Inline style dipakai hanya untuk nilai dinamis yang tidak praktis ditulis sebagai utility class.

13. Metadata dan SEO
- Metadata utama dikelola dari `src/app/metadata.ts`.
- Judul halaman runtime mengikuti pola `PageTitle` + provider title.
- Preload asset kritikal mengikuti konfigurasi yang sudah ada.
- Jangan menduplikasi sumber metadata tanpa alasan teknis yang jelas.

14. Konvensi TypeScript
- Ikuti style file sekitar saat menambah atau mengubah kode.
- Pertahankan semicolon.
- Mayoritas import memakai double quote, jangan lakukan reformat massal hanya untuk gaya kutip.
- `interface` dominan untuk model dan props.
- `type` dipakai untuk union dan alias utilitas.
- Gunakan `import { type X }` untuk type-only import saat relevan.

15. API routes
- Gunakan pola `route.ts` dengan handler seperti `GET` dan `POST`.
- Gunakan `NextRequest` dan `NextResponse` saat butuh fitur Next.js khusus.
- Gunakan `Response` native saat cukup untuk kebutuhan sederhana.
- Validasi input request sebelum proses tulis data.

16. Integrasi eksternal
- OpenRouter dipakai untuk chatbot streaming.
- Supabase dipakai untuk data komentar dan operasi backend terkait visit.
- Brevo dipakai untuk notifikasi email visit.
- FormSubmit dipakai untuk pengiriman form kontak.
- Rahasia akses layanan eksternal harus tetap di environment variable server-side yang sesuai.

17. Data backend
- Supabase adalah backend utama untuk komentar dan dedupe visit harian.
- Akses key service role hanya boleh dijalankan dari sisi server.
- Jangan expose secret backend ke client component.
- Tetap pisahkan data publik dan data sensitif secara tegas.

18. Testing dan quality gate
- Repo ini belum menyediakan script test dan typecheck terpisah.
- Quality gate utama saat ini adalah `npm run lint`.
- Jalankan `npm run build` untuk perubahan yang berdampak ke route, config, atau integrasi build.
- Jangan menambah perintah verifikasi baru di rules tanpa dukungan script nyata di project.

19. Fitur real time
- Real-time pada project ini berjalan lewat streaming respons chat dari OpenRouter.
- Pertahankan pola stream parser dan cancellation handling yang sudah dipakai di service chatbot.
- Hindari menambah arsitektur real-time lain jika tidak diminta task.

20. Deployment
Set environment variable berikut di platform deploy. Jangan hardcode nilai rahasia di repo.

- `NEXT_PUBLIC_OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `VISIT_ALERT_TO_EMAIL`

21. Dependencies
- Kondisi repo saat ini menggunakan pola versi `latest` dengan lockfile.
- Perubahan dependency harus minimal, relevan dengan task, dan kompatibel dengan implementasi yang ada.
- Setiap perubahan dependency wajib menjaga konsistensi `package-lock.json`.
- Jangan menambah library baru jika kebutuhan masih bisa dipenuhi dengan stack yang sudah terpasang.

22. Sebelum coding
Baca repo dulu dan ikuti pola yang sudah ada. Ubah pola buruk dengan perubahan minimal.
Jalankan typecheck, lint, dan test yang relevan sebelum selesai.
Tulis ringkasan singkat, bagian yang sudah benar dan bagian yang Anda ubah.
````
