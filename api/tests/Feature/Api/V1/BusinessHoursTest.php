<?php

namespace Tests\Feature\Api\V1;

use App\Models\BusinessHour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessHoursTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return list<array<string, mixed>>
     */
    private function sevenDaysPayload(): array
    {
        $days = [];

        for ($weekday = 1; $weekday <= 7; $weekday++) {
            $days[] = $weekday === 7
                ? ['weekday' => $weekday, 'is_closed' => true]
                : ['weekday' => $weekday, 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '18:00'];
        }

        return $days;
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/business-hours')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_business_hours(): void
    {
        BusinessHour::create(['weekday' => 1, 'opens_at' => '09:00', 'closes_at' => '18:00', 'is_closed' => false]);

        $response = $this->actingAs(User::factory()->create())->getJson('/api/v1/business-hours');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_authenticated_user_can_bulk_update_all_seven_weekdays(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/business-hours', ['hours' => $this->sevenDaysPayload()]);

        $response->assertStatus(200)->assertJsonCount(7, 'data');

        $this->assertDatabaseHas('business_hours', ['weekday' => 1, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $this->assertDatabaseHas('business_hours', ['weekday' => 7, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null]);
    }

    public function test_bulk_update_upserts_existing_rows_instead_of_duplicating(): void
    {
        BusinessHour::create(['weekday' => 1, 'opens_at' => '08:00', 'closes_at' => '12:00', 'is_closed' => false]);

        $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/business-hours', ['hours' => $this->sevenDaysPayload()]);

        $this->assertDatabaseCount('business_hours', 7);
        $this->assertDatabaseHas('business_hours', ['weekday' => 1, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00']);
    }

    public function test_it_requires_exactly_seven_days(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/business-hours', ['hours' => array_slice($this->sevenDaysPayload(), 0, 3)]);

        $response->assertStatus(422)->assertJsonValidationErrors('hours');
    }

    public function test_open_day_requires_opens_and_closes_at(): void
    {
        $days = $this->sevenDaysPayload();
        unset($days[0]['opens_at'], $days[0]['closes_at']);

        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/business-hours', ['hours' => $days]);

        $response->assertStatus(422)->assertJsonValidationErrors(['hours.0.opens_at', 'hours.0.closes_at']);
    }

    public function test_closes_at_must_be_after_opens_at(): void
    {
        $days = $this->sevenDaysPayload();
        $days[0]['closes_at'] = '08:00';

        $response = $this->actingAs(User::factory()->create())
            ->putJson('/api/v1/business-hours', ['hours' => $days]);

        $response->assertStatus(422)->assertJsonValidationErrors('hours.0.closes_at');
    }
}
