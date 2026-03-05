<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('booking_slot_id')->nullable()->after('service_id');
            $table->foreign('booking_slot_id')
                ->references('id')
                ->on('merchant_booking_slots')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['booking_slot_id']);
            $table->dropColumn('booking_slot_id');
        });
    }
};
