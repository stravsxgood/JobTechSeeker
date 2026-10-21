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
        Schema::create('connected_email_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30)->default('gmail');
            $table->string('provider_account_id');
            $table->string('email_address');
            $table->text('access_token_encrypted');
            $table->text('refresh_token_encrypted')->nullable();
            $table->timestampTz('token_expires_at')->nullable();
            $table->jsonb('granted_scopes')->nullable();
            $table->string('gmail_history_id')->nullable();
            $table->timestampTz('watch_expiration_at')->nullable();
            $table->string('connection_status', 30)->default('connected');
            $table->timestampTz('last_sync_at')->nullable();
            $table->string('last_sync_status', 30)->nullable();
            $table->string('last_sync_error_category')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'provider', 'provider_account_id']);
            $table->index(['user_id', 'connection_status']);
            $table->index(['connection_status', 'watch_expiration_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('connected_email_accounts');
    }
};
