<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('province_id');
            $table->unsignedBigInteger('region_id');
            $table->string('code', 10)->unique();
            $table->string('name', 255);
            $table->string('old_name', 255)->nullable();
            $table->boolean('is_capital')->default(false);
            $table->boolean('is_city')->default(false);
            $table->boolean('is_municipality')->default(false);
            $table->string('island_group_code', 20)->nullable();
            $table->string('psgc_10_digit_code', 15)->nullable();
            $table->timestamps();

            $table->foreign('province_id')->references('id')->on('provinces')->cascadeOnDelete();
            $table->foreign('region_id')->references('id')->on('regions')->cascadeOnDelete();
            $table->index('province_id');
            $table->index('region_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
