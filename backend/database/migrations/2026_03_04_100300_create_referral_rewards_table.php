<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->enum('reward_type', ['percentage', 'fixed']);
            $table->decimal('reward_value', 10, 2);
            $table->enum('role', ['referrer', 'referee']);
            $table->enum('status', ['pending', 'available', 'redeemed', 'expired'])->default('pending');
            $table->timestamp('redeemed_at')->nullable();
            $table->string('redeemed_on_type')->nullable();
            $table->unsignedBigInteger('redeemed_on_id')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('referral_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_rewards');
    }
};
