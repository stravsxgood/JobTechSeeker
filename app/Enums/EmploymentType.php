<?php

namespace App\Enums;

enum EmploymentType: string
{
    case FullTime = 'full_time';
    case PartTime = 'part_time';
    case Contract = 'contract';
    case Internship = 'internship';
    case Freelance = 'freelance';
    case Temporary = 'temporary';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::FullTime => 'Penuh Waktu (Full Time)',
            self::PartTime => 'Paruh Waktu (Part Time)',
            self::Contract => 'Kontrak',
            self::Internship => 'Magang (Internship)',
            self::Freelance => 'Lepas (Freelance)',
            self::Temporary => 'Sementara',
            self::Other => 'Lainnya',
        };
    }
}
