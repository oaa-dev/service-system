<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_stamp_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loyalty_program_id')->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->enum('mode', ['single_use', 'daily']);
            $table->timestamp('expires_at');
            $table->boolean('is_used')->default(false);
            $table->foreignId('scanned_by')->nullable()->constrained('customers')->nullOnDelete();
            $table->timestamp('scanned_at')->nullable();
            $table->unsignedInteger('scan_count')->default(0);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_stamp_qr_codes');
    }
};
