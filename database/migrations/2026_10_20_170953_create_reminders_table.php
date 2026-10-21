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
        Schema::create('reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('job_application_id')->nullable()->constrained('job_applications')->cascadeOnDelete();
            $table->foreignUuid('interview_id')->nullable()->constrained('interviews')->cascadeOnDelete();
            $table->string('reminder_type', 40);
            $table->string('title');
            $table->text('body')->nullable();
            $table->timestampTz('scheduled_at');
            $table->string('status', 25)->default('pending');
            $table->timestampTz('sent_at')->nullable();
            $table->string('dedupe_key');
            $table->string('idempotency_key')->nullable();
            $table->unsignedSmallInteger('attempt_count')->default(0);
            $table->string('last_error_category')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['status', 'scheduled_at']);
            $table->index(['user_id', 'scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};
