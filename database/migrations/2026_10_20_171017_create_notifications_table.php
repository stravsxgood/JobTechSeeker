<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title');
            $table->text('body');
            $table->jsonb('payload')->default('{}');
            $table->foreignUuid('job_application_id')->nullable()->constrained('job_applications')->nullOnDelete();
            $table->foreignUuid('interview_id')->nullable()->constrained('interviews')->nullOnDelete();
            $table->foreignUuid('email_event_id')->nullable()->constrained('email_events')->nullOnDelete();
            $table->foreignUuid('reminder_id')->nullable()->constrained('reminders')->nullOnDelete();
            $table->timestampTz('read_at')->nullable();
            $table->string('dedupe_key');
            $table->timestamps();

            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['user_id', 'read_at', 'created_at']);
            $table->index(['user_id', 'type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
