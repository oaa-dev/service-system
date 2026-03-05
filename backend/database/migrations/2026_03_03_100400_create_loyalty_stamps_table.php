<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_stamps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loyalty_card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('qr_code_id')->nullable()->constrained('loyalty_stamp_qr_codes')->nullOnDelete();
            $table->enum('source', ['qr_scan', 'bonus']);
            $table->string('notes')->nullable();
            $table->foreignId('awarded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('earned_at');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('expired')->default(false);

            $table->index('loyalty_card_id');
            $table->index('earned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_stamps');
    }
};
