<?php

namespace Tests\Feature\Schema;

use App\Models\BusinessHour;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessHourModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_an_open_day(): void
    {
        $hour = BusinessHour::create([
            'weekday' => 1,
            'opens_at' => '09:00:00',
            'closes_at' => '18:00:00',
            'is_closed' => false,
        ]);

        $this->assertDatabaseHas('business_hours', [
            'weekday' => 1,
            'is_closed' => 0,
        ]);
        $this->assertNotNull($hour->fresh()->opens_at);
    }

    public function test_it_persists_a_closed_day_with_null_times(): void
    {
        $hour = BusinessHour::create([
            'weekday' => 7,
            'opens_at' => null,
            'closes_at' => null,
            'is_closed' => true,
        ]);

        $this->assertDatabaseHas('business_hours', [
            'weekday' => 7,
            'is_closed' => 1,
        ]);
        $this->assertNull($hour->fresh()->opens_at);
    }

    public function test_check_constraint_rejects_closed_day_with_times(): void
    {
        $this->expectException(QueryException::class);

        BusinessHour::create([
            'weekday' => 2,
            'opens_at' => '09:00:00',
            'closes_at' => '18:00:00',
            'is_closed' => true,
        ]);
    }

    public function test_check_constraint_rejects_open_day_without_times(): void
    {
        $this->expectException(QueryException::class);

        BusinessHour::create([
            'weekday' => 3,
            'opens_at' => null,
            'closes_at' => null,
            'is_closed' => false,
        ]);
    }

    public function test_check_constraint_rejects_closes_at_before_opens_at(): void
    {
        $this->expectException(QueryException::class);

        BusinessHour::create([
            'weekday' => 4,
            'opens_at' => '18:00:00',
            'closes_at' => '09:00:00',
            'is_closed' => false,
        ]);
    }
}
