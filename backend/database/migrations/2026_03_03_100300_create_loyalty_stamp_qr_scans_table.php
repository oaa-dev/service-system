<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_stamp_qr_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qr_code_id')->constrained('loyalty_stamp_qr_codes')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->timestamp('scanned_at');

            $table->unique(['qr_code_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_stamp_qr_scans');
    }
};
