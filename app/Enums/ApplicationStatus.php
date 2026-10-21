<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Saved = 'saved';
    case Applied = 'applied';
    case Screening = 'screening';
    case Assessment = 'assessment';
    case Interview = 'interview';
    case Offer = 'offer';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';

    /**
     * Check if the application is currently active.
     */
    public function isActive(): bool
    {
        return in_array($this, [
            self::Applied,
            self::Screening,
            self::Assessment,
            self::Interview,
        ], true);
    }

    /**
     * Check if the status is a terminal state.
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::Rejected, self::Withdrawn], true);
    }

    /**
     * Human readable label in Indonesian.
     */
    public function label(): string
    {
        return match ($this) {
            self::Saved => 'Disimpan',
            self::Applied => 'Dilamar',
            self::Screening => 'Screening',
            self::Assessment => 'Assessment',
            self::Interview => 'Interview',
            self::Offer => 'Tawaran (Offer)',
            self::Rejected => 'Ditolak',
            self::Withdrawn => 'Ditarik',
        };
    }
}
