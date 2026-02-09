<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('region_id');
            $table->string('code', 10)->unique();
            $table->string('name', 255);
            $table->string('island_group_code', 20)->nullable();
            $table->string('psgc_10_digit_code', 15)->nullable();
            $table->boolean('is_district')->default(false);
            $table->timestamps();

            $table->foreign('region_id')->references('id')->on('regions')->cascadeOnDelete();
            $table->index('region_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provinces');
    }
};
