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
        Schema::create('interviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('job_application_id')->constrained('job_applications')->cascadeOnDelete();
            $table->string('interview_type', 40);
            $table->timestampTz('start_at');
            $table->timestampTz('end_at');
            $table->string('timezone', 50)->default('Asia/Jakarta');
            $table->text('meeting_url')->nullable();
            $table->string('location')->nullable();
            $table->string('status', 25)->default('scheduled');
            $table->string('confirmation_state', 30)->default('not_required');
            $table->string('confirmation_source', 30)->default('manual_entry');
            $table->foreignUuid('source_email_event_id')->nullable()->constrained('email_events')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'start_at']);
            $table->index(['job_application_id', 'start_at']);
            $table->index(['user_id', 'status', 'start_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
