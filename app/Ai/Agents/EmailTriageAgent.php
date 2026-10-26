<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Gemini)]
#[Model('gemini-3.5-flash-lite')]
class EmailTriageAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
Anda adalah Email Recruitment Triage Specialist di CareerPilot AI.
Tugas Anda adalah menganalisis pesan email rekrutmen kerja dan mengekstrak data penting secara akurat dan terstruktur.

Instruksi Analisis:
1. Klasifikasikan pesan email ke salah satu dari 4 kategori berikut:
   - accepted: Diterima (Pemberitahuan bahwa lamaran diterima, penawaran kerja / job offer, atau offering letter resmi).
   - pending: Proses / Pending (Pemberitahuan bahwa lamaran sedang diproses/ditinjau, konfirmasi berkas telah diterima, penugasan tes teknis/assessment, atau permintaan dokumen tambahan).
   - rejected: Ditolak / Rejected (Pemberitahuan penolakan atau belum dapat melangkah ke tahap seleksi berikutnya).
   - interview_invitation: Undangan Interview (Undangan sesi wawancara kerja, baik online via Zoom/Meet/Teams maupun offline/tatap muka).

2. Ekstraksi Data Inti:
   - Nama Perusahaan: Ekstrak nama resmi perusahaan pengirim.
   - Posisi yang Dilamar: Ekstrak judul pekerjaan yang sedang diproses.
   - Jadwal Interview: Ekstrak tanggal (YYYY-MM-DD), waktu mulai (HH:MM), waktu selesai (jika ada), zona waktu (WIB/WITA/WIT/UTC), dan teks jadwal asli.
   - Jenis Interview: Tentukan apakah 'online' atau 'offline'.
   - Jika Offline: Ekstrak alamat/lokasi fisik dan tautkan link Google Maps (maps.google.com atau goo.gl/maps) jika tercantum di pesan email.
   - Jika Online: Ekstrak tautan meeting (Zoom, Google Meet, Microsoft Teams, Webex, dll.).
   - Jika tidak ada interview dalam pesan tersebut, set has_interview ke false.

3. Ketepatan & Catatan Ketidakpastian (Uncertainty Notes):
   - Jika tanggal atau jam bersifat tentatif (misal: "mohon konfirmasi ketersediaan Anda antara hari Selasa atau Rabu"), sebutkan dengan jelas di uncertainty_notes agar pengguna memeriksa detailnya terlebih dahulu.
   - Jangan pernah mengarang link meeting atau tanggal jika tidak tertulis dalam pesan email.
PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'classification' => $schema->string()->enum([
                'accepted',
                'pending',
                'rejected',
                'interview_invitation',
            ])->required(),
            'company_name' => $schema->string()->required(),
            'job_title' => $schema->string()->required(),
            'summary' => $schema->string()->required(),
            'interview_details' => $schema->object(fn ($s) => [
                'has_interview' => $s->boolean()->required(),
                'interview_type_mode' => $s->string()->enum(['online', 'offline', 'unknown'])->required(),
                'schedule' => $s->object(fn ($sch) => [
                    'date' => $sch->string()->nullable(),
                    'start_time' => $sch->string()->nullable(),
                    'end_time' => $sch->string()->nullable(),
                    'timezone' => $sch->string()->nullable(),
                    'raw_text' => $sch->string()->nullable(),
                ])->required(),
                'meeting_url' => $s->string()->nullable(),
                'location' => $s->string()->nullable(),
                'maps_url' => $s->string()->nullable(),
            ])->required(),
            'suggested_action' => $schema->string()->required(),
            'confidence_score' => $schema->number()->required(),
            'uncertainty_notes' => $schema->string()->nullable(),
        ];
    }
}
