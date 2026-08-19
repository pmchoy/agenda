<?php

namespace Tests\Feature\Schema;

use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_and_belongs_to_a_category(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        $service = Service::create([
            'service_category_id' => $category->id,
            'name' => 'Haircut',
            'duration_minutes' => 30,
            'price' => 500.00,
        ]);

        $this->assertDatabaseHas('services', [
            'name' => 'Haircut',
            'duration_minutes' => 30,
            'is_active' => 1,
        ]);
        $this->assertTrue($service->fresh()->category->is($category));
    }

    public function test_name_must_be_unique_within_category(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair']);
        Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 30]);

        $this->expectException(QueryException::class);

        Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 45]);
    }

    public function test_category_cannot_be_deleted_while_services_reference_it(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair']);
        Service::create(['service_category_id' => $category->id, 'name' => 'Haircut', 'duration_minutes' => 30]);

        $this->expectException(QueryException::class);

        $category->delete();
    }
}
