<?php

namespace Database\Seeders;

use App\Models\SocialPlatform;
use Illuminate\Database\Seeder;

class SocialPlatformSeeder extends Seeder
{
    public function run(): void
    {
        $socialPlatforms = [
            ['name' => 'Facebook', 'slug' => 'facebook', 'base_url' => 'https://facebook.com/', 'sort_order' => 1],
            ['name' => 'Instagram', 'slug' => 'instagram', 'base_url' => 'https://instagram.com/', 'sort_order' => 2],
            ['name' => 'Twitter/X', 'slug' => 'twitter-x', 'base_url' => 'https://x.com/', 'sort_order' => 3],
            ['name' => 'TikTok', 'slug' => 'tiktok', 'base_url' => 'https://tiktok.com/@', 'sort_order' => 4],
            ['name' => 'YouTube', 'slug' => 'youtube', 'base_url' => 'https://youtube.com/', 'sort_order' => 5],
            ['name' => 'LinkedIn', 'slug' => 'linkedin', 'base_url' => 'https://linkedin.com/in/', 'sort_order' => 6],
            ['name' => 'WhatsApp', 'slug' => 'whatsapp', 'base_url' => 'https://wa.me/', 'sort_order' => 7],
        ];

        foreach ($socialPlatforms as $socialPlatform) {
            SocialPlatform::firstOrCreate(
                ['slug' => $socialPlatform['slug']],
                $socialPlatform
            );
        }
    }
}
