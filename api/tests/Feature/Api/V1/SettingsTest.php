<?php

namespace Tests\Feature\Api\V1;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/settings')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_settings(): void
    {
        Setting::create(['key' => 'slot_grid_minutes', 'value' => '15']);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/v1/settings');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.key', 'slot_grid_minutes')
            ->assertJsonPath('data.0.value', '15');
    }

    public function test_authenticated_user_can_update_a_setting(): void
    {
        Setting::create(['key' => 'slot_grid_minutes', 'value' => '15']);

        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/settings', ['settings' => ['slot_grid_minutes' => 30]]);

        $response->assertStatus(200)->assertJsonPath('data.0.value', '30');
        $this->assertDatabaseHas('settings', ['key' => 'slot_grid_minutes', 'value' => '30']);
    }

    public function test_update_creates_the_setting_if_it_does_not_exist_yet(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/settings', ['settings' => ['slot_grid_minutes' => 20]]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', ['key' => 'slot_grid_minutes', 'value' => '20']);
    }

    public function test_slot_grid_minutes_must_be_within_bounds(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/settings', ['settings' => ['slot_grid_minutes' => 999]]);

        $response->assertStatus(422)->assertJsonValidationErrors('settings.slot_grid_minutes');
    }

    public function test_settings_is_required(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/settings', []);

        $response->assertStatus(422)->assertJsonValidationErrors('settings');
    }
}
