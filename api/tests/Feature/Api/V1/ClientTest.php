<?php

namespace Tests\Feature\Api\V1;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/clients')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_clients(): void
    {
        Client::create(['name' => 'Lucía', 'phone' => '+598099123456']);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/v1/clients');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_creating_a_client_normalizes_the_phone_to_e164(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/clients', [
                'name' => 'Lucía',
                'phone' => '099123456',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Lucía')
            ->assertJsonPath('data.phone', '+59899123456');

        $this->assertDatabaseHas('clients', ['name' => 'Lucía', 'phone' => '+59899123456']);
    }

    public function test_phone_is_required(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/clients', ['name' => 'Lucía']);

        $response->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_phone_must_be_unique_after_normalization(): void
    {
        Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);

        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/clients', [
                'name' => 'Other Lucía',
                'phone' => '099123456',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_updating_a_client_allows_keeping_its_own_phone(): void
    {
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/clients/{$client->id}", [
                'name' => 'Lucía Fernández',
                'phone' => '099123456',
            ]);

        $response->assertStatus(200)->assertJsonPath('data.name', 'Lucía Fernández');
    }

    public function test_authenticated_user_can_delete_a_client(): void
    {
        $client = Client::create(['name' => 'Lucía', 'phone' => '+59899123456']);

        $response = $this->actingAs(User::factory()->create())
            ->deleteJson("/api/v1/clients/{$client->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('clients', ['id' => $client->id]);
    }
}
