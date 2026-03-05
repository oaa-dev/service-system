<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->boolean('enable_loyalty_program')->default(false)->after('can_rent_units');
            $table->boolean('enable_referral_program')->default(false)->after('enable_loyalty_program');
        });

        // Auto-enable for merchants that already have active programs
        DB::statement('UPDATE merchants SET enable_loyalty_program = true WHERE id IN (SELECT merchant_id FROM loyalty_programs WHERE is_active = true)');
        DB::statement('UPDATE merchants SET enable_referral_program = true WHERE id IN (SELECT merchant_id FROM referral_programs WHERE is_active = true)');
    }

    public function down(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->dropColumn(['enable_loyalty_program', 'enable_referral_program']);
        });
    }
};
