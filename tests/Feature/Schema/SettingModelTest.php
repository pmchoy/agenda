<?php

namespace Tests\Feature\Schema;

use App\Models\Setting;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_a_key_value_pair(): void
    {
        $setting = Setting::create([
            'key' => 'slot_grid_minutes',
            'value' => '15',
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'slot_grid_minutes',
            'value' => '15',
        ]);
        $this->assertSame('15', $setting->fresh()->value);
    }

    public function test_key_must_be_unique(): void
    {
        Setting::create(['key' => 'slot_grid_minutes', 'value' => '15']);

        $this->expectException(QueryException::class);

        Setting::create(['key' => 'slot_grid_minutes', 'value' => '30']);
    }
}
