<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->timestamp('identity_verified_at')->nullable()->after('status');
            $table->enum('identity_document_status', ['none', 'pending', 'approved', 'rejected'])
                ->default('none')->after('identity_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['identity_verified_at', 'identity_document_status']);
        });
    }
};
