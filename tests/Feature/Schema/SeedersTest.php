<?php

namespace Tests\Feature\Schema;

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\BusinessHoursSeeder;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedersTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_seeder_creates_exactly_one_admin(): void
    {
        $this->seed(AdminUserSeeder::class);

        $this->assertSame(1, User::count());
    }

    public function test_settings_seeder_sets_slot_grid_minutes_to_15(): void
    {
        $this->seed(SettingsSeeder::class);

        $this->assertDatabaseHas('settings', [
            'key' => 'slot_grid_minutes',
            'value' => '15',
        ]);
    }

    public function test_catalog_seeder_creates_at_least_one_category_and_service(): void
    {
        $this->seed(CatalogSeeder::class);

        $this->assertGreaterThan(0, ServiceCategory::count());
        $this->assertGreaterThan(0, Service::count());
    }

    public function test_business_hours_seeder_creates_default_monday_to_saturday_hours(): void
    {
        $this->seed(BusinessHoursSeeder::class);

        $this->assertDatabaseHas('business_hours', ['weekday' => 1, 'is_closed' => 0]);
        $this->assertDatabaseHas('business_hours', ['weekday' => 6, 'is_closed' => 0]);
        $this->assertDatabaseHas('business_hours', ['weekday' => 7, 'is_closed' => 1]);
    }
}
