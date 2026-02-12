<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->string('order_number', 50)->unique();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->string('unit_label', 20)->default('pcs');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->enum('status', ['pending', 'received', 'processing', 'ready', 'delivering', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->dateTime('estimated_completion')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['merchant_id', 'status'], 'service_orders_merchant_status_index');
            $table->index('customer_id', 'service_orders_customer_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
