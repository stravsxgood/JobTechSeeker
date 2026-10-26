# CareerPilot AI

![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)

**CareerPilot AI** adalah platform pengelolaan pencarian kerja berbantuan AI untuk membantu jobseeker mencatat lamaran, memantau proses rekrutmen, mengelola jadwal interview dan follow-up, serta memahami progres melalui analitik.

> **Project status:** Spesifikasi produk dan teknis tersedia di [`PRD.md`](PRD.md). Status implementasi setiap fitur harus mengikuti kondisi repository; dokumentasi ini tidak menyatakan semua fitur sudah tersedia.

## Fitur Utama (MVP)

- **Application Tracker:** CRUD lamaran, status history, pencarian, filter, pagination, dan Kanban board.
- **Dashboard & Analytics:** Ringkasan pipeline dan metrik yang dihitung dari data tersimpan.
- **Interview Calendar & Reminders:** Pengelolaan jadwal, timezone, follow-up, dan reminder tanpa duplikasi.
- **Notification Center:** Notifikasi aplikasi dan tindakan yang perlu ditinjau.
- **AI Career Planner:** Saran prioritas dan rencana pencarian kerja berdasarkan konteks pengguna.
- **AI Interview Copilot:** Pertanyaan latihan, checklist kompetensi, dan materi persiapan interview.
- **Gmail Assistant:** OAuth, sinkronisasi email incremental, klasifikasi berbantuan AI, dan review pengguna sebelum perubahan penting.

AI bersifat **assistant, bukan pengambil keputusan otomatis**. Email yang ambigu harus ditinjau; kegagalan AI atau Gmail tidak boleh menghentikan pengelolaan lamaran inti.

## Tech Stack

| Layer                 | Teknologi                                                 | Peran                                                          |
| --------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Frontend              | React, TypeScript, Vite                                   | Single-page application                                        |
| Routing               | React Router                                              | Navigasi halaman                                               |
| Server state          | TanStack Query                                            | Fetching, cache, dan sinkronisasi data API                     |
| Form & validation     | React Hook Form, Zod                                      | Form state dan validasi sisi klien                             |
| HTTP client           | Axios atau API client terpusat                            | Komunikasi dengan backend                                      |
| Styling               | Tailwind CSS, UI primitives                               | UI responsif dan aksesibel                                     |
| Backend               | Laravel (Laravel 13.x sebagai baseline usulan)            | Business logic dan REST API                                    |
| API & ORM             | REST `/api/v1`, Eloquent, API Resources, Form Requests    | Kontrak API, akses data, dan validasi                          |
| Authentication        | Laravel Sanctum                                           | Autentikasi SPA berbasis session/cookie bila sesuai deployment |
| Database              | Supabase PostgreSQL                                       | Database utama aplikasi                                        |
| AI                    | Laravel AI SDK (`laravel/ai`) + Google Gemini             | Agent dan structured output                                    |
| Email integration     | Gmail API + Google OAuth 2.0                              | Sinkronisasi email read-only untuk MVP                         |
| Background processing | Laravel Queue                                             | Sinkronisasi email, triase AI, dan pengiriman reminder         |
| Scheduling            | Laravel Scheduler                                         | Menjadwalkan pekerjaan berkala                                 |
| Testing               | Pest atau PHPUnit; frontend test runner sesuai repository | Unit, API, integration, dan UI tests                           |

Versi dependency harus diverifikasi dan dikunci pada lock files saat setup. API Laravel AI SDK, model Gemini, serta konfigurasi OAuth harus mengikuti versi yang benar-benar digunakan.

## Arsitektur Singkat

```text
React + TypeScript + Vite
          │ HTTPS / JSON
          ▼
    Laravel REST API ───── Laravel Sanctum
          │
          ├── Domain services ───── Supabase PostgreSQL
          │
          └── Queue / Scheduler
                    ├── Gmail API
                    └── Laravel AI SDK ─── Google Gemini
```

Laravel adalah satu-satunya backend untuk business logic dan akses tabel bisnis. Frontend **tidak** mengakses Supabase Data API sebagai jalur utama aplikasi. Output AI divalidasi di server; tindakan penting tetap mengikuti business rules dan konfirmasi pengguna.

## Struktur Repository

Usulan struktur monorepo:

```text
careerpilot-ai/
├── PRD.md
├── README.md
├── docs/
├── frontend/   # React, Vite, feature-based UI, API client, tests
└── backend/    # Laravel API, models, policies, services, jobs, migrations, tests
```

Pembagian detail folder frontend dan backend mengacu pada [`PRD.md`](PRD.md), bagian _Repository and Folder Structure_.

## Prasyarat

- Node.js dan package manager yang kompatibel dengan versi frontend yang dipilih.
- PHP, Composer, dan ekstensi yang dibutuhkan versi Laravel yang digunakan.
- Project Supabase dengan akses PostgreSQL melalui koneksi backend yang aman.
- Google Gemini API key.
- Google Cloud project dengan Gmail API dan OAuth 2.0 yang dikonfigurasi untuk pengembangan.

## Menjalankan Secara Lokal

> Langkah berikut mengasumsikan struktur `frontend/` dan `backend/` sudah dibuat. Nama environment variables dapat disesuaikan dengan konfigurasi repository.

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Isi `.env` dengan konfigurasi aplikasi, koneksi Supabase PostgreSQL/TLS, session dan CORS, queue, serta kredensial server-side yang diperlukan. Jangan commit file `.env` atau secrets.

Setelah konfigurasi database dan migration diverifikasi:

```bash
php artisan migrate
php artisan serve
```

Jalankan queue worker dan scheduler di terminal/proses terpisah sesuai kebutuhan environment:

```bash
php artisan queue:work
php artisan schedule:work
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Atur base URL API sesuai environment frontend. Jika menggunakan Sanctum SPA cookie authentication, konfigurasi HTTPS, stateful domains, CORS credentials, dan CSRF harus konsisten antara frontend dan backend.

### 3. Integrasi Google dan AI

Konfigurasikan Gemini API key dan OAuth client Gmail pada environment backend. Daftarkan callback URL yang sesuai, gunakan scope Gmail seminimal mungkin, dan uji dengan akun yang diizinkan. Kesiapan rilis publik bergantung pada persyaratan verifikasi dan kebijakan Google yang berlaku.

## Testing

Jalankan test sesuai scripts dan konfigurasi repository. Cakupan utama MVP:

- Application CRUD, status transition, status history, search, dan authorization ownership.
- Interview scheduling, timezone, reminder reschedule/cancellation, dan deduplikasi.
- Analytics calculation dan akses data antar-user.
- AI structured-output validation dan graceful failure.
- Gmail OAuth, incremental sync, duplicate events, confirmation workflow, dan disconnect.
- Frontend loading, empty, error, dan success states.

## Prinsip Keamanan

- Semua resource privat harus diotorisasi di Laravel berdasarkan user yang terautentikasi.
- Jangan pernah mengekspos database credentials, Gemini API key, OAuth client secret, atau token Gmail ke frontend.
- Enkripsi token OAuth saat tersimpan dan dukung disconnect/revoke.
- Perlakukan konten email sebagai input tidak tepercaya; validasi semua hasil AI di backend.
- Jangan mengirim email atau membuat/mengubah interview dari ekstraksi ambigu tanpa konfirmasi yang disyaratkan.
- Gunakan HTTPS, konfigurasi CORS/CSRF yang tepat, rate limiting, log yang disanitasi, dan backup database.

## Dokumentasi

- **Product & technical specification:** [`PRD.md`](PRD.md)
- [Laravel AI SDK](https://laravel.com/framework/docs/13.x/ai-sdk)
- [Laravel Sanctum](https://laravel.com/framework/docs/13.x/sanctum)
- [Supabase Laravel Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/laravel)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Gmail API](https://developers.google.com/workspace/gmail/api)
- [Gmail API Sync Guide](https://developers.google.com/workspace/gmail/api/guides/sync)
- [Google OAuth Production Readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)

Untuk keputusan produk, business rules, data model, API contracts, acceptance criteria, dan roadmap yang lengkap, gunakan `PRD.md` sebagai acuan utama.
