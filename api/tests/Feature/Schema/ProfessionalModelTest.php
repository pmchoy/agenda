<?php

namespace Tests\Feature\Schema;

use App\Models\Professional;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_with_defaults(): void
    {
        $professional = Professional::create(['name' => 'Ana']);

        $this->assertDatabaseHas('professionals', [
            'name' => 'Ana',
            'is_active' => 1,
            'priority' => 0,
        ]);
        $this->assertNull($professional->fresh()->phone);
    }

    public function test_priority_casts_to_integer_and_is_overridable(): void
    {
        $professional = Professional::create(['name' => 'Bea', 'priority' => 5]);

        $this->assertSame(5, $professional->fresh()->priority);
    }
}
