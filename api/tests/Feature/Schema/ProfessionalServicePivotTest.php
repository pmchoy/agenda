<?php

namespace Tests\Feature\Schema;

use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalServicePivotTest extends TestCase
{
    use RefreshDatabase;

    public function test_professional_can_be_synced_to_services(): void
    {
        $professional = Professional::create(['name' => 'Ana']);
        $category = ServiceCategory::create(['name' => 'Hair']);
        $service = Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 30]);

        $professional->services()->sync([$service->id]);

        $this->assertDatabaseHas('professional_service', [
            'professional_id' => $professional->id,
            'service_id' => $service->id,
        ]);
        $this->assertTrue($professional->services()->get()->contains($service));
    }

    public function test_pivot_row_is_unique_per_pair(): void
    {
        $professional = Professional::create(['name' => 'Ana']);
        $category = ServiceCategory::create(['name' => 'Hair']);
        $service = Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 30]);

        \DB::table('professional_service')->insert([
            'professional_id' => $professional->id,
            'service_id' => $service->id,
        ]);

        $this->expectException(QueryException::class);

        \DB::table('professional_service')->insert([
            'professional_id' => $professional->id,
            'service_id' => $service->id,
        ]);
    }

    public function test_pivot_rows_cascade_delete_when_professional_removed(): void
    {
        $professional = Professional::create(['name' => 'Ana']);
        $category = ServiceCategory::create(['name' => 'Hair']);
        $service = Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 30]);
        $professional->services()->sync([$service->id]);

        $professional->delete();

        $this->assertDatabaseMissing('professional_service', [
            'service_id' => $service->id,
        ]);
    }
}
