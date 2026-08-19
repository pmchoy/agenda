<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's default settings.
     */
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'slot_grid_minutes'],
            ['value' => '15']
        );
    }
}
