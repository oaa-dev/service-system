<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Update media records that were stored with the full class name before the morph map
     * registered 'inquiry' as the alias for App\Models\Merchant.
     *
     * Now that the morph map is in place, Spatie Media Library will use 'inquiry' as the
     * model_type when attaching new media to merchants and when querying existing media.
     * Any records stored before the morph map was added must be updated to use 'inquiry'
     * so they remain accessible.
     */
    public function up(): void
    {
        DB::table('media')
            ->where('model_type', 'App\\Models\\Merchant')
            ->update(['model_type' => 'inquiry']);
    }

    /**
     * Reverse the migration by restoring the full class name.
     */
    public function down(): void
    {
        DB::table('media')
            ->where('model_type', 'inquiry')
            ->update(['model_type' => 'App\\Models\\Merchant']);
    }
};
