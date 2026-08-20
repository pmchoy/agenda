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

        Setting::updateOrCreate(
            ['key' => 'reminder_send_time'],
            ['value' => '18:00']
        );

        Setting::updateOrCreate(
            ['key' => 'confirmation_message_text'],
            ['value' => 'Hola {cliente}, tu turno para {servicio} quedó agendado para el {fecha} a las {hora}. ¡Te esperamos!']
        );

        Setting::updateOrCreate(
            ['key' => 'reminder_message_text'],
            ['value' => 'Hola {cliente}, te recordamos tu turno de {servicio} mañana {fecha} a las {hora}.']
        );
    }
}
