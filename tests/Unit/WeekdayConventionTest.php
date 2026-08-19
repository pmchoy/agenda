<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Permanent guard rail (per design.md): the app must obtain Monday-start/
 * Sunday-end week bounds exclusively from `Weekday::weekRange()`. Calling
 * Carbon's `startOfWeek()`/`dayOfWeek()` directly anywhere under `app/` is
 * forbidden — this test scans every `.php` file under `app/` for those
 * literals and fails the suite on a hit. Convention notes rot; a failing
 * test does not.
 */
class WeekdayConventionTest extends TestCase
{
    private const FORBIDDEN_LITERALS = ['dayOfWeek', 'startOfWeek'];

    public function test_app_directory_never_uses_forbidden_weekday_literals(): void
    {
        $violations = $this->scanForForbiddenLiterals(dirname(__DIR__, 2).'/app');

        $this->assertSame(
            [],
            $violations,
            "Forbidden weekday literal(s) found. Use Weekday::fromDate()/weekRange() instead:\n"
                .implode("\n", $violations),
        );
    }

    public function test_the_scanner_actually_detects_a_forbidden_literal(): void
    {
        $fixtureDir = sys_get_temp_dir().'/weekday-convention-fixture-'.uniqid();
        mkdir($fixtureDir);
        file_put_contents($fixtureDir.'/Offender.php', "<?php\n\$x = now()->startOfWeek();\n");

        try {
            $violations = $this->scanForForbiddenLiterals($fixtureDir);

            $this->assertNotSame([], $violations);
            $this->assertStringContainsString('Offender.php', $violations[0]);
        } finally {
            unlink($fixtureDir.'/Offender.php');
            rmdir($fixtureDir);
        }
    }

    /**
     * @return list<string>
     */
    private function scanForForbiddenLiterals(string $directory): array
    {
        $violations = [];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $contents = file_get_contents($file->getPathname());

            if ($contents === false) {
                continue;
            }

            foreach (self::FORBIDDEN_LITERALS as $literal) {
                if (str_contains($contents, $literal)) {
                    $violations[] = $file->getPathname().' contains forbidden literal "'.$literal.'"';
                }
            }
        }

        return $violations;
    }
}
