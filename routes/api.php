<?php

use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\EmailAccountController;
use App\Http\Controllers\Api\V1\EmailEventController;
use App\Http\Controllers\Api\V1\InterviewController;
use App\Http\Controllers\Api\V1\JobApplicationController;
use App\Http\Controllers\Api\V1\NotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public authentication routes (rate limited)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('api.v1.register');
        Route::post('/login', [AuthController::class, 'login'])->name('api.v1.login');
    });

    // Authenticated user profile routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('api.v1.me');
        Route::patch('/me', [AuthController::class, 'updateProfile'])->name('api.v1.me.update');
        Route::delete('/me', [AuthController::class, 'deleteAccount'])->name('api.v1.me.delete');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.v1.logout');

        // Dashboard & Analytics
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.v1.dashboard');
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('api.v1.analytics');

        // Job Applications CRUD & Status Workflow
        Route::get('/applications/check-duplicate', [JobApplicationController::class, 'duplicateCheck'])->name('api.v1.applications.check-duplicate');
        Route::get('/applications', [JobApplicationController::class, 'index'])->name('api.v1.applications.index');
        Route::post('/applications', [JobApplicationController::class, 'store'])->name('api.v1.applications.store');
        Route::get('/applications/{application}', [JobApplicationController::class, 'show'])->name('api.v1.applications.show');
        Route::patch('/applications/{application}', [JobApplicationController::class, 'update'])->name('api.v1.applications.update');
        Route::delete('/applications/{application}', [JobApplicationController::class, 'destroy'])->name('api.v1.applications.destroy');
        Route::post('/applications/{application}/status', [JobApplicationController::class, 'changeStatus'])->name('api.v1.applications.status');

        // Interviews CRUD & Calendar
        Route::get('/interviews', [InterviewController::class, 'index'])->name('api.v1.interviews.index');
        Route::post('/interviews', [InterviewController::class, 'store'])->name('api.v1.interviews.store');
        Route::get('/interviews/{interview}', [InterviewController::class, 'show'])->name('api.v1.interviews.show');
        Route::patch('/interviews/{interview}', [InterviewController::class, 'update'])->name('api.v1.interviews.update');
        Route::delete('/interviews/{interview}', [InterviewController::class, 'destroy'])->name('api.v1.interviews.destroy');

        // Notifications Center
        Route::get('/notifications', [NotificationController::class, 'index'])->name('api.v1.notifications.index');
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('api.v1.notifications.unread-count');
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('api.v1.notifications.read');
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('api.v1.notifications.mark-all-read');
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('api.v1.notifications.destroy');

        // Gmail Integration & Connected Email Accounts
        Route::get('/email/accounts', [EmailAccountController::class, 'index'])->name('api.v1.email.accounts.index');
        Route::get('/email/oauth/google/url', [EmailAccountController::class, 'getAuthUrl'])->name('api.v1.email.oauth.google.url');
        Route::post('/email/oauth/google/callback', [EmailAccountController::class, 'handleCallback'])->name('api.v1.email.oauth.google.callback');
        Route::post('/email/accounts/{id}/disconnect', [EmailAccountController::class, 'disconnect'])->name('api.v1.email.accounts.disconnect');

        // Email Events & Review Workflow
        Route::get('/email/events', [EmailEventController::class, 'index'])->name('api.v1.email.events.index');
        Route::post('/email/events/simulate', [EmailEventController::class, 'simulate'])->name('api.v1.email.events.simulate');
        Route::post('/email/events/{id}/confirm', [EmailEventController::class, 'confirm'])->name('api.v1.email.events.confirm');
        Route::post('/email/events/{id}/dismiss', [EmailEventController::class, 'dismiss'])->name('api.v1.email.events.dismiss');

        // Rate-limited resource-intensive operations (AI generation and external email sync)
        Route::middleware('throttle:20,1')->group(function () {
            Route::post('/applications/{application}/check-stagnant', [JobApplicationController::class, 'checkStagnant'])->name('api.v1.applications.check-stagnant');
            Route::post('/email/accounts/{id}/sync', [EmailAccountController::class, 'sync'])->name('api.v1.email.accounts.sync');
            Route::post('/email/events/{id}/triage', [EmailEventController::class, 'triage'])->name('api.v1.email.events.triage');
            Route::post('/ai/career-plan', [AiController::class, 'careerPlan'])->name('api.v1.ai.career-plan');
            Route::post('/ai/interview-preparation', [AiController::class, 'interviewPreparation'])->name('api.v1.ai.interview-preparation');
        });
    });
});
