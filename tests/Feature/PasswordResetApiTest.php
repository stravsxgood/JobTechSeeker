<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

test('user can request password reset link and notification is sent', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'seeker@example.com',
    ]);

    $response = $this->postJson(route('api.v1.password.email'), [
        'email' => 'seeker@example.com',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Jika alamat email terdaftar, tautan pemulihan kata sandi telah dikirimkan ke email Anda.',
        ]);

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

test('forgot password returns same success message for non-existent email to prevent enumeration', function () {
    Notification::fake();

    $response = $this->postJson(route('api.v1.password.email'), [
        'email' => 'unknown@example.com',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Jika alamat email terdaftar, tautan pemulihan kata sandi telah dikirimkan ke email Anda.',
        ]);

    Notification::assertNothingSent();
});

test('forgot password validates required and format of email', function () {
    $response = $this->postJson(route('api.v1.password.email'), [
        'email' => 'not-an-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('user can reset password with valid token and existing tokens are revoked', function () {
    $user = User::factory()->create([
        'email' => 'seeker@example.com',
        'password' => Hash::make('OldPassword123!'),
    ]);

    // Create an existing personal access token
    $existingToken = $user->createToken('old-device')->plainTextToken;
    expect($user->tokens()->count())->toBe(1);

    $token = Password::broker()->createToken($user);

    $response = $this->postJson(route('api.v1.password.reset'), [
        'token' => $token,
        'email' => 'seeker@example.com',
        'password' => 'NewSecurePassword123!',
        'password_confirmation' => 'NewSecurePassword123!',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Kata sandi berhasil direset. Silakan login kembali dengan kata sandi baru Anda.',
        ]);

    // Verify password updated in DB
    $user->refresh();
    expect(Hash::check('NewSecurePassword123!', $user->password))->toBeTrue()
        ->and(Hash::check('OldPassword123!', $user->password))->toBeFalse();

    // Verify existing tokens revoked
    expect($user->tokens()->count())->toBe(0);

    // Verify user can now login with new password
    $loginResponse = $this->postJson(route('api.v1.login'), [
        'email' => 'seeker@example.com',
        'password' => 'NewSecurePassword123!',
    ]);
    $loginResponse->assertStatus(200);
});

test('reset password fails with invalid token', function () {
    $user = User::factory()->create([
        'email' => 'seeker@example.com',
    ]);

    $response = $this->postJson(route('api.v1.password.reset'), [
        'token' => 'invalid-token-string',
        'email' => 'seeker@example.com',
        'password' => 'NewSecurePassword123!',
        'password_confirmation' => 'NewSecurePassword123!',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('reset password validates password complexity and confirmation', function () {
    $response = $this->postJson(route('api.v1.password.reset'), [
        'token' => 'some-token',
        'email' => 'seeker@example.com',
        'password' => 'weak',
        'password_confirmation' => 'mismatch',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});
