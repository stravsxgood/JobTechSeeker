<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ConnectedEmailAccountResource;
use App\Models\ConnectedEmailAccount;
use App\Models\User;
use App\Services\Gmail\GmailOAuthService;
use App\Services\Gmail\GmailSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailAccountController extends Controller
{
    /**
     * List all connected email accounts for the authenticated user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $accounts = $user->connectedEmailAccounts()->orderBy('created_at', 'desc')->get();

        return ConnectedEmailAccountResource::collection($accounts);
    }

    /**
     * Get the Google OAuth authorization URL.
     */
    public function getAuthUrl(Request $request, GmailOAuthService $oauthService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $url = $oauthService->getAuthorizationUrl($user);

        return response()->json([
            'url' => $url,
        ]);
    }

    /**
     * Handle the OAuth callback code exchange.
     */
    public function handleCallback(Request $request, GmailOAuthService $oauthService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'code' => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);

        $account = $oauthService->handleCallback($validated['code'], $validated['state'], $user);

        return response()->json([
            'message' => 'Akun Gmail berhasil dihubungkan',
            'data' => new ConnectedEmailAccountResource($account),
        ], 201);
    }

    /**
     * Disconnect a connected email account.
     */
    public function disconnect(Request $request, string $id, GmailOAuthService $oauthService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var ConnectedEmailAccount $account */
        $account = $user->connectedEmailAccounts()->where('id', $id)->firstOrFail();

        $oauthService->disconnect($account);

        return response()->json([
            'message' => 'Koneksi akun email berhasil diputuskan',
            'data' => new ConnectedEmailAccountResource($account->fresh()),
        ]);
    }

    /**
     * Manually trigger an incremental sync for a connected email account.
     */
    public function sync(Request $request, string $id, GmailSyncService $syncService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var ConnectedEmailAccount $account */
        $account = $user->connectedEmailAccounts()->where('id', $id)->firstOrFail();

        $results = $syncService->sync($account);

        return response()->json([
            'message' => 'Sinkronisasi email berhasil dijalankan',
            'results' => $results,
            'account' => new ConnectedEmailAccountResource($account->fresh()),
        ]);
    }
}
