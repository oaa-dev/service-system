<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('referrer_reward_type', ['percentage', 'fixed']);
            $table->decimal('referrer_reward_value', 10, 2);
            $table->enum('referee_reward_type', ['percentage', 'fixed']);
            $table->decimal('referee_reward_value', 10, 2);
            $table->unsignedInteger('max_referrals_per_customer')->nullable();
            $table->unsignedInteger('code_expiry_days')->default(30);
            $table->unsignedInteger('reward_expiry_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index('merchant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_programs');
    }
};
