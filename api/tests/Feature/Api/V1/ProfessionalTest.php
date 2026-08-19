<?php

namespace Tests\Feature\Api\V1;

use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalTest extends TestCase
{
    use RefreshDatabase;

    private function service(): Service
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        return Service::create(['service_category_id' => $category->id, 'name' => 'Cut', 'duration_minutes' => 30]);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/professionals')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_professionals(): void
    {
        Professional::create(['name' => 'Ana', 'priority' => 1]);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/v1/professionals');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_authenticated_user_can_create_a_professional_with_priority(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/professionals', [
                'name' => 'Ana',
                'phone' => '099123456',
                'is_active' => true,
                'priority' => 5,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Ana')
            ->assertJsonPath('data.priority', 5);

        $this->assertDatabaseHas('professionals', ['name' => 'Ana', 'priority' => 5]);
    }

    public function test_creating_a_professional_syncs_the_service_pivot(): void
    {
        $service = $this->service();

        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/professionals', [
                'name' => 'Ana',
                'priority' => 1,
                'service_ids' => [$service->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.service_ids', [$service->id]);

        $professional = Professional::firstWhere('name', 'Ana');
        $this->assertDatabaseHas('professional_service', [
            'professional_id' => $professional->id,
            'service_id' => $service->id,
        ]);
    }

    public function test_updating_a_professional_resyncs_the_service_pivot(): void
    {
        $serviceA = $this->service();
        $serviceB = Service::create([
            'service_category_id' => $serviceA->service_category_id,
            'name' => 'Color',
            'duration_minutes' => 60,
        ]);

        $professional = Professional::create(['name' => 'Ana', 'priority' => 1]);
        $professional->services()->sync([$serviceA->id]);

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/professionals/{$professional->id}", [
                'name' => 'Ana',
                'priority' => 1,
                'service_ids' => [$serviceB->id],
            ]);

        $response->assertStatus(200)->assertJsonPath('data.service_ids', [$serviceB->id]);

        $this->assertDatabaseMissing('professional_service', [
            'professional_id' => $professional->id,
            'service_id' => $serviceA->id,
        ]);
        $this->assertDatabaseHas('professional_service', [
            'professional_id' => $professional->id,
            'service_id' => $serviceB->id,
        ]);
    }

    public function test_name_is_required(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/professionals', ['priority' => 1]);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_service_ids_must_exist(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/professionals', [
                'name' => 'Ana',
                'service_ids' => [999],
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('service_ids.0');
    }

    public function test_authenticated_user_can_delete_a_professional(): void
    {
        $professional = Professional::create(['name' => 'Ana', 'priority' => 1]);

        $response = $this->actingAs(User::factory()->create())
            ->deleteJson("/api/v1/professionals/{$professional->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('professionals', ['id' => $professional->id]);
    }
}
