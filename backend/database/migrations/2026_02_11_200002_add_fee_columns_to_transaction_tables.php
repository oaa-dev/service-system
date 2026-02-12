<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bookings: add monetary + fee fields (currently has NO monetary fields)
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('service_price', 10, 2)->default(0)->after('party_size');
            $table->decimal('fee_rate', 5, 2)->default(0)->after('service_price');
            $table->decimal('fee_amount', 10, 2)->default(0)->after('fee_rate');
            $table->decimal('total_amount', 10, 2)->default(0)->after('fee_amount');
        });

        // Reservations: add fee fields (keep existing total_price as subtotal)
        Schema::table('reservations', function (Blueprint $table) {
            $table->decimal('fee_rate', 5, 2)->default(0)->after('total_price');
            $table->decimal('fee_amount', 10, 2)->default(0)->after('fee_rate');
            $table->decimal('total_amount', 10, 2)->default(0)->after('fee_amount');
        });

        // Backfill reservations: total_amount = total_price for existing rows
        DB::table('reservations')->update(['total_amount' => DB::raw('total_price')]);

        // Service Orders: add fee fields (keep existing total_price as subtotal)
        Schema::table('service_orders', function (Blueprint $table) {
            $table->decimal('fee_rate', 5, 2)->default(0)->after('total_price');
            $table->decimal('fee_amount', 10, 2)->default(0)->after('fee_rate');
            $table->decimal('total_amount', 10, 2)->default(0)->after('fee_amount');
        });

        // Backfill service_orders: total_amount = total_price for existing rows
        DB::table('service_orders')->update(['total_amount' => DB::raw('total_price')]);
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['service_price', 'fee_rate', 'fee_amount', 'total_amount']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['fee_rate', 'fee_amount', 'total_amount']);
        });

        Schema::table('service_orders', function (Blueprint $table) {
            $table->dropColumn(['fee_rate', 'fee_amount', 'total_amount']);
        });
    }
};
