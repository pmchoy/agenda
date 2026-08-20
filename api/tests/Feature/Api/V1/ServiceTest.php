<?php

namespace Tests\Feature\Api\V1;

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    use RefreshDatabase;

    private function category(): ServiceCategory
    {
        return ServiceCategory::create(['name' => 'Hair']);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/services')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_services(): void
    {
        $category = $this->category();
        Service::create(['service_category_id' => $category->id, 'name' => 'Cut', 'duration_minutes' => 30]);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/v1/services');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_authenticated_user_can_create_a_service(): void
    {
        $category = $this->category();

        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/services', [
                'service_category_id' => $category->id,
                'name' => 'Cut',
                'duration_minutes' => 30,
                'price' => 500,
                'is_active' => true,
                'sort_order' => 1,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Cut')
            ->assertJsonPath('data.duration_minutes', 30);

        $this->assertDatabaseHas('services', ['name' => 'Cut', 'service_category_id' => $category->id]);
    }

    public function test_service_category_id_must_exist(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/services', [
                'service_category_id' => 999,
                'name' => 'Cut',
                'duration_minutes' => 30,
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('service_category_id');
    }

    public function test_duration_minutes_is_required(): void
    {
        $category = $this->category();

        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/services', [
                'service_category_id' => $category->id,
                'name' => 'Cut',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('duration_minutes');
    }

    public function test_name_must_be_unique_within_the_same_category(): void
    {
        $category = $this->category();
        Service::create(['service_category_id' => $category->id, 'name' => 'Cut', 'duration_minutes' => 30]);

        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/services', [
                'service_category_id' => $category->id,
                'name' => 'Cut',
                'duration_minutes' => 45,
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_authenticated_user_can_update_a_service(): void
    {
        $category = $this->category();
        $service = Service::create(['service_category_id' => $category->id, 'name' => 'Cut', 'duration_minutes' => 30]);

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/services/{$service->id}", [
                'service_category_id' => $category->id,
                'name' => 'Cut & Style',
                'duration_minutes' => 45,
            ]);

        $response->assertStatus(200)->assertJsonPath('data.name', 'Cut & Style');
    }

    public function test_authenticated_user_can_delete_a_service(): void
    {
        $category = $this->category();
        $service = Service::create(['service_category_id' => $category->id, 'name' => 'Cut', 'duration_minutes' => 30]);

        $response = $this->actingAs(User::factory()->create())
            ->deleteJson("/api/v1/services/{$service->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }
}
