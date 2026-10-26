<?php

namespace App\Enums;

enum EmailClassification: string
{
    case Accepted = 'accepted';
    case Pending = 'pending';
    case Rejected = 'rejected';
    case InterviewInvitation = 'interview_invitation';

    public function label(): string
    {
        return match ($this) {
            self::Accepted => 'Diterima',
            self::Pending => 'Proses / Pending',
            self::Rejected => 'Ditolak / Rejected',
            self::InterviewInvitation => 'Undangan Interview',
        };
    }
}
