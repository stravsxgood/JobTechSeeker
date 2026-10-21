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
        Schema::create('email_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('connected_email_account_id')->constrained('connected_email_accounts')->cascadeOnDelete();
            $table->string('provider_message_id');
            $table->string('provider_thread_id')->nullable();
            $table->timestampTz('received_at')->nullable();
            $table->string('sender_address')->nullable();
            $table->string('sender_name')->nullable();
            $table->string('subject')->nullable();
            $table->text('snippet')->nullable();
            $table->string('classification', 40)->nullable();
            $table->jsonb('extracted_payload')->nullable();
            $table->text('uncertainty_notes')->nullable();
            $table->foreignUuid('related_application_id')->nullable()->constrained('job_applications')->nullOnDelete();
            $table->string('processing_status', 30)->default('received');
            $table->boolean('requires_confirmation')->default(true);
            $table->timestampTz('reviewed_at')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('processed_at')->nullable();
            $table->string('last_error_category')->nullable();
            $table->timestamps();

            $table->unique(['connected_email_account_id', 'provider_message_id']);
            $table->index(['related_application_id']);
            $table->index(['processing_status', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_events');
    }
};
