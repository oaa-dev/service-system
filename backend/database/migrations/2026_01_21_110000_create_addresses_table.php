<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->morphs('addressable');
            $table->string('street', 255)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->nullable();
            $table->timestamps();
            $table->unique(['addressable_type', 'addressable_id']);
        });

        // Migrate existing data from user_profiles
        $profiles = DB::table('user_profiles')
            ->whereNotNull('address')
            ->orWhereNotNull('city')
            ->orWhereNotNull('country')
            ->get();

        foreach ($profiles as $profile) {
            if ($profile->address || $profile->city || $profile->country) {
                DB::table('addresses')->insert([
                    'addressable_type' => 'App\\Models\\UserProfile',
                    'addressable_id' => $profile->id,
                    'street' => $profile->address,
                    'city' => $profile->city,
                    'country' => $profile->country,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Drop old columns from user_profiles
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['address', 'city', 'country']);
        });
    }

    public function down(): void
    {
        // Re-add columns to user_profiles
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->string('address', 255)->nullable()->after('phone');
            $table->string('city', 100)->nullable()->after('address');
            $table->string('country', 100)->nullable()->after('city');
        });

        // Migrate data back
        $addresses = DB::table('addresses')
            ->where('addressable_type', 'App\\Models\\UserProfile')
            ->get();

        foreach ($addresses as $address) {
            DB::table('user_profiles')
                ->where('id', $address->addressable_id)
                ->update([
                    'address' => $address->street,
                    'city' => $address->city,
                    'country' => $address->country,
                ]);
        }

        Schema::dropIfExists('addresses');
    }
};
