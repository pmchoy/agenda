<?php

namespace Tests\Feature\Api\V1;

use App\Domain\Scheduling\AppointmentStatus;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 2026-08-19 is a Wednesday (ISO weekday 3) — the target date for every case.
 */
class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create(['key' => 'slot_grid_minutes', 'value' => '15']);
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
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

    private function makeProfessional(): Professional
    {
        return Professional::create(['name' => 'Ana', 'is_active' => true, 'priority' => 0]);
    }

    private function makeAppointment(Professional $professional, Service $service, Client $client, string $startsAt, AppointmentStatus $status = AppointmentStatus::Scheduled): Appointment
    {
        return Appointment::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => CarbonImmutable::parse($startsAt),
            'ends_at' => CarbonImmutable::parse($startsAt)->addMinutes($service->duration_minutes),
            'status' => $status,
            'origin' => 'dashboard',
        ]);
    }

    public function test_guest_is_rejected(): void
    {
        $this->postJson('/api/v1/appointments', [])->assertStatus(401);
    }

    public function test_two_step_booking_flow_searches_availability_then_creates_the_appointment(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $user = User::factory()->create();

        $availability = $this->actingAs($user)
            ->getJson("/api/v1/availability?service_id={$service->id}&professional_id={$professional->id}&date=2026-08-19")
            ->assertStatus(200);

        $slot = $availability->json('data.0');

        $response = $this->actingAs($user)->postJson('/api/v1/appointments', [
            'service_id' => $service->id,
            'professional_id' => $slot['professional_id'],
            'starts_at' => $slot['starts_at'],
            'client' => ['name' => 'Lucía', 'phone' => '099123456'],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'scheduled')
            ->assertJsonPath('data.client.phone', '+59899123456');

        $this->assertDatabaseHas('clients', ['phone' => '+59899123456']);
        $this->assertDatabaseHas('appointments', [
            'service_id' => $service->id,
            'professional_id' => $professional->id,
        ]);
    }

    public function test_booking_an_already_taken_slot_returns_409_with_slot_unavailable_code(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Existing', 'phone' => '+59899000000']);
        $this->makeAppointment($professional, $service, $client, '2026-08-19 09:00:00');

        $response = $this->actingAs(User::factory()->create())->postJson('/api/v1/appointments', [
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-08-19T09:00:00',
            'client' => ['name' => 'Lucía', 'phone' => '099123456'],
        ]);

        $response->assertStatus(409)->assertJsonPath('code', 'slot_unavailable');
    }

    public function test_rescheduling_an_appointment_updates_its_start_time(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);
        $appointment = $this->makeAppointment($professional, $service, $client, '2026-08-19 09:00:00');

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/appointments/{$appointment->id}", [
                'starts_at' => '2026-08-19T10:00:00',
            ]);

        $response->assertStatus(200)->assertJsonPath('data.starts_at', '2026-08-19T10:00:00-03:00');
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'starts_at' => '2026-08-19 10:00:00']);
    }

    public function test_cancelling_an_appointment_returns_the_updated_resource_with_cancelled_status(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);
        $appointment = $this->makeAppointment($professional, $service, $client, '2026-08-19 09:00:00');

        $response = $this->actingAs(User::factory()->create())
            ->deleteJson("/api/v1/appointments/{$appointment->id}");

        $response->assertStatus(200)->assertJsonPath('data.status', 'cancelled');
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'cancelled']);
    }

    public function test_status_can_be_transitioned_via_patch(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);
        $appointment = $this->makeAppointment($professional, $service, $client, '2026-08-19 09:00:00');

        $response = $this->actingAs(User::factory()->create())
            ->patchJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'confirmed']);

        $response->assertStatus(200)->assertJsonPath('data.status', 'confirmed');
    }

    public function test_invalid_status_transition_returns_409(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);
        $appointment = $this->makeAppointment($professional, $service, $client, '2026-08-19 09:00:00', AppointmentStatus::Cancelled);

        $response = $this->actingAs(User::factory()->create())
            ->patchJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'confirmed']);

        $response->assertStatus(409)->assertJsonPath('code', 'invalid_status_transition');
    }

    public function test_invalid_status_value_returns_422(): void
    {
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);
        $appointment = $this->makeAppointment($professional, $service, $client, '2026-08-19 09:00:00');

        $response = $this->actingAs(User::factory()->create())
            ->patchJson("/api/v1/appointments/{$appointment->id}/status", ['status' => 'banana']);

        $response->assertStatus(422)->assertJsonValidationErrors('status');
    }
}
