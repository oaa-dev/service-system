<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Service type (exclusive)
            $table->enum('service_type', ['sellable', 'bookable', 'reservation'])->default('sellable')->after('is_active');

            // Sellable fields
            $table->string('sku', 100)->nullable()->after('service_type');
            $table->integer('stock_quantity')->nullable()->after('sku');
            $table->boolean('track_stock')->default(false)->after('stock_quantity');

            // Bookable fields
            $table->integer('duration')->nullable()->comment('minutes')->after('track_stock');
            $table->integer('max_capacity')->default(1)->after('duration');
            $table->boolean('requires_confirmation')->default(false)->after('max_capacity');

            // Reservation fields
            $table->decimal('price_per_night', 10, 2)->nullable()->after('requires_confirmation');
            $table->string('floor', 50)->nullable()->after('price_per_night');
            $table->enum('unit_status', ['available', 'occupied', 'maintenance'])->default('available')->after('floor');
            $table->json('amenities')->nullable()->after('unit_status');

            // SKU unique per merchant
            $table->unique(['merchant_id', 'sku'], 'services_merchant_sku_unique');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropUnique('services_merchant_sku_unique');
            $table->dropColumn([
                'service_type', 'sku', 'stock_quantity', 'track_stock',
                'duration', 'max_capacity', 'requires_confirmation',
                'price_per_night', 'floor', 'unit_status', 'amenities',
            ]);
        });
    }
};
