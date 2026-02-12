<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_types', function (Blueprint $table) {
            $table->boolean('can_sell_products')->default(false)->after('sort_order');
            $table->boolean('can_take_bookings')->default(false)->after('can_sell_products');
            $table->boolean('can_rent_units')->default(false)->after('can_take_bookings');
            $table->boolean('can_take_orders')->default(false)->after('can_rent_units');
        });
    }

    public function down(): void
    {
        Schema::table('business_types', function (Blueprint $table) {
            $table->dropColumn(['can_sell_products', 'can_take_bookings', 'can_rent_units', 'can_take_orders']);
        });
    }
};
