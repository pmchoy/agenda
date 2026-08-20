<?php

namespace Tests\Feature\Api\V1;

use App\Models\BusinessHour;
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
class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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

    private function makeProfessional(): Professional
    {
        return Professional::create(['name' => 'Ana', 'is_active' => true, 'priority' => 0]);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/availability?service_id=1&professional_id=any&date=2026-08-19')
            ->assertStatus(401);
    }

    public function test_authenticated_user_can_search_availability_for_a_specific_professional(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '12:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/availability?service_id={$service->id}&professional_id={$professional->id}&date=2026-08-19");

        $response->assertStatus(200)
            ->assertJsonPath('meta.service_id', $service->id)
            ->assertJsonPath('meta.duration_minutes', 30)
            ->assertJsonPath('meta.grid_minutes', 15)
            ->assertJsonPath('data.0.professional_id', $professional->id)
            ->assertJsonPath('data.0.starts_at', '2026-08-19T09:00:00-03:00');
    }

    public function test_authenticated_user_can_search_availability_for_any_professional(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '12:00:00', 'is_closed' => false]);
        $professional = $this->makeProfessional();
        $service = $this->makeService(30);
        $service->professionals()->attach($professional);

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/availability?service_id={$service->id}&professional_id=any&date=2026-08-19");

        $response->assertStatus(200)
            ->assertJsonPath('data.0.professional_id', $professional->id);
    }

    public function test_availability_requires_service_id_professional_id_and_date(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/availability');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'professional_id', 'date']);
    }

    public function test_unknown_professional_id_returns_404(): void
    {
        $service = $this->makeService(30);

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/availability?service_id={$service->id}&professional_id=999999&date=2026-08-19");

        $response->assertStatus(404);
    }
}
