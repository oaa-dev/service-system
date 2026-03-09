<?php

namespace Database\Seeders;

use App\Models\Advertisement;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoAdvertisementSeeder extends Seeder
{
    /**
     * Color palettes for generated banners: [bg_start, bg_end, accent]
     */
    private array $palettes = [
        ['#6366f1', '#818cf8', '#c7d2fe'], // indigo
        ['#f59e0b', '#fbbf24', '#fef3c7'], // amber
        ['#10b981', '#34d399', '#d1fae5'], // emerald
        ['#ef4444', '#f87171', '#fecaca'], // red
        ['#8b5cf6', '#a78bfa', '#ddd6fe'], // violet
        ['#0ea5e9', '#38bdf8', '#bae6fd'], // sky
        ['#ec4899', '#f472b6', '#fce7f3'], // pink
        ['#14b8a6', '#2dd4bf', '#ccfbf1'], // teal
    ];

    public function run(): void
    {
        $admin = User::role('super-admin')->first();

        if (! $admin) {
            $this->command->warn('No super-admin found. Skipping advertisement seeding.');

            return;
        }

        $merchants = Merchant::where('status', 'active')->get();

        // Platform-wide advertisements
        $platformAds = [
            [
                'title' => 'Welcome to the Marketplace!',
                'description' => 'Discover the best local services, book appointments, make reservations, and order products — all in one place.',
                'type' => 'banner',
                'placement' => 'homepage_hero',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => null,
                'sort_order' => 0,
                '_banner_text' => 'WELCOME',
                '_palette' => 0,
            ],
            [
                'title' => 'Summer Promo: Up to 25% Off',
                'description' => 'Book your favorite services this summer and enjoy exclusive discounts. Limited time only!',
                'type' => 'banner',
                'placement' => 'homepage_hero',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'Browse Deals',
                'sort_order' => 1,
                '_banner_text' => '25% OFF',
                '_palette' => 1,
            ],
            [
                'title' => 'New Merchants Joining Daily',
                'description' => 'We\'re growing! Check out the latest merchants on our platform and support local businesses.',
                'type' => 'promotional_card',
                'placement' => 'homepage_sidebar',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'Explore',
                'sort_order' => 0,
                '_banner_text' => 'NEW',
                '_palette' => 2,
            ],
            [
                'title' => 'Grow Your Business With Us',
                'description' => 'Reach more customers, manage bookings, and track your performance — all from one dashboard.',
                'type' => 'banner',
                'placement' => 'dashboard_banner',
                'target_audience' => 'merchant',
                'link_url' => null,
                'link_text' => 'Learn More',
                'sort_order' => 0,
                '_banner_text' => 'GROW',
                '_palette' => 3,
            ],
            [
                'title' => 'New Feature: Coupon Management',
                'description' => 'Create and manage discount coupons for your customers. Boost sales with targeted promotions!',
                'type' => 'promotional_card',
                'placement' => 'dashboard_banner',
                'target_audience' => 'merchant',
                'link_url' => null,
                'link_text' => 'Try It Now',
                'sort_order' => 1,
                '_banner_text' => 'COUPONS',
                '_palette' => 4,
            ],
            [
                'title' => 'Refer a Friend, Earn Rewards',
                'description' => 'Share the love! Refer friends and earn rewards for every successful referral.',
                'type' => 'popup',
                'placement' => 'storefront_banner',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'Start Referring',
                'sort_order' => 0,
                '_banner_text' => 'REFER',
                '_palette' => 5,
            ],
            [
                'title' => 'Limited Time: Free Delivery!',
                'description' => 'Order from any merchant this week and enjoy free delivery on your first order. Don\'t miss out!',
                'type' => 'popup',
                'placement' => 'homepage_hero',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'Shop Now',
                'sort_order' => 0,
                '_banner_text' => 'FREE',
                '_palette' => 2,
            ],
            [
                'title' => 'Exclusive Merchant Deals',
                'description' => 'Browse our curated list of featured merchants with special promotions running this month.',
                'type' => 'popup',
                'placement' => 'merchant_listing',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'View Deals',
                'sort_order' => 0,
                '_banner_text' => 'DEALS',
                '_palette' => 4,
            ],
            [
                'title' => 'Top Picks This Week',
                'description' => 'Handpicked services and products trending in your area.',
                'type' => 'banner',
                'placement' => 'homepage_sidebar',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'See Picks',
                'sort_order' => 1,
                '_banner_text' => 'TOP',
                '_palette' => 0,
            ],
            [
                'title' => 'Loyalty Rewards Available',
                'description' => 'Earn points with every booking and redeem for exciting rewards.',
                'type' => 'banner',
                'placement' => 'homepage_sidebar',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'Learn More',
                'sort_order' => 2,
                '_banner_text' => 'LOYALTY',
                '_palette' => 7,
            ],
            [
                'title' => 'Platform Announcement',
                'description' => 'System maintenance scheduled for Sunday 2AM-4AM. Services may be temporarily unavailable.',
                'type' => 'banner',
                'placement' => 'dashboard_banner',
                'target_audience' => 'all',
                'link_url' => null,
                'link_text' => null,
                'sort_order' => 10,
                '_banner_text' => 'NOTICE',
                '_palette' => 6,
            ],
            [
                'title' => 'Expired Holiday Sale',
                'description' => 'This promotion has ended. Stay tuned for more deals!',
                'type' => 'banner',
                'placement' => 'homepage_hero',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => null,
                'sort_order' => 99,
                'starts_at' => now()->subMonths(2),
                'expires_at' => now()->subWeek(),
                '_banner_text' => 'SALE',
                '_palette' => 7,
            ],
            [
                'title' => 'Inactive Ad Example',
                'description' => 'This ad is deactivated and should not appear on the storefront.',
                'type' => 'banner',
                'placement' => 'homepage_sidebar',
                'target_audience' => 'customer',
                'is_active' => false,
                'sort_order' => 99,
                '_banner_text' => 'INACTIVE',
                '_palette' => 6,
            ],
        ];

        $platformCount = 0;
        foreach ($platformAds as $data) {
            $bannerText = $data['_banner_text'];
            $paletteIndex = $data['_palette'];
            unset($data['_banner_text'], $data['_palette']);

            $ad = Advertisement::create(array_merge([
                'merchant_id' => null,
                'is_active' => true,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(6),
                'created_by' => $admin->id,
            ], $data));

            $this->attachBannerImage($ad, $bannerText, $ad->title, $paletteIndex);
            $platformCount++;
        }

        // Merchant-specific advertisements (featured merchants)
        $merchantCount = 0;
        foreach ($merchants->take(4) as $index => $merchant) {
            $ad = Advertisement::create([
                'merchant_id' => $merchant->id,
                'title' => "Featured: {$merchant->name}",
                'description' => "Check out {$merchant->name} — one of our top-rated merchants!",
                'type' => 'featured_merchant',
                'placement' => 'merchant_listing',
                'target_audience' => 'customer',
                'link_url' => null,
                'link_text' => 'Visit Store',
                'is_active' => true,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(3),
                'sort_order' => $index,
                'created_by' => $admin->id,
            ]);
            $this->attachBannerImage($ad, strtoupper(substr($merchant->name, 0, 8)), "Featured: {$merchant->name}", $index % count($this->palettes));
            $merchantCount++;

            if ($index < 2) {
                $ad = Advertisement::create([
                    'merchant_id' => $merchant->id,
                    'title' => "Special Offer at {$merchant->name}",
                    'description' => 'Book now and get exclusive member pricing on select services.',
                    'type' => 'promotional_card',
                    'placement' => 'merchant_detail',
                    'target_audience' => 'customer',
                    'link_url' => null,
                    'link_text' => 'Book Now',
                    'is_active' => true,
                    'starts_at' => now(),
                    'expires_at' => now()->addMonths(2),
                    'sort_order' => 0,
                    'created_by' => $admin->id,
                ]);
                $this->attachBannerImage($ad, 'SPECIAL', "Special Offer at {$merchant->name}", ($index + 4) % count($this->palettes));
                $merchantCount++;
            }
        }

        $this->command->info("Seeded {$platformCount} platform ads, {$merchantCount} merchant ads (all with banner images).");
    }

    /**
     * Generate a gradient banner image with large text and attach it to the ad.
     */
    private function attachBannerImage(Advertisement $ad, string $bigText, string $subtitle, int $paletteIndex): void
    {
        $width = 1200;
        $height = 400;
        $palette = $this->palettes[$paletteIndex % count($this->palettes)];

        $img = imagecreatetruecolor($width, $height);
        if (! $img) {
            return;
        }

        imagesavealpha($img, true);

        // Parse hex colors
        [$r1, $g1, $b1] = sscanf($palette[0], '#%02x%02x%02x');
        [$r2, $g2, $b2] = sscanf($palette[1], '#%02x%02x%02x');
        [$ra, $ga, $ba] = sscanf($palette[2], '#%02x%02x%02x');

        // Draw diagonal gradient (top-left to bottom-right)
        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                $ratio = ($x / $width * 0.7) + ($y / $height * 0.3);
                $r = (int) ($r1 + ($r2 - $r1) * $ratio);
                $g = (int) ($g1 + ($g2 - $g1) * $ratio);
                $b = (int) ($b1 + ($b2 - $b1) * $ratio);
                $color = imagecolorallocate($img, min(255, $r), min(255, $g), min(255, $b));
                imagesetpixel($img, $x, $y, $color);
            }
        }

        // Draw decorative circles
        $accent = imagecolorallocatealpha($img, $ra, $ga, $ba, 85);
        imagefilledellipse($img, (int) ($width * 0.82), (int) ($height * 0.25), 350, 350, $accent);
        imagefilledellipse($img, (int) ($width * 0.08), (int) ($height * 0.75), 250, 250, $accent);
        imagefilledellipse($img, (int) ($width * 0.55), (int) ($height * 0.9), 180, 180, $accent);

        // Use DejaVu Sans Bold for crisp large text
        $fontBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
        $fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
        $hasTTF = file_exists($fontBold);

        $white = imagecolorallocate($img, 255, 255, 255);
        $shadow = imagecolorallocatealpha($img, 0, 0, 0, 80);
        $whiteAlpha = imagecolorallocatealpha($img, 255, 255, 255, 40);

        if ($hasTTF) {
            // Big headline — 60pt bold
            $bigSize = 60;
            $bbox = imagettfbbox($bigSize, 0, $fontBold, $bigText);
            $textWidth = $bbox[2] - $bbox[0];
            $textHeight = $bbox[1] - $bbox[7];
            $textX = (int) (($width - $textWidth) / 2);
            $textY = (int) (($height / 2) - ($textHeight / 4) + ($bigSize / 2) - 20);

            // Drop shadow
            imagettftext($img, $bigSize, 0, $textX + 3, $textY + 3, $shadow, $fontBold, $bigText);
            // Main text
            imagettftext($img, $bigSize, 0, $textX, $textY, $white, $fontBold, $bigText);

            // Subtitle — 20pt regular
            $subSize = 20;
            $subBbox = imagettfbbox($subSize, 0, $fontRegular, $subtitle);
            $subWidth = $subBbox[2] - $subBbox[0];
            $subX = (int) (($width - $subWidth) / 2);
            $subY = $textY + 50;

            imagettftext($img, $subSize, 0, $subX + 2, $subY + 2, $shadow, $fontRegular, $subtitle);
            imagettftext($img, $subSize, 0, $subX, $subY, $whiteAlpha, $fontRegular, $subtitle);
        } else {
            // Fallback to built-in fonts
            $fontSize = 5;
            $textWidth = strlen($bigText) * imagefontwidth($fontSize);
            $textX = (int) (($width - $textWidth) / 2);
            $textY = (int) ($height * 0.40);
            imagestring($img, $fontSize, $textX + 2, $textY + 2, $bigText, $shadow);
            imagestring($img, $fontSize, $textX, $textY, $bigText, $white);
        }

        // Save to temp file
        $tmpPath = tempnam(sys_get_temp_dir(), 'ad_banner_') . '.png';
        imagepng($img, $tmpPath, 6);
        imagedestroy($img);

        // Attach via Spatie Media Library
        $ad->addMedia($tmpPath)
            ->usingFileName("ad-banner-{$ad->id}.png")
            ->toMediaCollection('ad_image');
    }
}
