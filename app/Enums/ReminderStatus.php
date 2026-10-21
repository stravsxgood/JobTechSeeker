<?php

namespace App\Enums;

enum ReminderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Sent = 'sent';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
    case Skipped = 'skipped';
}
