<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loyalty_card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loyalty_program_id')->constrained()->cascadeOnDelete();
            $table->enum('reward_type', ['free_product', 'discount_percentage', 'discount_fixed']);
            $table->decimal('reward_value', 10, 2)->nullable();
            $table->foreignId('reward_product_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('reward_description')->nullable();
            $table->enum('status', ['available', 'redeemed', 'expired'])->default('available');
            $table->timestamp('earned_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('redeemed_at')->nullable();
            $table->string('redeemed_on_type')->nullable();
            $table->unsignedBigInteger('redeemed_on_id')->nullable();
            $table->timestamps();

            $table->index('loyalty_card_id');
            $table->index('status');
            $table->index(['redeemed_on_type', 'redeemed_on_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_rewards');
    }
};
