<?php

namespace App\Enums;

enum EmailClassification: string
{
    case InterviewInvitation = 'interview_invitation';
    case InterviewReschedule = 'interview_reschedule';
    case DocumentRequest = 'document_request';
    case ApplicationReceived = 'application_received';
    case Rejection = 'rejection';
    case Offer = 'offer';
    case FollowUp = 'follow_up';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::InterviewInvitation => 'Undangan Interview',
            self::InterviewReschedule => 'Perubahan Jadwal Interview',
            self::DocumentRequest => 'Permintaan Dokumen',
            self::ApplicationReceived => 'Konfirmasi Lamaran Diterima',
            self::Rejection => 'Pemberitahuan Penolakan',
            self::Offer => 'Penawaran Kerja (Offer)',
            self::FollowUp => 'Follow Up',
            self::Other => 'Lainnya',
        };
    }
}
