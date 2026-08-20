<?php

namespace Tests\Feature\Api\V1;

use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/service-categories')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_categories(): void
    {
        ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);
        ServiceCategory::create(['name' => 'Nails', 'sort_order' => 2]);

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/service-categories');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
    }

    public function test_authenticated_user_can_create_a_category(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/service-categories', [
                'name' => 'Hair',
                'sort_order' => 1,
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Hair')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('service_categories', ['name' => 'Hair']);
    }

    public function test_name_is_required(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/service-categories', ['sort_order' => 1]);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_name_must_be_unique(): void
    {
        ServiceCategory::create(['name' => 'Hair']);

        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/service-categories', ['name' => 'Hair']);

        $response->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_authenticated_user_can_show_a_category(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/service-categories/{$category->id}");

        $response->assertStatus(200)->assertJsonPath('data.id', $category->id);
    }

    public function test_authenticated_user_can_update_a_category(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/service-categories/{$category->id}", [
                'name' => 'Hair & Beauty',
                'sort_order' => 2,
                'is_active' => false,
            ]);

        $response->assertStatus(200)->assertJsonPath('data.name', 'Hair & Beauty');
        $this->assertDatabaseHas('service_categories', ['id' => $category->id, 'name' => 'Hair & Beauty', 'is_active' => false]);
    }

    public function test_update_allows_keeping_its_own_name(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/service-categories/{$category->id}", [
                'name' => 'Hair',
                'sort_order' => 3,
            ]);

        $response->assertStatus(200)->assertJsonPath('data.sort_order', 3);
    }

    public function test_authenticated_user_can_delete_a_category(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        $response = $this->actingAs(User::factory()->create())
            ->deleteJson("/api/v1/service-categories/{$category->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('service_categories', ['id' => $category->id]);
    }

    public function test_show_returns_404_for_missing_category(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/service-categories/999');

        $response->assertStatus(404);
    }
}
