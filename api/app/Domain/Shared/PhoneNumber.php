<?php

namespace App\Domain\Shared;

/**
 * Canonical E.164 phone number for Uruguay (`+598`), stored with the
 * leading `+`. Normalization rules:
 * 1. If the raw value already carries a leading `+`, keep every digit as-is.
 * 2. Otherwise strip non-digit characters; if the digits already start with
 *    the `598` country code, prefix `+`.
 * 3. Otherwise drop a leading national trunk `0` (if present), then prefix
 *    `+598`.
 */
final readonly class PhoneNumber
{
    private function __construct(public string $value) {}

    public static function fromRaw(string $raw): self
    {
        return new self(self::normalize($raw));
    }

    public static function normalize(string $raw): string
    {
        $hasLeadingPlus = str_starts_with(trim($raw), '+');
        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        if ($hasLeadingPlus) {
            return '+'.$digits;
        }

        if (str_starts_with($digits, '598')) {
            return '+'.$digits;
        }

        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        return '+598'.$digits;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
