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
        Schema::create('job_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->restrictOnDelete();
            $table->string('job_title');
            $table->text('description')->nullable();
            $table->string('source')->nullable();
            $table->text('source_url')->nullable();
            $table->string('employment_type')->nullable()->default('full_time');
            $table->string('location')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->string('salary_currency', 3)->nullable()->default('IDR');
            $table->date('applied_at')->nullable();
            $table->string('status', 25)->default('saved');
            $table->text('notes')->nullable();
            $table->timestampTz('follow_up_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status', 'updated_at']);
            $table->index(['user_id', 'applied_at']);
            $table->index(['user_id', 'follow_up_at']);
            $table->index(['company_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
