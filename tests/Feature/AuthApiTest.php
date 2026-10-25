<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can register with valid data and receives token and preferences', function () {
    $response = $this->postJson(route('api.v1.register'), [
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
        'timezone' => 'Asia/Jakarta',
        'locale' => 'id-ID',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'name',
                'email',
                'timezone',
                'locale',
                'career_preference' => [
                    'id',
                    'weekly_application_target',
                ],
            ],
            'token',
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'budi@example.com',
        'name' => 'Budi Santoso',
    ]);

    $user = User::where('email', 'budi@example.com')->first();
    expect($user->careerPreference)->not->toBeNull()
        ->and($user->careerPreference->weekly_application_target)->toBe(5);
});

test('user cannot register with duplicate email or invalid confirmation', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $responseDuplicate = $this->postJson(route('api.v1.register'), [
        'name' => 'New User',
        'email' => 'existing@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $responseDuplicate->assertStatus(422)
        ->assertJsonValidationErrors(['email']);

    $responseMismatch = $this->postJson(route('api.v1.register'), [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'WrongPassword!',
    ]);

    $responseMismatch->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

test('user can login with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'login@example.com',
        'password' => bcrypt('Password123!'),
    ]);

    $response = $this->postJson(route('api.v1.login'), [
        'email' => 'login@example.com',
        'password' => 'Password123!',
        'device_name' => 'test-device',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'email', 'name'],
            'token',
        ]);

    expect($user->tokens)->toHaveCount(1);
});

test('user cannot login with invalid credentials', function () {
    User::factory()->create([
        'email' => 'login@example.com',
        'password' => bcrypt('Password123!'),
    ]);

    $response = $this->postJson(route('api.v1.login'), [
        'email' => 'login@example.com',
        'password' => 'WrongPassword',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('authenticated user can fetch their profile via me endpoint', function () {
    $user = User::factory()->create([
        'name' => 'Profile User',
        'email' => 'profile@example.com',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson(route('api.v1.me'));

    $response->assertStatus(200)
        ->assertJsonPath('data.email', 'profile@example.com')
        ->assertJsonPath('data.name', 'Profile User');
});

test('authenticated user can update profile and career preferences', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'timezone' => 'Asia/Jakarta',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson(route('api.v1.me.update'), [
            'name' => 'New Name',
            'timezone' => 'Asia/Makassar',
            'target_roles' => ['Tech Lead', 'Fullstack Developer'],
            'weekly_application_target' => 10,
            'salary_expectation_min' => 20000000,
            'salary_expectation_max' => 35000000,
            'salary_currency' => 'IDR',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.timezone', 'Asia/Makassar')
        ->assertJsonPath('data.career_preference.weekly_application_target', 10)
        ->assertJsonPath('data.career_preference.target_roles', ['Tech Lead', 'Fullstack Developer']);

    $user->refresh();
    expect($user->name)->toBe('New Name')
        ->and($user->timezone)->toBe('Asia/Makassar')
        ->and($user->careerPreference->weekly_application_target)->toBe(10);
});

test('authenticated user can logout and revoke token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('logout-device');

    $response = $this->withToken($token->plainTextToken)
        ->postJson(route('api.v1.logout'));

    $response->assertStatus(200)
        ->assertJsonPath('message', 'Berhasil logout');

    expect($user->fresh()->tokens)->toHaveCount(0);
});

test('authenticated user can delete account with correct password and tokens are revoked', function () {
    $user = User::factory()->create([
        'password' => bcrypt('SecretPassword123!'),
    ]);
    $token = $user->createToken('delete-test');

    $response = $this->withToken($token->plainTextToken)
        ->deleteJson(route('api.v1.me.delete'), [
            'password' => 'SecretPassword123!',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('message', 'Akun Anda berhasil dihapus beserta seluruh sesi akses.');

    $this->assertSoftDeleted('users', [
        'id' => $user->id,
    ]);

    expect($user->tokens()->count())->toBe(0);
});

test('user cannot delete account with incorrect password', function () {
    $user = User::factory()->create([
        'password' => bcrypt('RealPassword123!'),
    ]);
    $token = $user->createToken('delete-test');

    $response = $this->withToken($token->plainTextToken)
        ->deleteJson(route('api.v1.me.delete'), [
            'password' => 'WrongPassword!',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);

    $this->assertNotSoftDeleted('users', [
        'id' => $user->id,
    ]);
});

test('unauthenticated user cannot access protected endpoints', function () {
    $this->getJson(route('api.v1.me'))->assertStatus(401);
    $this->patchJson(route('api.v1.me.update'), ['name' => 'Hacker'])->assertStatus(401);
    $this->deleteJson(route('api.v1.me.delete'), ['password' => 'Pass'])->assertStatus(401);
    $this->postJson(route('api.v1.logout'))->assertStatus(401);
});
