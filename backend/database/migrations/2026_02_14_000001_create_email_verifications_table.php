<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('otp_hash', 64);
            $table->timestamp('expires_at');
            $table->unsignedTinyInteger('attempted_count')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_resent_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verifications');
    }
};
