<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/login', 'welcome', ['initialAuthModal' => 'login'])->name('login');
Route::inertia('/register', 'welcome', ['initialAuthModal' => 'register'])->name('register');
