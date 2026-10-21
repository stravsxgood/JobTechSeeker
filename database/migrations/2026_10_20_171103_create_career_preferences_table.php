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
        Schema::create('career_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->jsonb('target_roles')->nullable();
            $table->jsonb('preferred_locations')->nullable();
            $table->decimal('salary_expectation_min', 12, 2)->nullable();
            $table->decimal('salary_expectation_max', 12, 2)->nullable();
            $table->string('salary_currency', 3)->nullable()->default('IDR');
            $table->unsignedSmallInteger('weekly_application_target')->nullable()->default(5);
            $table->jsonb('work_types')->nullable();
            $table->jsonb('preferences')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_preferences');
    }
};
