<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('city_id');
            $table->unsignedBigInteger('province_id');
            $table->unsignedBigInteger('region_id');
            $table->string('code', 10)->unique();
            $table->string('name', 255);
            $table->string('old_name', 255)->nullable();
            $table->string('island_group_code', 20)->nullable();
            $table->string('psgc_10_digit_code', 15)->nullable();
            $table->timestamps();

            $table->foreign('city_id')->references('id')->on('cities')->cascadeOnDelete();
            $table->foreign('province_id')->references('id')->on('provinces')->cascadeOnDelete();
            $table->foreign('region_id')->references('id')->on('regions')->cascadeOnDelete();
            $table->index('city_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
