<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old chat tables (DM-style schema being replaced with merchant-customer conversable schema)
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->string('conversable_type'); // 'booking', 'reservation', 'service_order'
            $table->unsignedBigInteger('conversable_id');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['merchant_id', 'customer_id', 'conversable_type', 'conversable_id'], 'conversations_unique');
            $table->index(['customer_id', 'last_message_at']);
            $table->index(['merchant_id', 'last_message_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
