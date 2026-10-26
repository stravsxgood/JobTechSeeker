<?php

namespace App\Services\Gmail;

use App\Enums\ConnectionStatus;
use App\Enums\EmailProcessingStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\EmailEvent;
use App\Models\JobApplication;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GmailSyncService
{
    public function __construct(
        protected GmailOAuthService $oauthService
    ) {}

    /**
     * Sync recent recruitment emails from Gmail.
     *
     * @return array{synced_count: int, new_events_count: int, status: string}
     */
    public function sync(ConnectedEmailAccount $account): array
    {
        if ($account->connection_status !== ConnectionStatus::Connected) {
            return [
                'synced_count' => 0,
                'new_events_count' => 0,
                'status' => 'skipped_disconnected',
            ];
        }

        try {
            $accessToken = $this->oauthService->getValidAccessToken($account);

            // Search query for recruitment and job application related messages
            $query = 'interview OR lamaran OR application OR hiring OR offer OR assessment OR "jadwal wawancara" OR "terima kasih telah melamar"';

            $listResponse = Http::withToken($accessToken)
                ->get('https://gmail.googleapis.com/gmail/v1/users/me/messages', [
                    'q' => $query,
                    'maxResults' => 25,
                ]);

            if (! $listResponse->successful()) {
                $account->update([
                    'last_sync_status' => 'failed',
                    'last_sync_error_category' => 'api_error_'.$listResponse->status(),
                ]);

                return [
                    'synced_count' => 0,
                    'new_events_count' => 0,
                    'status' => 'failed',
                ];
            }

            $messages = $listResponse->json('messages') ?? [];
            $newEventsCount = 0;

            foreach ($messages as $msgItem) {
                $msgId = (string) $msgItem['id'];
                $threadId = isset($msgItem['threadId']) ? (string) $msgItem['threadId'] : null;

                // Check if already processed
                $exists = EmailEvent::where('connected_email_account_id', $account->id)
                    ->where('provider_message_id', $msgId)
                    ->exists();

                if ($exists) {
                    continue;
                }

                // Fetch message detail (format=metadata minimizes bandwidth and PII exposure)
                $msgResponse = Http::withToken($accessToken)
                    ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$msgId}", [
                        'format' => 'metadata',
                        'metadataHeaders' => ['From', 'Subject', 'Date'],
                    ]);

                if (! $msgResponse->successful()) {
                    continue;
                }

                $msgData = $msgResponse->json();
                $headers = $this->parseHeaders($msgData['payload']['headers'] ?? []);

                $senderRaw = $headers['from'] ?? '';
                $subject = $headers['subject'] ?? '(Tanpa Subjek)';
                $dateStr = $headers['date'] ?? null;
                $snippet = $msgData['snippet'] ?? '';

                $parsedSender = $this->parseSender($senderRaw);

                // Attempt to match with an existing user application
                $matchedApplicationId = $this->matchApplication($account->user_id, $parsedSender['name'], $parsedSender['address'], $subject);

                EmailEvent::create([
                    'id' => (string) Str::uuid(),
                    'connected_email_account_id' => $account->id,
                    'provider_message_id' => $msgId,
                    'provider_thread_id' => $threadId,
                    'received_at' => $dateStr ? Carbon::parse($dateStr) : now(),
                    'sender_address' => $parsedSender['address'],
                    'sender_name' => $parsedSender['name'],
                    'subject' => $subject,
                    'snippet' => $snippet,
                    'classification' => null, // To be classified by EmailTriageAgent
                    'extracted_payload' => null,
                    'related_application_id' => $matchedApplicationId,
                    'processing_status' => EmailProcessingStatus::AwaitingReview,
                    'requires_confirmation' => true,
                ]);

                $newEventsCount++;
            }

            $account->update([
                'last_sync_at' => now(),
                'last_sync_status' => 'success',
                'last_sync_error_category' => null,
            ]);

            return [
                'synced_count' => count($messages),
                'new_events_count' => $newEventsCount,
                'status' => 'success',
            ];
        } catch (Exception $e) {
            $account->update([
                'last_sync_status' => 'failed',
                'last_sync_error_category' => 'exception',
            ]);

            return [
                'synced_count' => 0,
                'new_events_count' => 0,
                'status' => 'error: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Parse header list into key-value map.
     *
     * @param  array<int, array{name: string, value: string}>  $headers
     * @return array<string, string>
     */
    protected function parseHeaders(array $headers): array
    {
        $result = [];
        foreach ($headers as $header) {
            $key = strtolower($header['name']);
            $result[$key] = $header['value'];
        }

        return $result;
    }

    /**
     * Parse sender name and email from 'From' header string.
     *
     * @return array{name: string, address: string}
     */
    protected function parseSender(string $fromHeader): array
    {
        if (preg_match('/^(.*?)\s*<([^>]+)>$/', $fromHeader, $matches)) {
            return [
                'name' => trim(trim($matches[1]), '"\''),
                'address' => trim($matches[2]),
            ];
        }

        return [
            'name' => $fromHeader,
            'address' => $fromHeader,
        ];
    }

    /**
     * Match email against existing user applications by company name or sender domain.
     */
    protected function matchApplication(int $userId, string $senderName, string $senderEmail, string $subject): ?string
    {
        /** @var JobApplication|null $app */
        $app = JobApplication::where('user_id', $userId)
            ->whereHas('company', function ($q) use ($senderName, $subject) {
                $q->where(function ($subQ) use ($senderName, $subject) {
                    if (! empty($senderName)) {
                        $subQ->where('name', 'like', "%{$senderName}%");
                    }
                    if (! empty($subject)) {
                        $subQ->orWhereRaw('LOWER(?) LIKE '."'%' || LOWER(name) || '%'", [$subject]);
                    }
                });
            })
            ->latest('updated_at')
            ->first();

        return $app?->id;
    }
}
