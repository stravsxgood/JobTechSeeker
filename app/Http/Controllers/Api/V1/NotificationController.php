<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    /**
     * Display a listing of in-app notifications for the user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $query = $user->notifications();

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return NotificationResource::collection($query->paginate($perPage));
    }

    /**
     * Get the count of unread notifications for notification badges.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $unreadCount = $user->notifications()->whereNull('read_at')->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Notification $notification */
        $notification = $user->notifications()->where('id', $id)->firstOrFail();

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca',
            'data' => new NotificationResource($notification->fresh()),
        ]);
    }

    /**
     * Mark all unread notifications as read for the user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $updatedCount = $user->notifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Semua notifikasi berhasil ditandai sudah dibaca',
            'marked_count' => $updatedCount,
        ]);
    }

    /**
     * Remove the specified notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Notification $notification */
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->delete();

        return response()->json([
            'message' => 'Notifikasi berhasil dihapus',
        ]);
    }
}
