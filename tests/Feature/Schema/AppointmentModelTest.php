<?php

namespace Tests\Feature\Schema;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentModelTest extends TestCase
{
    use RefreshDatabase;

    private function makeService(): Service
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        return Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 30]);
    }

    public function test_it_persists_with_relations_and_timestamps_cast(): void
    {
        $client = Client::create(['name' => 'Carla', 'phone' => '+59899123456']);
        $service = $this->makeService();
        $professional = Professional::create(['name' => 'Ana']);

        $appointment = Appointment::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-08-20 09:00:00',
            'ends_at' => '2026-08-20 09:30:00',
            'status' => 'scheduled',
            'origin' => 'dashboard',
        ]);

        $this->assertDatabaseHas('appointments', [
            'client_id' => $client->id,
            'status' => 'scheduled',
        ]);
        $this->assertInstanceOf(\Carbon\CarbonImmutable::class, $appointment->fresh()->starts_at);
        $this->assertTrue($appointment->fresh()->client->is($client));
        $this->assertTrue($appointment->fresh()->service->is($service));
        $this->assertTrue($appointment->fresh()->professional->is($professional));
    }

    public function test_client_cannot_be_deleted_while_appointment_references_it(): void
    {
        $client = Client::create(['name' => 'Carla', 'phone' => '+59899123456']);
        $service = $this->makeService();
        $professional = Professional::create(['name' => 'Ana']);

        Appointment::create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-08-20 09:00:00',
            'ends_at' => '2026-08-20 09:30:00',
            'status' => 'scheduled',
            'origin' => 'dashboard',
        ]);

        $this->expectException(QueryException::class);

        $client->delete();
    }
}
