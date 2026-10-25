<?php

namespace App\Services\Gmail;

use App\Enums\ConnectionStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\User;
use Carbon\CarbonImmutable;
use Exception;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GmailOAuthService
{
    protected string $clientId;

    protected string $clientSecret;

    protected string $redirectUri;

    public function __construct()
    {
        $this->clientId = (string) config('services.google.client_id', '');
        $this->clientSecret = (string) config('services.google.client_secret', '');
        $this->redirectUri = (string) config('services.google.redirect_uri', '');
    }

    /**
     * Generate the Google OAuth authorization URL with minimal read-only scope.
     */
    public function getAuthorizationUrl(User $user): string
    {
        $statePayload = json_encode([
            'user_id' => $user->id,
            'timestamp' => now()->timestamp,
            'random' => Str::random(16),
        ]);

        $state = Crypt::encryptString($statePayload ?: '');

        $scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ];

        $params = http_build_query([
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ]);

        return "https://accounts.google.com/o/oauth2/v2/auth?{$params}";
    }

    /**
     * Handle the OAuth callback, exchange authorization code for tokens, and store account.
     *
     * @throws ValidationException
     */
    public function handleCallback(string $code, string $state, User $user): ConnectedEmailAccount
    {
        $this->validateState($state, $user);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri,
        ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'code' => ['Gagal menukarkan kode otorisasi dengan token Google: '.$response->body()],
            ]);
        }

        $tokenData = $response->json();
        $accessToken = (string) ($tokenData['access_token'] ?? '');
        $refreshToken = isset($tokenData['refresh_token']) ? (string) $tokenData['refresh_token'] : null;
        $expiresIn = (int) ($tokenData['expires_in'] ?? 3600);
        $grantedScopes = explode(' ', (string) ($tokenData['scope'] ?? ''));

        // Fetch user profile from Google to get provider account ID and email address
        $userinfoResponse = Http::withToken($accessToken)
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (! $userinfoResponse->successful()) {
            throw ValidationException::withMessages([
                'oauth' => ['Gagal mengambil profil akun Google.'],
            ]);
        }

        $userinfo = $userinfoResponse->json();
        $providerAccountId = (string) ($userinfo['sub'] ?? '');
        $emailAddress = (string) ($userinfo['email'] ?? '');

        // Encrypt tokens before saving
        $accessTokenEncrypted = Crypt::encryptString($accessToken);
        $refreshTokenEncrypted = $refreshToken ? Crypt::encryptString($refreshToken) : null;

        $tokenExpiresAt = CarbonImmutable::now()->addSeconds($expiresIn);

        /** @var ConnectedEmailAccount $account */
        $account = ConnectedEmailAccount::updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => 'gmail',
                'provider_account_id' => $providerAccountId,
            ],
            [
                'id' => (string) Str::uuid(),
                'email_address' => $emailAddress,
                'access_token_encrypted' => $accessTokenEncrypted,
                'refresh_token_encrypted' => $refreshTokenEncrypted,
                'token_expires_at' => $tokenExpiresAt,
                'granted_scopes' => $grantedScopes,
                'connection_status' => ConnectionStatus::Connected,
                'last_sync_status' => null,
                'last_sync_error_category' => null,
            ]
        );

        return $account;
    }

    /**
     * Get a valid decrypted access token, automatically refreshing if expired.
     */
    public function getValidAccessToken(ConnectedEmailAccount $account): string
    {
        // If expired or expiring within 60 seconds, refresh it
        if ($account->token_expires_at && $account->token_expires_at->isPast()) {
            return $this->refreshAccessToken($account);
        }

        return Crypt::decryptString($account->access_token_encrypted);
    }

    /**
     * Refresh access token using the stored refresh token.
     *
     * @throws Exception
     */
    public function refreshAccessToken(ConnectedEmailAccount $account): string
    {
        if (! $account->refresh_token_encrypted) {
            $account->update(['connection_status' => ConnectionStatus::ReauthorizationRequired]);
            throw new Exception('Refresh token tidak tersedia. Pengguna perlu mengotorisasi ulang akun Gmail.');
        }

        $refreshToken = Crypt::decryptString($account->refresh_token_encrypted);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful()) {
            $account->update([
                'connection_status' => ConnectionStatus::ReauthorizationRequired,
                'last_sync_error_category' => 'token_refresh_failed',
            ]);
            throw new Exception('Gagal memperbarui token akses Google: '.$response->body());
        }

        $data = $response->json();
        $newAccessToken = (string) $data['access_token'];
        $expiresIn = (int) ($data['expires_in'] ?? 3600);

        $updateData = [
            'access_token_encrypted' => Crypt::encryptString($newAccessToken),
            'token_expires_at' => CarbonImmutable::now()->addSeconds($expiresIn),
            'connection_status' => ConnectionStatus::Connected,
        ];

        // In case Google returned a new refresh token
        if (isset($data['refresh_token'])) {
            $updateData['refresh_token_encrypted'] = Crypt::encryptString((string) $data['refresh_token']);
        }

        $account->update($updateData);

        return $newAccessToken;
    }

    /**
     * Disconnect the email account.
     */
    public function disconnect(ConnectedEmailAccount $account): void
    {
        $account->update([
            'connection_status' => ConnectionStatus::Disconnected,
        ]);
    }

    /**
     * Validate the state token to prevent CSRF and cross-user hijacking.
     *
     * @throws ValidationException
     */
    protected function validateState(string $state, User $user): void
    {
        try {
            $decrypted = Crypt::decryptString($state);
            $data = json_decode($decrypted, true);

            if (! is_array($data) || ($data['user_id'] ?? null) !== $user->id) {
                throw new Exception('Invalid state payload');
            }

            // Ensure state is not older than 15 minutes
            $timestamp = (int) ($data['timestamp'] ?? 0);
            if ((now()->getTimestamp() - $timestamp) > 900) {
                throw new Exception('State token expired');
            }
        } catch (Exception) {
            throw ValidationException::withMessages([
                'state' => ['State otorisasi tidak valid atau sudah kedaluwarsa. Silakan ulangi proses koneksi.'],
            ]);
        }
    }
}
