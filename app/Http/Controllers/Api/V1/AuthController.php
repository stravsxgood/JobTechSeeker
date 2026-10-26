<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\DeleteAccountRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\CareerPreference;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'timezone' => $validated['timezone'] ?? 'Asia/Jakarta',
            'locale' => $validated['locale'] ?? 'id-ID',
        ]);

        CareerPreference::create([
            'user_id' => $user->id,
            'target_roles' => [],
            'preferred_locations' => [],
            'weekly_application_target' => 5,
        ]);

        $deviceName = $request->input('device_name', 'web-app');
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'data' => new UserResource($user->load('careerPreference')),
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate an existing user.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        if ($request->hasSession()) {
            Auth::guard('web')->login($user, $request->boolean('remember'));
            $request->session()->regenerate();
        }

        $deviceName = $request->input('device_name', 'web-app');
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'data' => new UserResource($user->load('careerPreference')),
            'token' => $token,
        ], 200);
    }

    /**
     * Get the authenticated user's profile and preferences.
     */
    public function me(Request $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();

        return new UserResource($user->load('careerPreference'));
    }

    /**
     * Update the authenticated user's profile and preferences.
     */
    public function updateProfile(UpdateProfileRequest $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $userUpdate = array_filter([
            'name' => $validated['name'] ?? null,
            'timezone' => $validated['timezone'] ?? null,
            'locale' => $validated['locale'] ?? null,
        ], fn ($val) => ! is_null($val));

        if (! empty($validated['password'])) {
            $userUpdate['password'] = Hash::make($validated['password']);
        }

        if (! empty($userUpdate)) {
            $user->update($userUpdate);
        }

        $prefKeys = [
            'target_roles',
            'preferred_locations',
            'salary_expectation_min',
            'salary_expectation_max',
            'salary_currency',
            'weekly_application_target',
        ];

        $preferenceUpdate = [];
        foreach ($prefKeys as $key) {
            if (array_key_exists($key, $validated)) {
                $preferenceUpdate[$key] = $validated[$key];
            }
        }

        if (! empty($preferenceUpdate)) {
            $user->careerPreference()->updateOrCreate(
                ['user_id' => $user->id],
                $preferenceUpdate,
            );
        }

        return new UserResource($user->fresh()->load('careerPreference'));
    }

    /**
     * Log out the authenticated user.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Revoke current Sanctum token if present
        $user->currentAccessToken()->delete();

        // If session guard is authenticated, invalidate it
        if (Auth::guard('web')->check() && $request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Berhasil logout',
        ], 200);
    }

    /**
     * Delete the authenticated user account and revoke all tokens.
     *
     * @throws ValidationException
     */
    public function deleteAccount(DeleteAccountRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Kata sandi yang Anda masukkan salah.'],
            ]);
        }

        // Revoke all personal access tokens
        $user->tokens()->delete();

        // Disconnect connected email accounts
        $user->connectedEmailAccounts()->update([
            'connection_status' => 'disconnected',
        ]);

        // Invalidate web session if active
        if (Auth::guard('web')->check() && $request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        // Soft delete user record
        $user->delete();

        return response()->json([
            'message' => 'Akun Anda berhasil dihapus beserta seluruh sesi akses.',
        ], 200);
    }
}
