<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_types', function (Blueprint $table) {
            $table->dropColumn('can_take_orders');
        });

        Schema::table('merchants', function (Blueprint $table) {
            $table->dropColumn('can_take_orders');
        });
    }

    public function down(): void
    {
        Schema::table('business_types', function (Blueprint $table) {
            $table->boolean('can_take_orders')->default(false)->after('can_rent_units');
        });

        Schema::table('merchants', function (Blueprint $table) {
            $table->boolean('can_take_orders')->default(false)->after('can_rent_units');
        });
    }
};
