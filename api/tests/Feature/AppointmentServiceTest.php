<?php

namespace Tests\Feature;

use App\Domain\Scheduling\AppointmentService;
use App\Domain\Scheduling\AppointmentStatus;
use App\Domain\Scheduling\Data\BookingRequest;
use App\Domain\Scheduling\Exceptions\InvalidStatusTransitionException;
use App\Domain\Scheduling\Exceptions\OutsideWorkingHoursException;
use App\Domain\Scheduling\Exceptions\SlotUnavailableException;
use App\Domain\Scheduling\WorkingHoursResolver;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 2026-08-19 is a Wednesday (ISO weekday 3) — the target date for every case.
 *
 * Not explicitly named in the tasks artifact (which only calls out the
 * concurrency test as RED for Phase 3), but book()/reschedule()/cancel()/
 * transition() are new production code and Strict TDD forbids writing it
 * without a failing test first — this file covers the non-concurrency
 * scenarios from the appointment-booking spec.
 */
class AppointmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppointmentService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AppointmentService(new WorkingHoursResolver);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-18 08:00:00'));
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    /**
     * @return array{0: Service, 1: Professional, 2: Client}
     */
    private function makeCatalog(int $durationMinutes = 30): array
    {
        $category = ServiceCategory::create(['name' => 'Hair']);
        $service = Service::create(['service_category_id' => $category->id, 'name' => 'Cut', 'duration_minutes' => $durationMinutes]);
        $professional = Professional::create(['name' => 'Ana', 'is_active' => true]);
        $client = Client::create(['name' => 'Carla', 'phone' => '+59899123456']);

        return [$service, $professional, $client];
    }

    public function test_book_persists_appointment_with_snapshot_ends_at(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);

        $appointment = $this->service->book(new BookingRequest(
            clientId: $client->id,
            serviceId: $service->id,
            professionalId: $professional->id,
            startsAt: CarbonImmutable::parse('2026-08-19 09:00:00'),
        ));

        $this->assertSame('2026-08-19 09:00:00', $appointment->starts_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-08-19 09:30:00', $appointment->ends_at->format('Y-m-d H:i:s'));
        $this->assertSame(AppointmentStatus::Scheduled, $appointment->status);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_book_rejects_overlap_with_existing_appointment(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);
        $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));

        try {
            $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:15:00')));
            $this->fail('Expected SlotUnavailableException.');
        } catch (SlotUnavailableException) {
            // expected
        }

        $this->assertSame(1, Appointment::query()->count());
    }

    public function test_book_rejects_time_outside_working_hours(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);

        $this->expectException(OutsideWorkingHoursException::class);

        $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 17:45:00')));
    }

    public function test_book_rejects_past_start_time(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);

        $this->expectException(SlotUnavailableException::class);

        $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-17 09:00:00')));
    }

    public function test_reschedule_updates_the_same_row_in_place(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);
        $appointment = $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));

        $rescheduled = $this->service->reschedule($appointment, CarbonImmutable::parse('2026-08-19 10:00:00'));

        $this->assertSame($appointment->id, $rescheduled->id);
        $this->assertSame('2026-08-19 10:00:00', $rescheduled->starts_at->format('Y-m-d H:i:s'));
        $this->assertSame(1, Appointment::query()->count());
    }

    public function test_reschedule_into_conflicting_slot_is_rejected_and_original_time_is_kept(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);
        $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 10:00:00')));
        $target = $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));

        try {
            $this->service->reschedule($target, CarbonImmutable::parse('2026-08-19 10:15:00'));
            $this->fail('Expected SlotUnavailableException.');
        } catch (SlotUnavailableException) {
            // expected
        }

        $this->assertSame('2026-08-19 09:00:00', $target->fresh()->starts_at->format('Y-m-d H:i:s'));
    }

    public function test_cancel_frees_the_slot_for_immediate_rebooking(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);
        $appointment = $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));

        $cancelled = $this->service->cancel($appointment);

        $this->assertSame(AppointmentStatus::Cancelled, $cancelled->status);
        $this->assertNotNull($cancelled->cancelled_at);

        $rebooked = $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));
        $this->assertSame(AppointmentStatus::Scheduled, $rebooked->status);
    }

    public function test_transition_rejects_illegal_move_out_of_a_terminal_state(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);
        $appointment = $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));
        $this->service->cancel($appointment);

        $this->expectException(InvalidStatusTransitionException::class);

        $this->service->transition($appointment->fresh(), AppointmentStatus::Confirmed);
    }

    public function test_ends_at_snapshot_is_unaffected_by_later_duration_changes(): void
    {
        [$service, $professional, $client] = $this->makeCatalog(30);
        $appointment = $this->service->book(new BookingRequest($client->id, $service->id, $professional->id, CarbonImmutable::parse('2026-08-19 09:00:00')));

        $service->update(['duration_minutes' => 45]);

        $this->assertSame('2026-08-19 09:30:00', $appointment->fresh()->ends_at->format('Y-m-d H:i:s'));
    }
}
