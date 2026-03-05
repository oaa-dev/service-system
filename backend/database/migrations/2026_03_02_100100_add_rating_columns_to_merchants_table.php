<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->decimal('average_rating', 3, 2)->nullable()->after('submitted_at');
            $table->unsignedInteger('review_count')->default(0)->after('average_rating');
        });
    }

    public function down(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->dropColumn(['average_rating', 'review_count']);
        });
    }
};
