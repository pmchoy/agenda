<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the single encargado (admin) account. No roles/permissions exist —
 * this is the entire user model for the app (see design.md "Dashboard
 * Architecture"). Override credentials via ADMIN_EMAIL/ADMIN_NAME/ADMIN_PASSWORD.
 */
class AdminUserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's admin user.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@agenda.local')],
            [
                'name' => env('ADMIN_NAME', 'Admin'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'email_verified_at' => now(),
            ]
        );
    }
}
