<?php

namespace App\Console\Commands;

use App\Services\Reminders\ReminderService;
use Illuminate\Console\Command;

class ProcessDueRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:process-due-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process all due reminders and deliver in-app notifications';

    /**
     * Execute the console command.
     */
    public function handle(ReminderService $reminderService): int
    {
        $this->info('Memulai pemrosesan reminder yang telah jatuh tempo...');

        $processed = $reminderService->processDueReminders();

        $this->info("Selesai memproses {$processed} reminder.");

        return Command::SUCCESS;
    }
}
