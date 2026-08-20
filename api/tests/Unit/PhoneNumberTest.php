<?php

namespace Tests\Unit;

use App\Domain\Shared\PhoneNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PhoneNumberTest extends TestCase
{
    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function rawNumberProvider(): array
    {
        return [
            'national trunk 0 prefix' => ['099123456', '+59899123456'],
            'already E.164 with spaces' => ['+598 99 123 456', '+59899123456'],
            'bare digits with country code, no plus' => ['59899123456', '+59899123456'],
            'mobile without trunk 0, no country code' => ['99123456', '+59899123456'],
        ];
    }

    #[DataProvider('rawNumberProvider')]
    public function test_normalize_produces_canonical_e164(string $raw, string $expected): void
    {
        $this->assertSame($expected, PhoneNumber::normalize($raw));
    }

    public function test_from_raw_wraps_the_normalized_value(): void
    {
        $phone = PhoneNumber::fromRaw('099123456');

        $this->assertSame('+59899123456', $phone->value);
        $this->assertSame('+59899123456', (string) $phone);
    }
}
