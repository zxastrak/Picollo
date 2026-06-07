<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Hanya membuat role dasar yang dibutuhkan aplikasi agar tidak crash
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'kasir', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'auditor', 'guard_name' => 'api']);
    }
}
