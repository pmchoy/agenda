<?php

namespace Tests\Feature;

use App\Domain\Scheduling\AppointmentOrigin;
use App\Domain\Scheduling\AppointmentStatus;
use App\Domain\Scheduling\AvailabilityEngine;
use App\Domain\Scheduling\WorkingHoursResolver;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * 2026-08-19 is a Wednesday (ISO weekday 3) — the target date for every case
 * unless a test explicitly needs "today"/"past" semantics.
 */
class AvailabilityEngineTest extends TestCase
{
    use RefreshDatabase;

    private AvailabilityEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->engine = new AvailabilityEngine(new WorkingHoursResolver);
        Setting::create(['key' => 'slot_grid_minutes', 'value' => '15']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-18 08:00:00'));
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    private function makeService(int $durationMinutes = 30): Service
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        return Service::create([
            'service_category_id' => $category->id,
            'name' => 'Cut',
            'duration_minutes' => $durationMinutes,
        ]);
    }

    private function makeProfessional(int $priority = 0): Professional
    {
        return Professional::create(['name' => 'Ana', 'is_active' => true, 'priority' => $priority]);
    }

    public function test_grid_is_anchored_to_midnight_not_window_start(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:07:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);

        $slots = $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-19'));

        $this->assertSame('09:15:00', $slots->first()->startsAt->format('H:i:s'));
    }

    public function test_slot_excluded_when_duration_does_not_fit_before_window_end(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '12:00:00', 'closes_at' => '13:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(45);

        $slots = $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-19'));
        $starts = $slots->map(fn ($slot) => $slot->startsAt->format('H:i:s'))->all();

        // 12:30 would end at 13:15, past the 13:00 window close, and is excluded.
        $this->assertSame(['12:00:00', '12:15:00'], $starts);
    }

    public function test_existing_appointment_excludes_overlapping_slots(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '11:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Carla', 'phone' => '+59899123456']);

        Appointment::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-08-19 09:30:00',
            'ends_at' => '2026-08-19 10:00:00',
            'status' => AppointmentStatus::Scheduled->value,
            'origin' => AppointmentOrigin::Dashboard->value,
        ]);

        $slots = $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-19'));
        $starts = $slots->map(fn ($slot) => $slot->startsAt->format('H:i:s'))->all();

        $this->assertContains('09:00:00', $starts);
        $this->assertNotContains('09:15:00', $starts);
        $this->assertNotContains('09:30:00', $starts);
        $this->assertContains('10:00:00', $starts);
    }

    public function test_cancelled_appointment_frees_the_slot(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '10:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Carla', 'phone' => '+59899123456']);

        Appointment::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-08-19 09:00:00',
            'ends_at' => '2026-08-19 09:30:00',
            'status' => AppointmentStatus::Cancelled->value,
            'origin' => AppointmentOrigin::Dashboard->value,
        ]);

        $slots = $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-19'));
        $starts = $slots->map(fn ($slot) => $slot->startsAt->format('H:i:s'))->all();

        $this->assertContains('09:00:00', $starts);
    }

    public function test_todays_past_slots_are_excluded(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-19 09:20:00'));
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '10:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(15);

        $slots = $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-19'));
        $starts = $slots->map(fn ($slot) => $slot->startsAt->format('H:i:s'))->all();

        $this->assertNotContains('09:00:00', $starts);
        $this->assertNotContains('09:15:00', $starts);
        $this->assertContains('09:30:00', $starts);
    }

    public function test_past_date_returns_no_slots(): void
    {
        BusinessHour::create(['weekday' => 1, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);

        // "now" is frozen to 2026-08-18 (Tuesday); Monday 2026-08-17 is in the past.
        $slots = $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-17'));

        $this->assertCount(0, $slots);
    }

    public function test_engine_issues_exactly_one_appointments_query_per_professional_per_date(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);

        $appointmentQueryCount = 0;
        DB::listen(function ($query) use (&$appointmentQueryCount) {
            if (str_contains($query->sql, 'appointments')) {
                $appointmentQueryCount++;
            }
        });

        $this->engine->forProfessional($service, $professional, CarbonImmutable::parse('2026-08-19'));

        $this->assertSame(1, $appointmentQueryCount);
    }

    public function test_for_any_professional_ties_resolve_by_priority_ascending(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '10:00:00', 'is_closed' => false]);
        $service = $this->makeService(30);
        $lowerPriority = $this->makeProfessional(priority: 2);
        $higherPriority = $this->makeProfessional(priority: 1);
        $lowerPriority->services()->attach($service);
        $higherPriority->services()->attach($service);

        $slots = $this->engine->forAnyProfessional($service, CarbonImmutable::parse('2026-08-19'));

        $this->assertNotEmpty($slots);
        $this->assertTrue($slots->every(fn ($slot) => $slot->professionalId === $higherPriority->id));
    }

    public function test_for_any_professional_ties_resolve_by_id_ascending_when_priority_is_equal(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '10:00:00', 'is_closed' => false]);
        $service = $this->makeService(30);
        $firstCreated = $this->makeProfessional(priority: 1);
        $secondCreated = $this->makeProfessional(priority: 1);
        $firstCreated->services()->attach($service);
        $secondCreated->services()->attach($service);

        $slots = $this->engine->forAnyProfessional($service, CarbonImmutable::parse('2026-08-19'));

        $this->assertNotEmpty($slots);
        $this->assertTrue($slots->every(fn ($slot) => $slot->professionalId === $firstCreated->id));
    }

    public function test_for_any_professional_excludes_unqualified_professionals(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '10:00:00', 'is_closed' => false]);
        $service = $this->makeService(30);
        $qualified = $this->makeProfessional();
        $this->makeProfessional(); // unqualified, never attached to $service
        $qualified->services()->attach($service);

        $slots = $this->engine->forAnyProfessional($service, CarbonImmutable::parse('2026-08-19'));

        $this->assertNotEmpty($slots);
        $this->assertTrue($slots->every(fn ($slot) => $slot->professionalId === $qualified->id));
    }
}
