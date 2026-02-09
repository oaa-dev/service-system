<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_social_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('social_platform_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->timestamps();

            $table->unique(['merchant_id', 'social_platform_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_social_links');
    }
};
