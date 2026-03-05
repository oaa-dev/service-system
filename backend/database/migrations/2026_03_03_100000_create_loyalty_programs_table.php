<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('required_stamps');
            $table->enum('reward_type', ['free_product', 'discount_percentage', 'discount_fixed']);
            $table->decimal('reward_value', 10, 2)->nullable();
            $table->foreignId('reward_product_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('reward_description')->nullable();
            $table->unsignedInteger('stamp_expiry_days')->nullable();
            $table->unsignedInteger('reward_expiry_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('merchant_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_programs');
    }
};
