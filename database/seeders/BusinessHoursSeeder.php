<?php

namespace Database\Seeders;

use App\Models\BusinessHour;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Default business hours: Monday-Saturday 09:00-18:00, closed Sunday.
 * Weekday values are ISO-8601 (1 = Monday .. 7 = Sunday), matching the
 * `Weekday` enum landing in Phase 2.
 */
class BusinessHoursSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's default business hours.
     */
    public function run(): void
    {
        foreach (range(1, 6) as $weekday) {
            BusinessHour::updateOrCreate(
                ['weekday' => $weekday],
                ['opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]
            );
        }

        BusinessHour::updateOrCreate(
            ['weekday' => 7],
            ['opens_at' => null, 'closes_at' => null, 'is_closed' => true]
        );
    }
}
