<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_code_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referral_program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referrer_customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('referee_customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('status', ['pending', 'completed', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->string('qualifying_type')->nullable();
            $table->unsignedBigInteger('qualifying_id')->nullable();
            $table->timestamps();

            $table->unique(['referral_program_id', 'referee_customer_id']);
            $table->index('referrer_customer_id');
            $table->index('referee_customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
