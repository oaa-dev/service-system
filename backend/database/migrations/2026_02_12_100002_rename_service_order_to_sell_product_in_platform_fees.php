<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // First add sell_product to the enum so data can be updated
        DB::statement("ALTER TABLE platform_fees MODIFY COLUMN transaction_type ENUM('booking', 'reservation', 'service_order', 'sell_product') NOT NULL");

        // Update existing data
        DB::table('platform_fees')
            ->where('transaction_type', 'service_order')
            ->update(['transaction_type' => 'sell_product']);

        // Remove old enum value
        DB::statement("ALTER TABLE platform_fees MODIFY COLUMN transaction_type ENUM('booking', 'reservation', 'sell_product') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE platform_fees MODIFY COLUMN transaction_type ENUM('booking', 'reservation', 'sell_product', 'service_order') NOT NULL");

        DB::table('platform_fees')
            ->where('transaction_type', 'sell_product')
            ->update(['transaction_type' => 'service_order']);

        DB::statement("ALTER TABLE platform_fees MODIFY COLUMN transaction_type ENUM('booking', 'reservation', 'service_order') NOT NULL");
    }
};
