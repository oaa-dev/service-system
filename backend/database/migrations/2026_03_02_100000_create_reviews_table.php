<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title', 255)->nullable();
            $table->text('comment')->nullable();
            $table->boolean('is_verified')->default(true);
            $table->boolean('is_published')->default(true);
            $table->text('merchant_reply')->nullable();
            $table->timestamp('merchant_replied_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'merchant_id']);
            $table->index('merchant_id');
            $table->index('customer_id');
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
