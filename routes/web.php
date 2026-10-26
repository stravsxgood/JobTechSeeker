<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/login', 'welcome', ['initialAuthModal' => 'login'])->name('login');
Route::inertia('/register', 'welcome', ['initialAuthModal' => 'register'])->name('register');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/applications', function () {
        return Inertia::render('applications/index', ['initialView' => 'list']);
    })->name('applications');

    Route::get('/kanban', function () {
        return Inertia::render('applications/index', ['initialView' => 'kanban']);
    })->name('kanban');

    Route::get('/interviews', function () {
        return Inertia::render('interviews/index');
    })->name('interviews');

    Route::get('/notifications', function () {
        return Inertia::render('notifications/index');
    })->name('notifications');

    Route::get('/ai/career-planner', function () {
        return Inertia::render('ai/career-planner');
    })->name('ai.career-planner');

    Route::get('/ai/interview-copilot', function () {
        return Inertia::render('ai/interview-copilot');
    })->name('ai.interview-copilot');

    Route::get('/analytics', function () {
        return Inertia::render('analytics/index');
    })->name('analytics');

    Route::get('/integrations', function () {
        return Inertia::render('integrations/index');
    })->name('integrations');

    Route::get('/settings', function () {
        return Inertia::render('settings/index');
    })->name('settings');

    Route::post('/logout', function (Request $request) {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    })->name('logout');
});
