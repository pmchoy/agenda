<?php

namespace Tests\Feature\Api\V1;

use App\Domain\Scheduling\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 2026-08-19 is a Wednesday (ISO weekday 3); its Monday-first week is
 * 2026-08-17 .. 2026-08-23 — the same example used in the design addendum.
 */
class AgendaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-19 08:00:00'));
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    private function makeAppointment(string $startsAt, AppointmentStatus $status = AppointmentStatus::Scheduled): Appointment
    {
        $unique = random_int(100000, 999999);
        $professional = Professional::create(['name' => 'Ana '.$unique, 'is_active' => true, 'priority' => 0]);
        $service = Service::create([
            'service_category_id' => ServiceCategory::create(['name' => 'Hair '.$unique])->id,
            'name' => 'Cut',
            'duration_minutes' => 30,
        ]);
        $client = Client::create(['name' => 'Lucía', 'phone' => '+598991'.$unique]);

        return Appointment::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => CarbonImmutable::parse($startsAt),
            'ends_at' => CarbonImmutable::parse($startsAt)->addMinutes(30),
            'status' => $status,
            'origin' => 'dashboard',
        ]);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/agenda?view=day&date=2026-08-19')->assertStatus(401);
    }

    public function test_weekly_agenda_is_monday_first_and_includes_empty_days(): void
    {
        $this->makeAppointment('2026-08-19 09:00:00');

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/agenda?view=week&date=2026-08-19');

        $response->assertStatus(200)
            ->assertJsonPath('meta.from', '2026-08-17')
            ->assertJsonPath('meta.to', '2026-08-23')
            ->assertJsonPath('meta.days', [
                '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20',
                '2026-08-21', '2026-08-22', '2026-08-23',
            ])
            ->assertJsonCount(1, 'data.2026-08-19')
            ->assertJsonCount(0, 'data.2026-08-17')
            ->assertJsonCount(0, 'data.2026-08-23');
    }

    public function test_daily_agenda_returns_only_that_day(): void
    {
        $this->makeAppointment('2026-08-19 09:00:00');
        $this->makeAppointment('2026-08-20 09:00:00');

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/agenda?view=day&date=2026-08-19');

        $response->assertStatus(200)
            ->assertJsonPath('meta.days', ['2026-08-19'])
            ->assertJsonCount(1, 'data.2026-08-19');
    }

    public function test_cancelled_appointments_are_excluded_from_the_agenda_by_default(): void
    {
        $this->makeAppointment('2026-08-19 09:00:00', AppointmentStatus::Cancelled);

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/agenda?view=day&date=2026-08-19');

        $response->assertStatus(200)->assertJsonCount(0, 'data.2026-08-19');
    }

    public function test_cancelled_appointments_are_included_when_requested(): void
    {
        $this->makeAppointment('2026-08-19 09:00:00', AppointmentStatus::Cancelled);

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/agenda?view=day&date=2026-08-19&include_cancelled=1');

        $response->assertStatus(200)->assertJsonCount(1, 'data.2026-08-19');
    }
}
