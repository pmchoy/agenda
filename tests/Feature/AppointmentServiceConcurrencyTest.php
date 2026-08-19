<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Symfony\Component\Process\Process;
use Tests\TestCase;

/**
 * Deliberately does NOT use RefreshDatabase: that trait wraps the test in
 * an uncommitted transaction, which would make the fixture rows invisible
 * to the two independent OS-process DB connections spawned below (each
 * process opens its own real MySQL connection/session). Fixture rows are
 * created with plain Eloquent (auto-committed outside any transaction) and
 * removed in tearDown() to keep `agenda_test` clean for the next run.
 */
class AppointmentServiceConcurrencyTest extends TestCase
{
    private ?Professional $professional = null;

    private ?Service $service = null;

    private ?Client $client = null;

    private ?ServiceCategory $category = null;

    protected function tearDown(): void
    {
        if ($this->professional !== null) {
            Appointment::query()->where('professional_id', $this->professional->id)->delete();
        }

        $this->client?->delete();
        $this->professional?->delete();
        $this->service?->delete();
        $this->category?->delete();
        BusinessHour::query()->where('weekday', 3)->delete();
        Setting::query()->where('key', 'slot_grid_minutes')->delete();

        parent::tearDown();
    }

    public function test_two_overlapping_bookings_for_the_same_professional_only_one_succeeds(): void
    {
        Setting::create(['key' => 'slot_grid_minutes', 'value' => '15']);
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $this->category = ServiceCategory::create(['name' => 'Hair - Concurrency Test']);
        $this->service = Service::create([
            'service_category_id' => $this->category->id,
            'name' => 'Cut - Concurrency Test',
            'duration_minutes' => 30,
        ]);
        $this->professional = Professional::create(['name' => 'Concurrency Test Pro', 'is_active' => true]);
        $this->client = Client::create(['name' => 'Concurrency Test Client', 'phone' => '+59899000111']);

        // 2026-08-19 is a Wednesday (ISO weekday 3), matching the BusinessHour
        // row above. Anchored a year out from "now" so this never drifts into
        // the past regardless of when the suite runs.
        $startsAt = CarbonImmutable::now()->addYear()->next(CarbonInterface::WEDNESDAY)->setTime(10, 0, 0);

        $env = $this->childProcessEnv();
        $worker = base_path('tests/Support/concurrent-booking-worker.php');
        $args = [(string) $this->client->id, (string) $this->service->id, (string) $this->professional->id, $startsAt->toDateTimeString()];

        $processA = new Process(['php', $worker, ...$args], base_path(), $env, null, 30);
        $processB = new Process(['php', $worker, ...$args], base_path(), $env, null, 30);

        $processA->start();
        $processB->start();
        $processA->wait();
        $processB->wait();

        $this->assertTrue($processA->isSuccessful(), 'Process A crashed: '.$processA->getErrorOutput());
        $this->assertTrue($processB->isSuccessful(), 'Process B crashed: '.$processB->getErrorOutput());

        $outputs = [trim($processA->getOutput()), trim($processB->getOutput())];
        sort($outputs);

        $this->assertSame(['booked', 'slot_unavailable'], $outputs);
        $this->assertSame(
            1,
            Appointment::query()
                ->where('professional_id', $this->professional->id)
                ->where('starts_at', $startsAt->toDateTimeString())
                ->count()
        );
    }

    /**
     * @return array<string, string>
     */
    private function childProcessEnv(): array
    {
        $mysql = config('database.connections.mysql');

        return [
            'APP_ENV' => 'testing',
            'DB_CONNECTION' => 'mysql',
            'DB_DATABASE' => (string) $mysql['database'],
            'DB_HOST' => (string) $mysql['host'],
            'DB_PORT' => (string) $mysql['port'],
            'DB_USERNAME' => (string) $mysql['username'],
            'DB_PASSWORD' => (string) $mysql['password'],
        ];
    }
}
