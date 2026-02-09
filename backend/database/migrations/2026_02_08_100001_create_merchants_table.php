<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('merchants')->cascadeOnDelete();
            $table->foreignId('business_type_id')->nullable()->constrained('business_types')->nullOnDelete();
            $table->enum('type', ['individual', 'organization'])->default('individual');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('website')->nullable();
            $table->enum('status', ['pending', 'approved', 'active', 'rejected', 'suspended'])->default('pending');
            $table->timestamp('status_changed_at')->nullable();
            $table->text('status_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('accepted_terms_at')->nullable();
            $table->string('terms_version', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchants');
    }
};
