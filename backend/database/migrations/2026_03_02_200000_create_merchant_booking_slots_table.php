<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_booking_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('merchants')->cascadeOnDelete();
            $table->tinyInteger('day_of_week'); // 0=Sun, 6=Sat
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->unsignedInteger('max_capacity')->nullable(); // null = unlimited
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['merchant_id', 'day_of_week', 'start_time']);
            $table->index(['merchant_id', 'day_of_week', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_booking_slots');
    }
};
