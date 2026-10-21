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
        Schema::create('application_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_application_id')->constrained('job_applications')->cascadeOnDelete();
            $table->string('previous_status', 25)->nullable();
            $table->string('new_status', 25);
            $table->string('change_source', 30)->default('user');
            $table->text('notes')->nullable();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('source_email_event_id')->nullable()->constrained('email_events')->nullOnDelete();
            $table->timestampTz('changed_at');
            $table->timestamps();

            $table->index(['job_application_id', 'changed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_status_histories');
    }
};
