# MEMORY.md — Dokumentasi Status & Konteks Pengembangan CareerPilot AI

> **Status Dokumen:** Aktif & Diperbarui  
> **Terakhir Diperbarui:** 26 Oktober 2026  
> **Bahasa:** Bahasa Indonesia

Dokumen ini berfungsi sebagai memori persisten dan catatan acuan teknis (_single source of truth for ongoing development_) untuk proyek **CareerPilot AI**, mencakup ringkasan arsitektur, panduan desain, kepatuhan teknis, status pengerjaan saat ini, dan peta jalan implementasi berikutnya.

---

## 1. Ringkasan Produk (Product Overview)

**CareerPilot AI** adalah platform manajemen pencarian kerja personal (_personal job-search management platform_) yang membantu jobseeker (fresh graduate, jobseeker aktif, dan profesional) mengelola seluruh proses pencarian kerja di satu tempat secara terstruktur, terarah, dan terbantu oleh AI.

### Nilai & Prinsip Produk (Core Principles)

1. **AI-assisted, bukan AI-controlled:** AI memberikan rekomendasi, draf, ringkasan, dan triase email, tetapi keputusan penting (perubahan status lamaran, penambahan ke kalender) tetap berada di bawah kendali dan konfirmasi pengguna.
2. **Data Accuracy First:** Tidak ada manipulasi atau halusinasi status, tanggal, nama perusahaan, atau metrik analitik. Angka dihitung dari data riil database.
3. **Graceful Degradation:** Fungsionalitas inti pencatatan (CRUD lamaran, status, kalender manual, pengingat) harus tetap berfungsi normal meskipun layanan AI (Gemini) atau integrasi email (Gmail) sedang offline/mengalami gangguan.
4. **Privacy by Design:** Akses email minimal (read-only), token OAuth terenkripsi, data sensitif dilindungi server-side, dan pengguna memiliki kendali penuh untuk memutuskan koneksi (_disconnect_) atau menghapus data.

---

## 2. Standar & Kepatuhan Teknis (Technical Rules & Guidelines)

Mengacu pada instruksi wajib di `GEMINI.md`:

### 2.1 Backend (Laravel & PHP 8.5)

- **Versi:** Laravel 12/13 dengan PHP 8.5.
- **Konstruktor & Typing:** Selalu gunakan _PHP 8 constructor property promotion_ dan deklarasi return type / parameter type secara eksplisit pada setiap method.
- **Format & Style:** Menggunakan Laravel Pint (`vendor/bin/pint --format agent`).
- **Pengujian:** Menggunakan Pest (`php artisan test --compact` atau `vendor/bin/pest`).
- **Arsitektur:** Menggunakan Form Requests untuk validasi input, Eloquent API Resources untuk serialisasi, dan Laravel Policies untuk verifikasi kepemilikan resource (_user-scoped_). Primary key tabel domain menggunakan UUID v7.

### 2.2 Database (Supabase PostgreSQL)

- **Row Level Security (RLS):** Supabase mengekspos schema `public` ke PostgREST. Setiap tabel di schema `public` **wajib mengaktifkan RLS** (`ENABLE ROW LEVEL SECURITY`) pada migrasi Postgres untuk mencegah celah keamanan PostgREST / anon key.
- Akses data aplikasi dijalankan secara eksklusif melalui backend Laravel (koneksi PostgreSQL dengan role `postgres`), bukan langsung dari frontend.
- Waktu event disimpan dalam `timestamptz` (UTC), sedangkan display timezone disimpan dalam format IANA (misal: `Asia/Jakarta`).

### 2.3 Frontend (Inertia v3 + React + TypeScript + Vite)

- **Komponen & Routing:** SPA berbasis Inertia v3 dengan React di `resources/js/pages/`. Menggunakan Laravel Wayfinder (`@/actions/` atau `@/routes/`) untuk typed URL routing.
- **Client HTTP:** Menggunakan client bawaan Inertia v3 / Fetch (tidak menggunakan Axios).
- **State & Form:** Menggunakan hooks Inertia v3 (`useForm`, `useHttp`), TanStack Query untuk caching data jika diperlukan, dan Zod untuk validasi skema client-side.

---

## 3. Sistem Desain & Visual Tokens (DESIGN.md — Dovetail Theme)

Antarmuka CareerPilot AI mengadopsi tema **Dovetail**: _blueprint control room at midnight_ (Dark mode bergaya instrumen teknis presisi tinggi, permukaan datar tanpa bayangan tebal, dengan aksen biru cornflower fungsional).

### 3.1 Token Warna

| Token CSS                 | Nilai Hex | Peran / Penggunaan                                                        |
| ------------------------- | --------- | ------------------------------------------------------------------------- |
| `--color-page-ink`        | `#0a0a0a` | Background kanvas utama halaman                                           |
| `--color-deep-coal`       | `#141414` | Background section sekunder / kontainer bertingkat                        |
| `--color-card-carbon`     | `#1e1e1e` | Permukaan kartu, tombol, dan panel bordered                               |
| `--color-steel-border`    | `#313131` | Garis batas halus (_hairline border_) pemisah                             |
| `--color-graphite`        | `#454545` | Border tombol outline dan input frame                                     |
| `--color-fog`             | `#7c7c7c` | Teks nonaktif (_disabled_)                                                |
| `--color-ash`             | `#a7a7a7` | Teks sekunder, metadata, stroke ikon redup                                |
| `--color-snow`            | `#ffffff` | Teks utama, background tombol primary filled                              |
| `--color-blue-cornflower` | `#6798ff` | **Satu-satunya aksen kromatik:** active state, highlight data, ikon fitur |

### 3.2 Tipografi & Bentuk

- **Font Utama:** `Inter` untuk seluruh teks UI dan editorial (bobot 400, 500, 600) dengan _negative letter-spacing_ pada ukuran display/heading.
- **Font Monospace:** `JetBrains Mono` untuk eyebrow label uppercase (misal: `HOW IT WORKS`, `STATUS`), tag beta, dan kode data teknis (dengan _positive tracking_ 0.85px–1.0px).
- **Border Radius:** Standar **8px** untuk semua kartu, tombol, dan input. Radius **4px** hanya untuk badge/tag kecil. Dilarang menggunakan tombol/kartu bentuk kapsul (pill) penuh.
- **Elevasi & Efek:** Tanpa _box-shadow_. Pemisahan hierarki kedalaman murni mengandalkan pergeseran tone warna (`#0a0a0a` → `#141414` → `#1e1e1e` → `#313131`) dan garis batas 1px. Aksen biru tidak boleh dijadikan background isi tombol.

---

## 4. Status Implementasi Saat Ini (Commit f481827)

Pengerjaan tahap awal (First Pengerjaan) telah menyelesaikan fondasi data model dan domain schema:

### 4.1 Skema Database & Model Eloquent

- [x] **User:** Autentikasi, timezone IANA, locale, profile fields (`users` table), trait `HasApiTokens`.
- [x] **Personal Access Tokens:** Tabel token Sanctum dengan RLS Supabase PostgreSQL (`personal_access_tokens` table).
- [x] **Company:** Perusahaan scoped per pengguna dengan `normalized_name` unik per user (`companies` table).
- [x] **JobApplication:** Entitas lamaran kerja dengan status, salary, company link, follow up date, soft delete (`job_applications` table).
- [x] **ApplicationStatusHistory:** Riwayat perubahan status lamaran secara audit append-only (`application_status_histories` table).
- [x] **Interview:** Sesi interview dengan start/end UTC `timestamptz`, tipe, URL meeting, status konfirmasi (`interviews` table).
- [x] **Reminder:** Pengingat terjadwal idempotent dengan `dedupe_key` untuk mencegah notifikasi ganda (`reminders` table).
- [x] **Notification:** Pusat notifikasi in-app dengan `read_at` dan deduplikasi (`notifications` table).
- [x] **CareerPreference:** Preferensi karier pengguna (target roles, weekly application target) bertipe JSONB (`career_preferences` table).
- [x] **ConnectedEmailAccount:** Akun Gmail terhubung dengan token terenkripsi (`access_token_encrypted`) dan status sync (`connected_email_accounts` table).
- [x] **EmailEvent:** Event pesan email rekrutmen terdeteksi dengan payload hasil ekstraksi AI dan status review pengguna (`email_events` table).
- [x] **AgentConversationOwner & AiGenerationLog:** Pelacakan log eksekusi AI dan pemetaan kepemilikan percakapan AI SDK per user.

### 4.2 Enums, Factories & API Resources

- [x] Enums: `ApplicationStatus`, `EmploymentType`, `InterviewStatus`, `ReminderStatus`, `EmailClassification`, `EmailProcessingStatus`, `ConnectionStatus`.
- [x] Factories lengkap untuk semua model untuk kebutuhan testing & seeding.
- [x] Database seeder awal di `DatabaseSeeder.php`.
- [x] API Resource: `UserResource` untuk serialisasi profil dan preferensi karier.
- [x] Form Requests: `RegisterRequest`, `LoginRequest`, `UpdateProfileRequest`, `CareerPlanRequest`.
- [x] Controller: `AuthController` (`register`, `login`, `me`, `updateProfile`, `logout`) dan `AiController` (`careerPlan`, `interviewPreparation`).
- [x] API Routes (`routes/api.php`):
    - `/api/v1/register`
    - `/api/v1/login`
    - `/api/v1/me`
    - `/api/v1/logout`
    - `/api/v1/ai/career-plan`
    - `/api/v1/ai/interview-preparation`

### 4.3 Agen AI (Laravel AI SDK)

- [x] **`CareerPlannerAgent` (`app/Ai/Agents/CareerPlannerAgent.php`):**
    - Mengimplementasikan `Agent` dan `HasStructuredOutput` dari `laravel/ai`.
    - Menghasilkan roadmap realistis 3 atau 5 bulan berdasarkan perbandingan target pekerjaan dan skill pengguna yang ada di CV/profil.
    - Skema structured output mencakup:
        - `summary`: Analisis kesiapan kandidat dan strategi utama.
        - `target_role` & `duration_months`: Pekerjaan target dan durasi roadmap (3 atau 5 bulan).
        - `skill_gap_analysis`: Daftar `matching_skills` dan `missing_skills`.
        - `milestones`: Tahapan per bulan dengan `theme`, `description`, `action_items`, dan `learning_resources`.
        - `learning_resources`: Rekomendasi media belajar untuk setiap skill (YouTube channel/playlist, dokumentasi resmi, website belajar seperti roadmap.sh, MDN, FreeCodeCamp), query/URL pencarian, dan alasan rekomendasi.
        - `portfolio_projects`: Ide proyek portofolio nyata untuk membuktikan skill baru kepada rekruter.
        - `tips_for_success`: Tips praktis konsistensi belajar dan pencarian kerja.
    - Logging otomatis setiap eksekusi AI ke tabel `ai_generation_logs` (request ID, agent, model, latency, status succeeded/failed, payload).

- [x] **`InterviewPrepAgent` (`app/Ai/Agents/InterviewPrepAgent.php`):**
    - Mengimplementasikan `Agent` dan `HasStructuredOutput` dari `laravel/ai`.
    - Menyimulasikan sesi interview kerja nyata berdasarkan `job_title` dan `job_url` dari portal lowongan (LinkedIn, Glints, JobStreet, Indeed, Pintarnya, dll.).
    - Skema structured output mencakup:
        - `interview_overview`: Ringkasan posisi, sumber lowongan/portal, persona pewawancara, dan fokus sesi.
        - `questions`: Pertanyaan simulasi wawancara nyata yang mencakup 4 kategori:
            - `introductory`: Perkenalan diri profesional dan motivasi.
            - `technical`: Pertanyaan kompetensi teknis inti dan alat kerja spesifik posisi tersebut.
            - `behavioral`: Pertanyaan berbasis pengalaman nyata dengan metode STAR (_Situation, Task, Action, Result_).
            - `case_scenario`: Studi kasus dan pemecahan masalah praktis di pekerjaan.
            - Detail per pertanyaan: alasan pewawancara menanyakan (`why_asked`), poin kunci jawaban (`key_points_to_answer`), contoh jawaban kuat (`sample_good_response`), dan jebakan yang dihindari (`pitfall_to_avoid`).
        - `questions_to_ask_interviewer`: Rekomendasi pertanyaan berbobot dari kandidat untuk pewawancara di akhir sesi.
        - `preparation_checklist`: Checklist hal-hal yang perlu disiapkan sebelum sesi interview.
    - Logging otomatis ke `ai_generation_logs` dan penanganan error terisolasi (503 response jika provider AI bermasalah).

### 4.4 Fase 2 — Core MVP Backend & API (Selesai & Terverifikasi)

- [x] **Job Application Management (`JobApplicationController`):**
    - `GET /api/v1/applications`: Pencarian multi-field (`job_title`, `company.name`), filter status (`status`, `active_only`), filter sumber (`source`), filter tipe pekerjaan (`employment_type`), allowlisted sorting, dan bounded pagination (1–100).
    - `POST /api/v1/applications`: Pembuatan lamaran baru, auto-normalisasi perusahaan (`Company`), pencatatan status awal ke `application_status_histories`, dan pengecekan duplikasi otomatis.
    - `GET /api/v1/applications/check-duplicate`: Pengecekan real-time apakah posisi dan perusahaan serupa sudah pernah dicatat oleh user.
    - `GET /api/v1/applications/{id}`: Menampilkan detail lamaran beserta relasi perusahaan, riwayat status, dan jadwal interview.
    - `PATCH /api/v1/applications/{id}`: Memperbarui data lamaran kerja secara fleksibel dengan validasi request.
    - `DELETE /api/v1/applications/{id}`: Soft delete lamaran kerja dan pembatalan otomatis seluruh pengingat (_reminders_) tertunda yang terkait.
    - `POST /api/v1/applications/{id}/status`: Transisi status terdedikasi melalui `ApplicationStatusTransitionService` yang menegakkan graf transisi valid, aturan catatan wajib saat menarik lamaran offer (_withdrawn_), dan logging riwayat status audit.

- [x] **Dashboard Metrics (`DashboardController`):**
    - `GET /api/v1/dashboard`: Mengembalikan metrik real-time berbasis kueri SQL agregat (total lamaran, lamaran aktif, offer, penolakan, total interview), distribusi pipeline per status, progres target mingguan pengguna, 5 jadwal interview terdekat (14 hari ke depan), dan daftar lamaran yang mendekati tenggat follow-up.

- [x] **Manual Interview Management (`InterviewController`):**
    - `GET /api/v1/interviews`: Daftar interview kalender dengan filter rentang tanggal (`start_date`, `end_date`), status, dan ID lamaran.
    - `POST /api/v1/interviews`: Pembuatan jadwal interview manual, deteksi bentrok jadwal (_conflict detection warning_), dan penjadwalan otomatis pengingat H-24 jam & H-2 jam.
    - `GET /api/v1/interviews/{id}`: Detail sesi wawancara lengkap dengan info perusahaan dan lamaran kerja.
    - `PATCH /api/v1/interviews/{id}`: Memperbarui data wawancara; jika waktu `start_at` diubah (reschedule), sistem otomatis membatalkan pengingat lama dan menjadwalkan pengingat baru yang idempotent.
    - `DELETE /api/v1/interviews/{id}`: Soft delete jadwal wawancara dan pembatalan pengingat tertunda.

- [x] **In-App Notification Center (`NotificationController`):**
    - `GET /api/v1/notifications`: Daftar notifikasi pengguna dengan filter `unread_only` dan pagination.
    - `GET /api/v1/notifications/unread-count`: Perhitungan cepat jumlah notifikasi belum dibaca untuk indikator badge UI.
    - `PATCH /api/v1/notifications/{id}/read`: Menandai satu notifikasi telah dibaca (`read_at = now()`).
    - `POST /api/v1/notifications/mark-all-read`: Menandai seluruh notifikasi pengguna sebagai sudah dibaca secara massal.
    - `DELETE /api/v1/notifications/{id}`: Menghapus notifikasi spesifik.

- [x] **Reminder Engine & Scheduler (`ReminderService` & Console Command):**
    - `app/Services/Reminders/ReminderService.php`: Logika bisnis pembuatan reminder wawancara dan follow-up dengan deduplikasi kunci deterministik (`dedupe_key`), reschedule, dan pembatalan.
    - `app:process-due-reminders` (`ProcessDueRemindersCommand`): Perintah Artisan terjadwal setiap 5 menit (`routes/console.php`) yang memproses pengingat yang telah jatuh tempo, menerbitkan notifikasi in-app, dan memperbarui status menjadi `sent` secara idempotent.

- [x] **Basic Career Analytics (`AnalyticsController`):**
    - `GET /api/v1/analytics`: Perhitungan analitik karier murni dari database: ringkasan metrik (response rate %, interview conversion rate %, offer rate %, status aging hari rata-rata di pipeline), rincian pipeline, distribusi aplikasi berdasarkan sumber (LinkedIn, JobStreet, dll.), tren aplikasi bulanan (6 bulan terakhir), dan progres target mingguan.

- [x] **Otorisasi & Keamanan Lintas Pengguna (Cross-User Security):**
    - Kebijakan `JobApplicationPolicy` dan pemfilteran berbasis relasi `$user->jobApplications()`, `$user->interviews()`, `$user->notifications()`, dan `$user->companies()`. Akses ke entitas milik user lain langsung ditolak dengan respons `404 Not Found`.

### 4.5 Fitur Hapus Akun (Delete Account)

- [x] **Hapus Akun Pengguna (`DELETE /api/v1/me`):**
    - Implementasi `deleteAccount` pada `AuthController` dengan validasi `DeleteAccountRequest`.
    - Verifikasi kata sandi pengguna sebelum penghapusan (`Hash::check`).
    - Pencabutan seluruh personal access token Sanctum (`$user->tokens()->delete()`).
    - Pemutusan otomatis koneksi akun email yang terhubung (`connection_status = disconnected`).
    - Invalidasi sesi web aktif jika ada.
    - Soft delete akun pengguna (`$user->delete()`).
    - Pengujian fungsional di `AuthApiTest` (berhasil hapus dengan password benar, gagal 422 dengan password salah, dan penolakan unauthenticated).

### 4.6 Fase 4 — Integrasi Gmail & Email Events Workflow (Backend Selesai)

- [x] **Google OAuth Service (`GmailOAuthService`):**
    - `getAuthorizationUrl`: Pembuatan URL otorisasi Google OAuth 2.0 dengan scope minimal `gmail.readonly`, `userinfo.email`, `userinfo.profile`, `access_type=offline`, dan `state` terenkripsi dengan CSRF/timestamp token.
    - `handleCallback`: Penukaran authorization code dengan access token dan refresh token via Google OAuth token endpoint, pengambilan profil email, dan enkripsi token server-side (`Crypt::encryptString`) sebelum disimpan ke `connected_email_accounts`.
    - `getValidAccessToken` & `refreshAccessToken`: Otomatisasi refresh access token jika mendekati waktu kedaluwarsa.
    - `disconnect`: Memutus integrasi akun email.
- [x] **Gmail Sync Service (`GmailSyncService`):**
    - Sinkronisasi bertahap pesan email rekrutmen melalui endpoint Gmail API (`format=metadata`) untuk meminimalkan transfer data dan menjaga privasi.
    - Query penyaringan otomatis pesan rekrutmen (interview, lamaran, application, hiring, offer, assessment).
    - Deduplikasi pesan email secara deterministik berdasarkan `(connected_email_account_id, provider_message_id)`.
    - Auto-matching pesan masuk dengan lamaran kerja aktif pengguna berdasarkan nama perusahaan dan subjek email.
- [x] **Manajemen Akun Email (`EmailAccountController`):**
    - `GET /api/v1/email/accounts`: Daftar akun email terhubung pengguna (token terenkripsi disembunyikan).
    - `GET /api/v1/email/oauth/google/url`: Mengambil URL otorisasi Google OAuth.
    - `POST /api/v1/email/oauth/google/callback`: Callback penukaran kode dan penyimpanan akun.
    - `POST /api/v1/email/accounts/{id}/disconnect`: Memutus koneksi akun email.
    - `POST /api/v1/email/accounts/{id}/sync`: Memicu sinkronisasi email secara manual.
- [x] **Email Events & Review Workflow (`EmailEventController`):**
    - `GET /api/v1/email/events`: Menampilkan daftar event email dengan filter status (`pending_review_only`, `classification`, `processing_status`).
    - `POST /api/v1/email/events/{id}/confirm`: Pengguna mengonfirmasi aksi email (misal: otomatis membuat jadwal wawancara baru di kalender atau memperbarui status lamaran kerja menjadi interview/offer/rejection).
    - `POST /api/v1/email/events/{id}/dismiss`: Mengabaikan event email dari alur review.
- [x] **Agen AI Email Triage (`EmailTriageAgent`):**
    - Mengimplementasikan `Agent` dan `HasStructuredOutput` dari `laravel/ai`.
    - Menganalisis subjek, pengirim, dan isi pesan email rekrutmen.
    - Mengklasifikasikan email ke dalam 4 kategori definitif sesuai arahan:
        1. **Diterima (`accepted`):** Pemberitahuan bahwa lamaran diterima, penawaran kerja / job offer, atau offering letter resmi.
        2. **Proses / Pending (`pending`):** Pemberitahuan bahwa lamaran sedang diproses/ditinjau, konfirmasi berkas telah diterima, penugasan tes teknis/assessment, atau permintaan dokumen.
        3. **Ditolak / Rejected (`rejected`):** Pemberitahuan penolakan atau belum dapat melanjutkan ke tahap seleksi berikutnya.
        4. **Undangan Interview (`interview_invitation`):** Undangan sesi wawancara kerja, baik online via Zoom/Meet/Teams maupun offline/tatap muka.
    - Mengekstrak: nama perusahaan (`company_name`), posisi yang dilamar (`job_title`), jadwal wawancara terstruktur (`date`, `start_time`, `end_time`, `timezone`, `raw_text`), mode interview (`online` atau `offline`).
    - Menautkan tautan Google Maps (`maps_url`) jika interview bersifat _offline_, dan menautkan tautan meeting (`meeting_url`) seperti Zoom, Google Meet, Microsoft Teams jika _online_.
    - Menyertakan catatan ketidakpastian (`uncertainty_notes`), skor kepastian (`confidence_score`), saran tindakan pengguna, dan klasifikasi pesan.
    - Endpoint `POST /api/v1/email/events/{id}/triage` untuk eksekusi AI Triage on-demand dengan auto-linking ke lamaran terkait dan audit log di `ai_generation_logs`.

- [x] **Deteksi & Rekomendasi Lamaran Stagnan 2 Minggu (`StagnantJobAdvisorAgent` & `StagnantApplicationService`):**
    - Mengidentifikasi lamaran kerja aktif yang tidak mengalami pembaruan status selama $\ge 14$ hari (2 minggu).
    - Menggunakan agen AI `StagnantJobAdvisorAgent` untuk menyusun analisis status, saran proaktif agar tidak putus asa, dan rekomendasi 3–5 lowongan pekerjaan serupa (nama posisi, alasan kesesuaian, skill kunci, dan saran portal pencarian seperti LinkedIn, Glints, JobStreet, Indeed, Pintarnya).
    - Mengirim notifikasi ganda kepada pengguna:
        1. Notifikasi _real-time_ di _in-app notification center_ (`type = stagnant_job_alert`).
        2. Notifikasi email resmi menggunakan Mailable `StagnantApplicationAlertMail` dengan template tema Dovetail.
    - Menggunakan kunci deduplikasi deterministik siklus 2 minggu (`cycle_{n}`) agar pengguna tidak menerima notifikasi berulang untuk siklus yang sama.
    - Perintah Artisan terjadwal harian: `app:check-stagnant-applications` pada `routes/console.php`.
    - Endpoint on-demand: `POST /api/v1/applications/{id}/check-stagnant`.

### 4.7 Pengujian & Verifikasi Kualitas (Automated Tests & Quality Checks)

- [x] **Frontend Typecheck (`npm test`):** Menjalankan `tsc --noEmit` pada seluruh kode TypeScript frontend (0 errors, lulus 100%).
- [x] **Frontend Bundling (`npm run build`):** Sukses mengompilasi 575 modul Vite, Wayfinder route types, dan Tailwind CSS v4 tanpa error.
- [x] **Linter Kode PHP:** Laravel Pint (`vendor/bin/pint --format agent`) lulus 100%.
- [x] **Analisis Statis PHPStan:** Level 7 (`vendor/bin/phpstan analyse`) lulus dengan 0 errors pada seluruh codebase.
- [x] **Pengujian Fungsional Pest:**
    - `tests/Feature/DomainModelsTest.php`: 9 passed, 40 assertions.
    - `tests/Feature/AuthApiTest.php`: 10 passed, 58 assertions (termasuk verifikasi hapus akun).
    - `tests/Feature/CareerPlannerApiTest.php`: 4 passed, 48 assertions.
    - `tests/Feature/InterviewPrepApiTest.php`: 4 passed, 52 assertions.
    - `tests/Feature/JobApplicationApiTest.php`: 8 passed, 63 assertions.
    - `tests/Feature/DashboardAndAnalyticsApiTest.php`: 2 passed, 27 assertions.
    - `tests/Feature/InterviewApiTest.php`: 4 passed, 35 assertions.
    - `tests/Feature/NotificationAndReminderTest.php`: 2 passed, 30 assertions.
    - `tests/Feature/GmailIntegrationApiTest.php`: 6 passed, 40 assertions.
    - `tests/Feature/StagnantApplicationAndEmailTriageTest.php`: 3 passed, 35 assertions (triage ekstraksi data online/offline/maps/zoom, 4 klasifikasi email, deteksi stagnan 2 minggu, in-app alert, email dispatch, command Artisan).
    - **Total suite pengujian: 52 tests passed, 428 assertions (0 failures).**

### 4.4 Frontend Primitives

- [x] Konfigurasi Tailwind CSS v4 dengan variabel CSS Dovetail di `resources/css/app.css`.
- [x] Layout dasar `AppLayout.tsx` dan halaman `welcome.tsx`.
- [x] Komponen UI dasar: `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`.

---

## 5. Peta Jalan & Rencana Pengerjaan Berikutnya (Implementation Roadmap)

Berdasarkan `PRD.md` Bagian 34, langkah-langkah implementasi berikutnya meliputi:

### Fase 1: Penyelesaian Foundation & Autentikasi (Selesai)

- [x] Autentikasi Sanctum (Register, Login, Logout, Profile update, Timezone).
- [x] Route API versioned `/api/v1` terproteksi rate limiting dan auth middleware.
- [x] Supabase Postgres RLS statement pada migrasi token.

### Fase 2: Core MVP (Pencatatan & Manajemen Lamaran)

- [x] **Backend & API Complete:**
    - CRUD Application, Status Workflow & History, search/filter/pagination, duplicate warning.
    - Dashboard SQL metrics, upcoming interviews, follow-ups due.
    - Manual interview calendar CRUD, reschedule idempotent reminder engine.
    - In-app notification center, scheduler command `app:process-due-reminders`.
    - Basic career analytics (conversion rate, source distribution, monthly trend).
- [x] **Frontend Inertia/React UI (Task 1, 2, 3 Selesai):**
    - **Perbaikan Alur Registrasi:** User setelah register diarahkan ke halaman login terlebih dahulu (`/login?registered=1`), bukan langsung ke dashboard. Form login otomatis menampilkan notifikasi sukses dan pre-fill email.
    - **Task 1 — Authenticated Layout (`AppLayout.tsx`):**
        - Header tema Dovetail dengan zona waktu IANA user.
        - Pusat notifikasi dropdown (`NotificationDropdown.tsx`) dengan polling badge unread count, list notifikasi real-time, dan tombol "Tandai Semua Dibaca".
        - Menu dropdown pengguna (`UserDropdown.tsx`) dengan avatar inisial, info email, link ke pengaturan profil, dan aksi logout terpadu.
        - Navigasi responsif mobile drawer dengan tap target $\ge 44$ px dan dukungan tombol Escape.
    - **Task 2 — Dashboard UI Interaktif (`dashboard.tsx`):**
        - 5 kartu metrik KPI real-time (Total Lamaran, Dalam Proses, Jadwal Interview 14 hari, Tawaran Kerja/Offer, Target Mingguan).
        - **Real-Time Chart:**
            - `PipelineChart.tsx`: Visualisasi progress bar & kartu segmentasi status real-time dengan hover tooltip.
            - `MonthlyTrendChart.tsx`: Grafik tren aktivitas lamaran 6 bulan terakhir berbasis kurva SVG dengan tombol refresh instan.
        - **To-Do List Lamaran Yang Sudah Dilamar (`ApplicationTodoList.tsx`):**
            - Filter tindakan: Follow-up jatuh tempo, jadwal interview terdekat, peringatan lamaran stagnan ($\ge 14$ hari).
            - Checklist tugas interaktif (checkbox toggle) dan form tambah to-do kustom per lamaran.
            - Tautan aksi cepat (Latihan Interview AI, Buka Meeting/Maps, Update Status, Cari Alternatif Lowongan).
        - Modal pencatatan cepat (`QuickAddApplicationModal.tsx`) dengan deteksi duplikasi otomatis secara real-time.
    - **Task 3 — My Applications & Kanban Board (`applications/index.tsx`):**
        - Toggle tampilan: **Daftar Tabel** vs **Kanban Board** 5 lajur status (Tersimpan, Dilamar, Tahap Seleksi, Tawaran, Selesai/Ditolak).
        - Pencarian multi-field (posisi & perusahaan), filter status, filter sumber, dan paginasi server-side.
        - Indikator peringatan lamaran stagnan $\ge 14$ hari pada tabel dan kartu kanban.
        - Modal detail & transisi status (`ApplicationDetailModal.tsx`) yang menegakkan graf transisi resmi PRD serta pencatatan audit log history.
    - **Task 4 — Kalender Wawancara Interaktif (`interviews/index.tsx`):**
        - Tampilan ganda: **Kalender Bulanan (Month Grid)** dengan cell hover quick-add vs **Daftar Agenda (Weekly/Chronological List)**.
        - Deteksi konflik waktu (_conflict warning_) otomatis jika ada jadwal sesi yang bertabrakan di jam yang sama.
        - Modal penjadwalan interview baru (`POST /api/v1/interviews`) terhubung ke lamaran aktif, preset tahapan, mode online (Google Meet/Zoom) vs offline (Google Maps), dan penjadwalan reminder otomatis.
        - Modal kelola & reschedule (`PATCH /api/v1/interviews/{id}`) dengan pencatatan alasan resmi dan pembaruan pengingat.
        - Aksi ubah status (Tandai Selesai / Dibatalkan / Hapus).
        - Pintasan 1-klik dari kartu jadwal interview langsung ke **AI Interview Copilot** untuk simulasi latihan.
    - **Task 6 — Integrasi Akun Gmail & Email Triage UI (`integrations/index.tsx` & `notifications/index.tsx`):**
        - **Halaman Integrasi (`integrations/index.tsx`):** Otorisasi Google OAuth, kartu status akun terhubung, sinkronisasi manual (`POST /api/v1/email/accounts/{id}/sync`), pemutusan akun aman (`POST /api/v1/email/accounts/{id}/disconnect`), pilar jaminan privasi (_read-only scope_, tanpa kirim email, enkripsi token AES-256-CBC), dan alat simulasi 4 skenario email rekrutmen masuk untuk pengujian langsung.
        - **Pusat Notifikasi & Review Triase (`notifications/index.tsx`):**
            - Panel review triase email rekrutmen (_Awaiting Review_) dengan kartu klasifikasi warna (_Undangan Interview_, _Tawaran Kerja/Offer_, _Proses Seleksi_, _Penolakan_).
            - Ekstraksi AI terstruktur: Perusahaan & Posisi, jadwal interview, link Google Meet/Zoom, dan alamat Google Maps.
            - Konfirmasi 1-klik: Otomatis memasukkan agenda ke Kalender Wawancara dan memperbarui status lamaran kerja, atau abaikan (_dismiss_).
            - Riwayat notifikasi in-app, filter tab, tandai dibaca per-item atau semua sekaligus, dan hapus notifikasi.
            - **Modal Pratinjau Email Notifikasi:** Tombol "Lihat Format Email Yang Dikirimkan" untuk melihat secara visual template email resmi bertema Dovetail (`StagnantApplicationAlertMail`) yang dikirimkan ke kotak masuk pengguna jika lamaran stagnan $\ge 14$ hari.
- [ ] **Langkah Berikutnya (Next Step):**
    - Halaman Analitik Karier (`resources/js/pages/analytics/index.tsx`).
    - Halaman Pengaturan Profil & Privasi (`resources/js/pages/settings/index.tsx`).

### Fase 3: Integrasi AI Core (Laravel AI SDK + Google Gemini) (Task 5 Selesai)

- [x] Backend `CareerPlannerAgent` dengan structured output roadmap 3/5 bulan & media belajar.
- [x] Backend `InterviewPrepAgent` simulasi wawancara nyata berdasarkan lowongan kerja.
- [x] **Konfigurasi Provider & Failover AI Gemini:**
    - Perbaikan `config/ai.php` dan `.env` yang sebelumnya mengarah ke provider default `openai` tanpa API key (penyebab HTTP 401/503).
    - Menetapkan provider default `gemini` dan model aktif `gemini-3.5-flash-lite` dengan atribut kelas `#[Provider(Lab::Gemini)]` dan `#[Model('gemini-3.5-flash-lite')]`.
    - Menambahkan mekanisme _automatic failover_ bertingkat di `AiController`: jika model primer mengalami lonjakan traffic/overload, otomatis dialihkan ke model cadangan `gemini-3.1-flash-lite`.
- [x] **Frontend UI AI Career Planner (`resources/js/pages/ai/career-planner.tsx`):**
    - Input posisi target, durasi (3 atau 5 bulan), skill yang dikuasai saat ini, draf CV, dan catatan.
    - Analisis gap skill (matching vs missing skills).
    - Roadmap per bulan interaktif dengan tab navigasi, action items, rekomendasi media (YouTube, dokumentasi, roadmap.sh), dan ide proyek portofolio.
    - Aksi salin seluruh roadmap ke clipboard dengan feedback visual.
- [x] **Frontend UI AI Interview Copilot (`resources/js/pages/ai/interview-copilot.tsx`):**
    - Pilihan autofill 1-klik dari daftar lamaran aktif yang terlacak atau input manual lowongan baru.
    - Deteksi otomatis portal lowongan kerja (LinkedIn, Glints, JobStreet, Indeed, Kalibrr, Pintarnya) dari tautan URL.
    - Pilihan fokus interview: Komprehensif (semua aspek), Technical, Behavioral (metode STAR), dan HR / Culture Fit.
    - Tombol "Isi Contoh Cepat" untuk pengujian instan tanpa perlu mengetik manual.
    - Tampilan ringkasan pewawancara: peran interviewer persona, portal sumber, dan ringkasan ekspektasi.
    - Filter kategori pertanyaan (Semua, Introductory, Teknis, Behavioral STAR, Studi Kasus) dengan accordion interaktif.
    - Panduan mendalam per pertanyaan: tujuan pertanyaan bagi rekruter, poin kunci jawaban, contoh respons kuat terstruktur, dan jebakan fatal yang harus dihindari.
    - Lembar catatan latihan jawaban pribadi (auto-save ke browser localStorage).
    - Reverse Interview: Daftar pertanyaan strategis berbobot untuk diajukan kandidat kepada pewawancara di akhir sesi beserta tujuannya.
    - Checklist persiapan pra-wawancara interaktif dengan progress bar penyelesaian.
    - Tautan pintasan dari modal detail lamaran (`ApplicationDetailModal.tsx`) dan to-do list (`ApplicationTodoList.tsx`) langsung ke Interview Copilot.

### Fase 4: Integrasi Gmail (OAuth & Email Triage) (Selesai)

- [x] Alur OAuth Google dengan scope read-only minimal, penukaran token server-side terenkripsi (`GmailOAuthService`).
- [x] Sinkronisasi bertahap email rekrutmen dan pencegahan duplikasi pesan (`GmailSyncService`).
- [x] Alur review dan konfirmasi pengguna untuk pesan email yang terdeteksi (`EmailEventController`).
- [x] Implementasi `EmailTriageAgent` dengan ekstraksi detail interview, mode online (Zoom/Meet/Teams), offline (Google Maps), uncertainty notes, dan klasifikasi pesan.
- [x] Deteksi & rekomendasi lamaran stagnan (2 minggu) via notifikasi in-app & email (`StagnantJobAdvisorAgent`, `StagnantApplicationAlertMail`, command harian `app:check-stagnant-applications`).

---

## 6. Catatan Khusus untuk Sesi Pengembangan

- Jalankan `vendor/bin/pint --format agent` setiap kali selesai memodifikasi file PHP.
- Jalankan `php artisan test --compact` untuk memastikan seluruh fitur baru lolos uji tanpa regresi.
- Pertahankan konsistensi desain Dovetail (warna, font Inter + JetBrains Mono, border 8px, tanpa box-shadow).
- Setiap kemajuan atau perubahan signifikan wajib dicatat kembali ke dalam dokumen `MEMORY.md` ini.
