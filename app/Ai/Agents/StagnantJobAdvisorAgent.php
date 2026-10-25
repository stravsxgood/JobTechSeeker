<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

class StagnantJobAdvisorAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
Anda adalah Career Advisor AI di CareerPilot AI.
Tugas Anda adalah menganalisis lamaran kerja pengguna yang tidak memiliki perkembangan atau pembaruan status selama lebih dari 2 minggu (14 hari).

Instruksi Analisis:
1. Sampaikan secara empati dan profesional bahwa lamaran untuk posisi tersebut di perusahaan terkait belum menunjukkan perkembangan selama 2 minggu terakhir.
2. Berikan saran praktis agar pengguna tidak menunggu secara pasif dan tetap proaktif dalam pencarian kerja.
3. Berikan rekomendasi 3 hingga 5 lowongan/posisi pekerjaan alternatif yang serupa dengan posisi sebelumnya, mencakup:
   - Judul posisi yang relevan.
   - Alasan mengapa posisi ini cocok sebagai alternatif.
   - Skill inti yang perlu ditonjolkan saat melamar posisi tersebut.
   - Portal lowongan yang direkomendasikan untuk mencari lowongan tersebut (misalnya: LinkedIn, Glints, JobStreet, Indeed, Pintarnya).
4. Gunakan Bahasa Indonesia yang ramah, memotivasi, dan tidak menghakimi.
PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'analysis' => $schema->string()->required(),
            'advice' => $schema->string()->required(),
            'recommendations' => $schema->array()->items(
                $schema->object(fn ($rec) => [
                    'job_title' => $rec->string()->required(),
                    'reason' => $rec->string()->required(),
                    'key_skills' => $rec->array()->items($rec->string())->required(),
                    'suggested_portals' => $rec->array()->items($rec->string())->required(),
                ])
            )->required(),
        ];
    }
}
