<?php

namespace App\Enums;

enum EmailProcessingStatus: string
{
    case Received = 'received';
    case Queued = 'queued';
    case Processing = 'processing';
    case AwaitingReview = 'awaiting_review';
    case Confirmed = 'confirmed';
    case Dismissed = 'dismissed';
    case Processed = 'processed';
    case Ignored = 'ignored';
    case Failed = 'failed';
}
