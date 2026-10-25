<?php

namespace App\Console\Commands;

use App\Services\Applications\StagnantApplicationService;
use Illuminate\Console\Command;

class CheckStagnantApplicationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-stagnant-applications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check active job applications with no progress in 2+ weeks, notify users, and provide AI recommendations';

    /**
     * Execute the console command.
     */
    public function handle(StagnantApplicationService $stagnantService): int
    {
        $this->info('Memeriksa lamaran kerja yang belum ada perkembangan selama 2 minggu...');

        $notified = $stagnantService->checkAllStagnantApplications();

        $this->info("Selesai memproses. {$notified} lamaran stagnan berhasil diberikan peringatan dan rekomendasi AI.");

        return Command::SUCCESS;
    }
}
