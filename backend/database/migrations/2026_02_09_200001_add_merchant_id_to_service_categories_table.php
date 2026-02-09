<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Delete existing rows (seeded data is no longer valid without merchant_id)
        DB::table('service_categories')->delete();

        Schema::table('service_categories', function (Blueprint $table) {
            $table->unsignedBigInteger('merchant_id')->after('id');
            $table->foreign('merchant_id')->references('id')->on('merchants')->cascadeOnDelete();

            // Drop existing unique index on slug
            $table->dropUnique(['slug']);

            // Add composite unique index (slug unique per merchant)
            $table->unique(['merchant_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('service_categories', function (Blueprint $table) {
            $table->dropUnique(['merchant_id', 'slug']);
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
            $table->unique('slug');
        });
    }
};
