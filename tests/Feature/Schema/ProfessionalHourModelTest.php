<?php

namespace Tests\Feature\Schema;

use App\Models\Professional;
use App\Models\ProfessionalHour;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalHourModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_an_override_belonging_to_a_professional(): void
    {
        $professional = Professional::create(['name' => 'Ana']);

        $hour = ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 1,
            'opens_at' => '10:00:00',
            'closes_at' => '14:00:00',
            'is_closed' => false,
        ]);

        $this->assertDatabaseHas('professional_hours', [
            'professional_id' => $professional->id,
            'weekday' => 1,
        ]);
        $this->assertTrue($hour->fresh()->professional->is($professional));
    }

    public function test_check_constraint_rejects_closed_day_with_times(): void
    {
        $professional = Professional::create(['name' => 'Ana']);

        $this->expectException(QueryException::class);

        ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 2,
            'opens_at' => '09:00:00',
            'closes_at' => '18:00:00',
            'is_closed' => true,
        ]);
    }

    public function test_rows_cascade_delete_when_professional_removed(): void
    {
        $professional = Professional::create(['name' => 'Ana']);
        ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 1,
            'is_closed' => true,
        ]);

        $professional->delete();

        $this->assertDatabaseMissing('professional_hours', [
            'weekday' => 1,
        ]);
    }
}
