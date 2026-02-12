<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('customer_type', ['individual', 'corporate'])->default('individual');
            $table->string('company_name')->nullable();
            $table->text('customer_notes')->nullable();
            $table->integer('loyalty_points')->default(0);
            $table->enum('customer_tier', ['regular', 'silver', 'gold', 'platinum'])->default('regular');
            $table->enum('preferred_payment_method', ['cash', 'e-wallet', 'card'])->nullable();
            $table->enum('communication_preference', ['sms', 'email', 'both'])->default('both');
            $table->enum('status', ['active', 'suspended', 'banned'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
