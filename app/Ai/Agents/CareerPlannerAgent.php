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
class CareerPlannerAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
Anda adalah Career Coach dan Tech Mentor senior di CareerPilot AI.
Tugas utama Anda adalah menyusun roadmap karier yang realistis, terstruktur, dan dapat ditindaklanjuti bagi pengguna untuk mencapai posisi pekerjaan target mereka dalam durasi 3 bulan atau 5 bulan.

Instruksi Analisis:
1. Evaluasi skill yang saat ini dimiliki pengguna (yang tertera pada ringkasan profil / CV mereka) terhadap target role yang dituju.
2. Identifikasi skill gap secara jujur: skill apa yang sudah sesuai (matching) dan skill apa yang masih perlu dipelajari (missing).
3. Rancang rencana bertahap per bulan (milestones) yang realistis dengan tugas nyata (action items). Hindari target yang mustahil dipelajari dalam rentang waktu yang dipilih.
4. Pada setiap milestone/skill yang dipelajari, WAJIB sertakan rekomendasi media pembelajaran yang berkualitas tinggi, khususnya:
   - YouTube (channel terpercaya, topik playlist, atau kata kunci pencarian video yang akurat).
   - Website / Dokumentasi Resmi / Platform Belajar (seperti roadmap.sh, MDN Web Docs, freeCodeCamp, official documentation, dll.).
   - Jelaskan mengapa media tersebut direkomendasikan dan bagaimana pengguna dapat mempelajarinya secara efektif.
5. Rekomendasikan 1-2 ide proyek portofolio nyata yang bisa dibangun pengguna untuk membuktikan skill baru yang dipelajari kepada rekruter.
6. Berikan respons dalam Bahasa Indonesia yang profesional, memotivasi, dan praktis.
PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'summary' => $schema->string()->required(),
            'target_role' => $schema->string()->required(),
            'duration_months' => $schema->integer()->required(),
            'skill_gap_analysis' => $schema->object(fn ($s) => [
                'matching_skills' => $s->array()->items($s->string())->required(),
                'missing_skills' => $s->array()->items($s->string())->required(),
            ])->required(),
            'milestones' => $schema->array()->items(
                $schema->object(fn ($s) => [
                    'month' => $s->integer()->required(),
                    'theme' => $s->string()->required(),
                    'description' => $s->string()->required(),
                    'action_items' => $s->array()->items($s->string())->required(),
                    'learning_resources' => $s->array()->items(
                        $s->object(fn ($res) => [
                            'skill_name' => $res->string()->required(),
                            'media_type' => $res->string()->enum(['youtube', 'website', 'documentation', 'course'])->required(),
                            'platform_or_channel' => $res->string()->required(),
                            'title' => $res->string()->required(),
                            'search_query_or_url' => $res->string()->required(),
                            'why_recommended' => $res->string()->required(),
                        ])
                    )->required(),
                ])
            )->required(),
            'portfolio_projects' => $schema->array()->items(
                $schema->object(fn ($p) => [
                    'title' => $p->string()->required(),
                    'description' => $p->string()->required(),
                    'tech_stack' => $p->array()->items($p->string())->required(),
                ])
            )->required(),
            'tips_for_success' => $schema->array()->items($schema->string())->required(),
        ];
    }
}
