<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Get all avatar media records that belong to User model
        $avatarMedia = DB::table('media')
            ->where('model_type', 'App\\Models\\User')
            ->where('collection_name', 'avatar')
            ->get();

        foreach ($avatarMedia as $media) {
            // Find the corresponding user_profile for this user
            $profile = DB::table('user_profiles')
                ->where('user_id', $media->model_id)
                ->first();

            if ($profile) {
                // Update the media record to point to the UserProfile instead
                DB::table('media')
                    ->where('id', $media->id)
                    ->update([
                        'model_type' => 'App\\Models\\UserProfile',
                        'model_id' => $profile->id,
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Get all avatar media records that belong to UserProfile model
        $avatarMedia = DB::table('media')
            ->where('model_type', 'App\\Models\\UserProfile')
            ->where('collection_name', 'avatar')
            ->get();

        foreach ($avatarMedia as $media) {
            // Find the corresponding user for this profile
            $profile = DB::table('user_profiles')
                ->where('id', $media->model_id)
                ->first();

            if ($profile) {
                // Update the media record to point back to the User
                DB::table('media')
                    ->where('id', $media->id)
                    ->update([
                        'model_type' => 'App\\Models\\User',
                        'model_id' => $profile->user_id,
                    ]);
            }
        }
    }
};
