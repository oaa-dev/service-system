<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE merchants MODIFY COLUMN status ENUM('pending', 'submitted', 'approved', 'active', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE merchants MODIFY COLUMN status ENUM('pending', 'approved', 'active', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");
    }
};
