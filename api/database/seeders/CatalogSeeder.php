<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Placeholder catalog — real categories/services/durations/prices are
 * pending from the business (see design.md "Open Questions"). This
 * unblocks dashboard/booking development in the meantime.
 */
class CatalogSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a minimal placeholder catalog.
     */
    public function run(): void
    {
        $category = ServiceCategory::firstOrCreate(
            ['name' => 'General'],
            ['sort_order' => 0, 'is_active' => true]
        );

        Service::firstOrCreate(
            ['service_category_id' => $category->id, 'name' => 'Servicio de ejemplo'],
            ['duration_minutes' => 30, 'price' => null, 'is_active' => true, 'sort_order' => 0]
        );
    }
}
