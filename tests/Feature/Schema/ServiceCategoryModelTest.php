<?php

namespace Tests\Feature\Schema;

use App\Models\ServiceCategory;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceCategoryModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_with_defaults(): void
    {
        $category = ServiceCategory::create(['name' => 'Hair']);

        $this->assertDatabaseHas('service_categories', [
            'name' => 'Hair',
            'sort_order' => 0,
            'is_active' => 1,
        ]);
        $this->assertTrue($category->fresh()->is_active);
    }

    public function test_name_must_be_unique(): void
    {
        ServiceCategory::create(['name' => 'Hair']);

        $this->expectException(QueryException::class);

        ServiceCategory::create(['name' => 'Hair']);
    }
}
