<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payable_type');
            $table->unsignedBigInteger('payable_id');
            $table->string('payment_method')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency')->default('PHP');
            $table->string('status')->default('unpaid');
            $table->string('refund_status')->nullable();
            $table->string('gateway')->default('paymongo');
            $table->string('gateway_payment_id')->nullable()->unique();
            $table->string('gateway_reference')->nullable();
            $table->text('checkout_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['payable_type', 'payable_id']);
            $table->index('status');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->after('status');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->after('status');
        });

        Schema::table('service_orders', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->after('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });

        Schema::table('service_orders', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
    }
};
