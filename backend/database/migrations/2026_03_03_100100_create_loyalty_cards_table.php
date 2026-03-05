<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loyalty_program_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('current_stamps')->default(0);
            $table->unsignedInteger('total_stamps_earned')->default(0);
            $table->unsignedInteger('total_rewards_earned')->default(0);
            $table->unsignedInteger('total_rewards_redeemed')->default(0);
            $table->timestamp('last_stamp_at')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'merchant_id']);
            $table->index('merchant_id');
            $table->index('loyalty_program_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_cards');
    }
};
