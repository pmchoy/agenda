<?php

namespace Tests\Feature\Api\V1;

use App\Models\Professional;
use App\Models\ProfessionalHour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalHoursTest extends TestCase
{
    use RefreshDatabase;

    private function professional(): Professional
    {
        return Professional::create(['name' => 'Ana', 'priority' => 1]);
    }

    public function test_guest_is_rejected(): void
    {
        $professional = $this->professional();

        $this->getJson("/api/v1/professionals/{$professional->id}/hours")->assertStatus(401);
    }

    public function test_authenticated_user_can_list_overrides(): void
    {
        $professional = $this->professional();
        ProfessionalHour::create(['professional_id' => $professional->id, 'weekday' => 1, 'opens_at' => '10:00', 'closes_at' => '14:00', 'is_closed' => false]);

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/professionals/{$professional->id}/hours");

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_open_state_creates_an_override_row(): void
    {
        $professional = $this->professional();

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/professionals/{$professional->id}/hours", [
                'hours' => [
                    ['weekday' => 1, 'state' => 'open', 'opens_at' => '10:00', 'closes_at' => '14:00'],
                ],
            ]);

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertDatabaseHas('professional_hours', [
            'professional_id' => $professional->id,
            'weekday' => 1,
            'is_closed' => false,
            'opens_at' => '10:00:00',
            'closes_at' => '14:00:00',
        ]);
    }

    public function test_closed_state_creates_a_closed_override_row(): void
    {
        $professional = $this->professional();

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/professionals/{$professional->id}/hours", [
                'hours' => [
                    ['weekday' => 3, 'state' => 'closed'],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('professional_hours', [
            'professional_id' => $professional->id,
            'weekday' => 3,
            'is_closed' => true,
            'opens_at' => null,
            'closes_at' => null,
        ]);
    }

    public function test_inherit_state_deletes_any_existing_override(): void
    {
        $professional = $this->professional();
        ProfessionalHour::create(['professional_id' => $professional->id, 'weekday' => 2, 'is_closed' => true]);

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/professionals/{$professional->id}/hours", [
                'hours' => [
                    ['weekday' => 2, 'state' => 'inherit'],
                ],
            ]);

        $response->assertStatus(200)->assertJsonCount(0, 'data');
        $this->assertDatabaseMissing('professional_hours', [
            'professional_id' => $professional->id,
            'weekday' => 2,
        ]);
    }

    public function test_open_state_requires_opens_and_closes_at(): void
    {
        $professional = $this->professional();

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/professionals/{$professional->id}/hours", [
                'hours' => [
                    ['weekday' => 1, 'state' => 'open'],
                ],
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['hours.0.opens_at', 'hours.0.closes_at']);
    }

    public function test_state_must_be_one_of_the_tri_state_values(): void
    {
        $professional = $this->professional();

        $response = $this->actingAs(User::factory()->create())
            ->putJson("/api/v1/professionals/{$professional->id}/hours", [
                'hours' => [
                    ['weekday' => 1, 'state' => 'bogus'],
                ],
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('hours.0.state');
    }

    public function test_overrides_for_one_professional_do_not_leak_into_another(): void
    {
        $professionalA = $this->professional();
        $professionalB = Professional::create(['name' => 'Beto', 'priority' => 2]);
        ProfessionalHour::create(['professional_id' => $professionalA->id, 'weekday' => 1, 'is_closed' => true]);

        $response = $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/professionals/{$professionalB->id}/hours");

        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }
}
