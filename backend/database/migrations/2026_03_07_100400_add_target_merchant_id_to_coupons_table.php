<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->foreignId('target_merchant_id')
                ->nullable()
                ->after('merchant_id')
                ->constrained('merchants')
                ->nullOnDelete();

            $table->index('target_merchant_id');
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropForeign(['target_merchant_id']);
            $table->dropIndex(['target_merchant_id']);
            $table->dropColumn('target_merchant_id');
        });
    }
};
