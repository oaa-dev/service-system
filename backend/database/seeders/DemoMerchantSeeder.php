<?php

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\BusinessType;
use App\Models\City;
use App\Models\Merchant;
use App\Models\MerchantBusinessHour;
use App\Models\MerchantSocialLink;
use App\Models\PaymentMethod;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceSchedule;
use App\Models\SocialPlatform;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoMerchantSeeder extends Seeder
{
    /**
     * All amenities available for reservation-type services.
     */
    private const AMENITIES = [
        'WiFi', 'Parking', 'Pool', 'AC', 'TV',
        'Mini Bar', 'Kitchen', 'Ocean View', 'Balcony', 'Hot Tub',
    ];

    /**
     * Floor options for reservation-type services.
     */
    private const FLOORS = ['Ground', '1st', '2nd', '3rd'];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businessTypeConfigs = $this->getBusinessTypeConfigs();
        $businessTypes = BusinessType::all()->keyBy('slug');
        $paymentMethodIds = PaymentMethod::where('is_active', true)->pluck('id')->toArray();
        $platforms = SocialPlatform::where('is_active', true)->get();
        $cities = City::with('province.region')->inRandomOrder()->limit(50)->get();

        if ($cities->isEmpty()) {
            $this->command->warn('No PSGC city data found. Addresses will be skipped.');
        }

        $merchantIndex = 0;

        foreach ($businessTypeConfigs as $slug => $config) {
            $businessType = $businessTypes->get($slug);

            if (! $businessType) {
                $this->command->warn("Business type '{$slug}' not found. Skipping.");
                continue;
            }

            foreach ($config['names'] as $merchantName) {
                $merchantIndex++;

                // Create user for this merchant
                $user = User::factory()->create([
                    'name' => $merchantName,
                    'email' => 'merchant' . $merchantIndex . '@demo.com',
                    'email_verified_at' => now(),
                ]);
                $user->assignRole('merchant');

                // Determine status based on index
                $statusData = $this->getStatusData($merchantIndex);

                // Create merchant
                $merchant = Merchant::create([
                    'user_id' => $user->id,
                    'business_type_id' => $businessType->id,
                    'type' => $merchantIndex % 3 === 0 ? 'organization' : 'individual',
                    'name' => $merchantName,
                    'description' => $config['description_prefix'] . ' ' . fake()->sentence(8),
                    'contact_email' => Str::slug($merchantName) . '@example.com',
                    'contact_phone' => fake()->numerify('+639#########'),
                    'website' => 'https://' . Str::slug($merchantName) . '.com',
                    'status' => $statusData['status'],
                    'status_changed_at' => $statusData['status_changed_at'],
                    'status_reason' => $statusData['status_reason'],
                    'approved_at' => $statusData['approved_at'],
                    'can_sell_products' => $config['capabilities']['can_sell_products'],
                    'can_take_bookings' => $config['capabilities']['can_take_bookings'],
                    'can_rent_units' => $config['capabilities']['can_rent_units'],
                ]);

                // Seed address
                if ($cities->isNotEmpty()) {
                    $this->seedAddress($merchant, $cities);
                }

                // Seed business hours
                $this->seedBusinessHours($merchant, $config['hours']);

                // Seed payment methods
                if (! empty($paymentMethodIds)) {
                    $count = rand(2, min(4, count($paymentMethodIds)));
                    $merchant->paymentMethods()->sync(
                        collect($paymentMethodIds)->random($count)->toArray()
                    );
                }

                // Seed social links
                $this->seedSocialLinks($merchant, $platforms);

                // Seed categories and services
                $this->seedCategoriesAndServices($merchant, $config);

                // Seed gallery images for active merchants only
                if ($merchantIndex <= 40) {
                    $this->seedGalleryImages($merchant, $merchantIndex);
                }
            }
        }

        $this->command->info("Seeded {$merchantIndex} demo merchants with full profiles.");
    }

    /**
     * Get status data based on merchant index (1-based).
     *
     * First 40: active, Next 4: approved, Next 3: pending, Next 2: suspended, Last 1: rejected
     */
    private function getStatusData(int $index): array
    {
        if ($index <= 40) {
            return [
                'status' => 'active',
                'approved_at' => now(),
                'status_changed_at' => now(),
                'status_reason' => null,
            ];
        }

        if ($index <= 44) {
            return [
                'status' => 'approved',
                'approved_at' => now(),
                'status_changed_at' => now(),
                'status_reason' => null,
            ];
        }

        if ($index <= 47) {
            return [
                'status' => 'pending',
                'approved_at' => null,
                'status_changed_at' => null,
                'status_reason' => null,
            ];
        }

        if ($index <= 49) {
            return [
                'status' => 'suspended',
                'approved_at' => null,
                'status_changed_at' => now(),
                'status_reason' => 'Account under review for policy compliance.',
            ];
        }

        // Index 50
        return [
            'status' => 'rejected',
            'approved_at' => null,
            'status_changed_at' => now(),
            'status_reason' => 'Incomplete documentation submitted during registration.',
        ];
    }

    /**
     * Seed address using random PSGC data.
     */
    private function seedAddress(Merchant $merchant, $cities): void
    {
        $city = $cities->random();
        $barangay = Barangay::where('city_id', $city->id)->inRandomOrder()->first();

        $regionName = $city->province->region->name ?? '';
        $coords = $this->getRegionCoordinates($regionName);

        $merchant->updateOrCreateAddress([
            'street' => fake()->streetAddress(),
            'postal_code' => fake()->numerify('####'),
            'region_id' => $city->province->region->id,
            'province_id' => $city->province->id,
            'city_id' => $city->id,
            'barangay_id' => $barangay?->id,
            'latitude' => $coords['lat'] + (fake()->randomFloat(4, -0.03, 0.03)),
            'longitude' => $coords['lng'] + (fake()->randomFloat(4, -0.03, 0.03)),
        ]);
    }

    private function getRegionCoordinates(string $regionName): array
    {
        $regionMap = [
            'NCR' => ['lat' => 14.5995, 'lng' => 120.9842],
            'National Capital Region' => ['lat' => 14.5995, 'lng' => 120.9842],
            'CAR' => ['lat' => 16.4023, 'lng' => 120.5960],
            'Cordillera Administrative Region' => ['lat' => 16.4023, 'lng' => 120.5960],
            'Region I' => ['lat' => 16.0832, 'lng' => 120.3860],
            'Ilocos Region' => ['lat' => 16.0832, 'lng' => 120.3860],
            'Region II' => ['lat' => 16.4939, 'lng' => 121.8787],
            'Cagayan Valley' => ['lat' => 16.4939, 'lng' => 121.8787],
            'Region III' => ['lat' => 15.4828, 'lng' => 120.7120],
            'Central Luzon' => ['lat' => 15.4828, 'lng' => 120.7120],
            'Region IV-A' => ['lat' => 14.1008, 'lng' => 121.0794],
            'CALABARZON' => ['lat' => 14.1008, 'lng' => 121.0794],
            'MIMAROPA' => ['lat' => 12.8797, 'lng' => 121.7740],
            'Region IV-B' => ['lat' => 12.8797, 'lng' => 121.7740],
            'Region V' => ['lat' => 13.1391, 'lng' => 123.7438],
            'Bicol Region' => ['lat' => 13.1391, 'lng' => 123.7438],
            'Region VI' => ['lat' => 10.7202, 'lng' => 122.5621],
            'Western Visayas' => ['lat' => 10.7202, 'lng' => 122.5621],
            'Region VII' => ['lat' => 10.3157, 'lng' => 123.8854],
            'Central Visayas' => ['lat' => 10.3157, 'lng' => 123.8854],
            'Region VIII' => ['lat' => 11.0500, 'lng' => 124.9700],
            'Eastern Visayas' => ['lat' => 11.0500, 'lng' => 124.9700],
            'Region IX' => ['lat' => 7.7469, 'lng' => 123.3393],
            'Zamboanga Peninsula' => ['lat' => 7.7469, 'lng' => 123.3393],
            'Region X' => ['lat' => 8.0202, 'lng' => 124.6837],
            'Northern Mindanao' => ['lat' => 8.0202, 'lng' => 124.6837],
            'Region XI' => ['lat' => 7.1907, 'lng' => 125.4553],
            'Davao Region' => ['lat' => 7.1907, 'lng' => 125.4553],
            'Region XII' => ['lat' => 6.2706, 'lng' => 124.6857],
            'SOCCSKSARGEN' => ['lat' => 6.2706, 'lng' => 124.6857],
            'Region XIII' => ['lat' => 8.9475, 'lng' => 125.5406],
            'Caraga' => ['lat' => 8.9475, 'lng' => 125.5406],
            'BARMM' => ['lat' => 6.9568, 'lng' => 124.2421],
            'Bangsamoro' => ['lat' => 6.9568, 'lng' => 124.2421],
        ];

        foreach ($regionMap as $key => $coords) {
            if (str_contains(strtolower($regionName), strtolower($key))) {
                return $coords;
            }
        }

        // Default: center of Philippines
        return ['lat' => 12.8797, 'lng' => 121.7740];
    }

    /**
     * Seed business hours for a merchant.
     */
    private function seedBusinessHours(Merchant $merchant, array $hours): void
    {
        foreach ($hours as $hourConfig) {
            MerchantBusinessHour::create([
                'merchant_id' => $merchant->id,
                'day_of_week' => $hourConfig['day'],
                'open_time' => $hourConfig['open'] ?? null,
                'close_time' => $hourConfig['close'] ?? null,
                'is_closed' => $hourConfig['is_closed'],
            ]);
        }
    }

    /**
     * Seed social links for a merchant.
     */
    private function seedSocialLinks(Merchant $merchant, $platforms): void
    {
        $facebook = $platforms->firstWhere('slug', 'facebook');
        $instagram = $platforms->firstWhere('slug', 'instagram');
        $others = $platforms->whereNotIn('slug', ['facebook', 'instagram']);

        if ($facebook) {
            MerchantSocialLink::create([
                'merchant_id' => $merchant->id,
                'social_platform_id' => $facebook->id,
                'url' => 'https://facebook.com/' . $merchant->slug,
            ]);
        }

        if ($instagram) {
            MerchantSocialLink::create([
                'merchant_id' => $merchant->id,
                'social_platform_id' => $instagram->id,
                'url' => 'https://instagram.com/' . $merchant->slug,
            ]);
        }

        // 0-1 random additional platform
        if ($others->isNotEmpty() && rand(0, 1)) {
            $extra = $others->random();
            MerchantSocialLink::create([
                'merchant_id' => $merchant->id,
                'social_platform_id' => $extra->id,
                'url' => $extra->base_url . $merchant->slug,
            ]);
        }
    }

    /**
     * Seed service categories and services for a merchant.
     */
    private function seedCategoriesAndServices(Merchant $merchant, array $config): void
    {
        $skuCounter = 1;

        foreach ($config['categories'] as $sortOrder => $categoryConfig) {
            $category = ServiceCategory::create([
                'merchant_id' => $merchant->id,
                'name' => $categoryConfig['name'],
                'description' => $categoryConfig['name'] . ' services',
                'is_active' => true,
                'sort_order' => $sortOrder + 1,
            ]);

            foreach ($categoryConfig['services'] as $serviceData) {
                $serviceAttrs = [
                    'merchant_id' => $merchant->id,
                    'service_category_id' => $category->id,
                    'name' => $serviceData['name'],
                    'description' => fake()->sentence(6),
                    'price' => $serviceData['price'],
                    'is_active' => true,
                    'service_type' => $serviceData['type'],
                ];

                // Bookable-specific fields
                if ($serviceData['type'] === 'bookable') {
                    $serviceAttrs['duration'] = $serviceData['duration'];
                    $serviceAttrs['max_capacity'] = $serviceData['max_capacity'] ?? 1;
                    $serviceAttrs['requires_confirmation'] = $serviceData['requires_confirmation'] ?? false;
                }

                // Reservation-specific fields
                if ($serviceData['type'] === 'reservation') {
                    $serviceAttrs['price_per_night'] = $serviceData['price_per_night'] ?? $serviceData['price'];
                    $serviceAttrs['floor'] = self::FLOORS[array_rand(self::FLOORS)];
                    $serviceAttrs['unit_status'] = 'available';
                    $serviceAttrs['max_capacity'] = $serviceData['max_capacity'] ?? rand(2, 6);

                    // Random 3-5 amenities
                    $amenityCount = rand(3, 5);
                    $shuffled = self::AMENITIES;
                    shuffle($shuffled);
                    $serviceAttrs['amenities'] = array_slice($shuffled, 0, $amenityCount);
                }

                // Sellable-specific fields
                if ($serviceData['type'] === 'sellable') {
                    if ($serviceData['price'] > 300) {
                        $skuPrefix = strtoupper(substr(Str::slug($merchant->name, ''), 0, 3));
                        $serviceAttrs['sku'] = $skuPrefix . '-' . str_pad($skuCounter, 3, '0', STR_PAD_LEFT);
                        $skuCounter++;
                        $serviceAttrs['stock_quantity'] = rand(10, 100);
                        $serviceAttrs['track_stock'] = (bool) rand(0, 1);
                    }
                }

                $service = Service::create($serviceAttrs);

                // Seed service schedules for bookable services
                if ($serviceData['type'] === 'bookable') {
                    $this->seedServiceSchedule($service, $merchant);
                }
            }
        }
    }

    /**
     * Seed gallery images for a merchant using Lorem Picsum.
     */
    private function seedGalleryImages(Merchant $merchant, int $index): void
    {
        $this->command?->info("Seeding gallery images for merchant #{$index}: {$merchant->name}...");

        try {
            // Logo image (square)
            $merchant->addMediaFromUrl("https://picsum.photos/seed/m{$index}-logo/400/400")
                ->toMediaCollection('logo');

            // 1 feature image
            $merchant->addMediaFromUrl("https://picsum.photos/seed/m{$index}-feature/800/600")
                ->toMediaCollection('gallery_feature');

            // 3 gallery photos
            for ($n = 1; $n <= 3; $n++) {
                $merchant->addMediaFromUrl("https://picsum.photos/seed/m{$index}-photo-{$n}/800/600")
                    ->toMediaCollection('gallery_photos');
            }

            // 2 interior images
            for ($n = 1; $n <= 2; $n++) {
                $merchant->addMediaFromUrl("https://picsum.photos/seed/m{$index}-interior-{$n}/800/600")
                    ->toMediaCollection('gallery_interiors');
            }

            // 2 exterior images
            for ($n = 1; $n <= 2; $n++) {
                $merchant->addMediaFromUrl("https://picsum.photos/seed/m{$index}-exterior-{$n}/800/600")
                    ->toMediaCollection('gallery_exteriors');
            }
        } catch (\Exception $e) {
            $this->command?->warn("Failed to seed gallery for merchant {$merchant->name}: {$e->getMessage()}");
        }
    }

    /**
     * Seed service schedules matching merchant business hours.
     */
    private function seedServiceSchedule(Service $service, Merchant $merchant): void
    {
        foreach ($merchant->businessHours as $bh) {
            ServiceSchedule::create([
                'service_id' => $service->id,
                'day_of_week' => $bh->day_of_week,
                'start_time' => $bh->open_time ?? '00:00',
                'end_time' => $bh->close_time ?? '00:00',
                'is_available' => ! $bh->is_closed,
            ]);
        }
    }

    /**
     * Build business hours config for 7 days.
     */
    private function buildHours(string $open, string $close, array $closedDays = []): array
    {
        $hours = [];
        for ($day = 0; $day <= 6; $day++) {
            if (in_array($day, $closedDays)) {
                $hours[] = ['day' => $day, 'is_closed' => true];
            } else {
                $hours[] = ['day' => $day, 'open' => $open, 'close' => $close, 'is_closed' => false];
            }
        }

        return $hours;
    }

    /**
     * Build special hours with Sunday having different times.
     */
    private function buildHoursWithSundayDiff(string $open, string $close, string $sunOpen, string $sunClose): array
    {
        $hours = [];
        for ($day = 0; $day <= 6; $day++) {
            if ($day === 0) {
                $hours[] = ['day' => $day, 'open' => $sunOpen, 'close' => $sunClose, 'is_closed' => false];
            } else {
                $hours[] = ['day' => $day, 'open' => $open, 'close' => $close, 'is_closed' => false];
            }
        }

        return $hours;
    }

    /**
     * Get the full business type configurations with merchant names, capabilities, hours, categories, and services.
     */
    private function getBusinessTypeConfigs(): array
    {
        return [
            'resort-spa' => [
                'description_prefix' => 'A premier resort and spa destination offering',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => true,
                ],
                'hours' => $this->buildHours('06:00', '22:00'),
                'names' => [
                    'Paradise Bay Resort & Spa',
                    'Sunset Cove Resort',
                    'Azure Lagoon Resort',
                    'Isla Verde Wellness Resort',
                    'Golden Shore Beach Resort',
                    'Tranquil Waters Resort & Spa',
                    'Mountain Breeze Retreat',
                    'Crystal Springs Resort',
                ],
                'categories' => [
                    [
                        'name' => 'Spa & Wellness',
                        'services' => [
                            ['name' => 'Hot Stone Massage', 'type' => 'bookable', 'price' => 2500, 'duration' => 90],
                            ['name' => 'Swedish Massage', 'type' => 'bookable', 'price' => 1800, 'duration' => 60],
                            ['name' => 'Facial Treatment', 'type' => 'bookable', 'price' => 1200, 'duration' => 45],
                            ['name' => 'Body Scrub', 'type' => 'bookable', 'price' => 1500, 'duration' => 60],
                            ['name' => 'Aromatherapy Session', 'type' => 'bookable', 'price' => 2000, 'duration' => 60],
                        ],
                    ],
                    [
                        'name' => 'Accommodations',
                        'services' => [
                            ['name' => 'Deluxe Room', 'type' => 'reservation', 'price' => 4500, 'price_per_night' => 4500],
                            ['name' => 'Suite Room', 'type' => 'reservation', 'price' => 8000, 'price_per_night' => 8000],
                            ['name' => 'Villa', 'type' => 'reservation', 'price' => 15000, 'price_per_night' => 15000],
                            ['name' => 'Standard Room', 'type' => 'reservation', 'price' => 2500, 'price_per_night' => 2500],
                            ['name' => 'Family Room', 'type' => 'reservation', 'price' => 6000, 'price_per_night' => 6000],
                            ['name' => 'Cabana', 'type' => 'reservation', 'price' => 3500, 'price_per_night' => 3500],
                            ['name' => 'Penthouse Suite', 'type' => 'reservation', 'price' => 20000, 'price_per_night' => 20000],
                            ['name' => 'Beach Front Room', 'type' => 'reservation', 'price' => 5500, 'price_per_night' => 5500],
                        ],
                    ],
                    [
                        'name' => 'Gift Shop',
                        'services' => [
                            ['name' => 'Resort T-Shirt', 'type' => 'sellable', 'price' => 450],
                            ['name' => 'Souvenir Mug', 'type' => 'sellable', 'price' => 250],
                            ['name' => 'Local Crafts', 'type' => 'sellable', 'price' => 350],
                        ],
                    ],
                ],
            ],

            'salon-beauty' => [
                'description_prefix' => 'A top-rated beauty salon providing',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
                ],
                'hours' => $this->buildHours('09:00', '19:00', [0]),
                'names' => [
                    'Glamour Zone Salon',
                    'Style Avenue Beauty',
                    'Bella Vita Hair Studio',
                    'Crown & Glory Salon',
                    'Radiant Beauty Lounge',
                    'La Femme Beauty Parlor',
                    'Chic Cuts Hair Studio',
                    'Bloom Beauty Bar',
                ],
                'categories' => [
                    [
                        'name' => 'Hair Services',
                        'services' => [
                            ['name' => 'Haircut', 'type' => 'bookable', 'price' => 350, 'duration' => 45],
                            ['name' => 'Hair Coloring', 'type' => 'bookable', 'price' => 2500, 'duration' => 120],
                            ['name' => 'Rebonding', 'type' => 'bookable', 'price' => 3500, 'duration' => 180],
                            ['name' => 'Hair Treatment', 'type' => 'bookable', 'price' => 800, 'duration' => 60],
                            ['name' => 'Blow Dry & Style', 'type' => 'bookable', 'price' => 300, 'duration' => 30],
                            ['name' => 'Balayage', 'type' => 'bookable', 'price' => 4000, 'duration' => 150],
                        ],
                    ],
                    [
                        'name' => 'Nail Services',
                        'services' => [
                            ['name' => 'Manicure', 'type' => 'bookable', 'price' => 250, 'duration' => 30],
                            ['name' => 'Pedicure', 'type' => 'bookable', 'price' => 350, 'duration' => 45],
                            ['name' => 'Gel Nails', 'type' => 'bookable', 'price' => 600, 'duration' => 60],
                            ['name' => 'Nail Art', 'type' => 'bookable', 'price' => 500, 'duration' => 45],
                        ],
                    ],
                    [
                        'name' => 'Beauty Products',
                        'services' => [
                            ['name' => 'Shampoo', 'type' => 'sellable', 'price' => 380],
                            ['name' => 'Conditioner', 'type' => 'sellable', 'price' => 350],
                            ['name' => 'Hair Serum', 'type' => 'sellable', 'price' => 450],
                            ['name' => 'Hair Wax', 'type' => 'sellable', 'price' => 280],
                        ],
                    ],
                ],
            ],

            'pet-services' => [
                'description_prefix' => 'A caring pet services provider offering',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => true,
                ],
                'hours' => $this->buildHours('08:00', '18:00', [0]),
                'names' => [
                    'Happy Paws Pet Care',
                    'Furry Friends Pet Shop',
                    'Paws & Claws Pet Salon',
                    'Bark Avenue Pet Services',
                    'Pawsitive Vibes Pet Spa',
                    'Whiskers & Tails Pet Care',
                ],
                'categories' => [
                    [
                        'name' => 'Grooming',
                        'services' => [
                            ['name' => 'Full Grooming', 'type' => 'bookable', 'price' => 800, 'duration' => 90],
                            ['name' => 'Bath & Dry', 'type' => 'bookable', 'price' => 400, 'duration' => 45],
                            ['name' => 'Nail Trimming', 'type' => 'bookable', 'price' => 150, 'duration' => 15],
                            ['name' => 'Ear Cleaning', 'type' => 'bookable', 'price' => 200, 'duration' => 15],
                        ],
                    ],
                    [
                        'name' => 'Pet Hotel',
                        'services' => [
                            ['name' => 'Small Pet Room', 'type' => 'reservation', 'price' => 500, 'price_per_night' => 500],
                            ['name' => 'Large Pet Room', 'type' => 'reservation', 'price' => 800, 'price_per_night' => 800],
                            ['name' => 'VIP Pet Suite', 'type' => 'reservation', 'price' => 1500, 'price_per_night' => 1500],
                            ['name' => 'Cat Room', 'type' => 'reservation', 'price' => 400, 'price_per_night' => 400],
                        ],
                    ],
                    [
                        'name' => 'Pet Supplies',
                        'services' => [
                            ['name' => 'Dog Food 5kg', 'type' => 'sellable', 'price' => 550],
                            ['name' => 'Cat Food 3kg', 'type' => 'sellable', 'price' => 380],
                            ['name' => 'Pet Shampoo', 'type' => 'sellable', 'price' => 250],
                            ['name' => 'Dog Treats', 'type' => 'sellable', 'price' => 180],
                            ['name' => 'Cat Litter', 'type' => 'sellable', 'price' => 320],
                        ],
                    ],
                ],
            ],

            'barbershop' => [
                'description_prefix' => 'A classic barbershop experience featuring',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
                ],
                'hours' => $this->buildHours('09:00', '19:00', [0]),
                'names' => [
                    'The Gentlemen\'s Cut',
                    'Sharp Edge Barbershop',
                    'Blade & Comb Barbers',
                    'Classic Cuts Manila',
                    'The Dapper Den',
                    'Mane Street Barbershop',
                ],
                'categories' => [
                    [
                        'name' => 'Barber Services',
                        'services' => [
                            ['name' => 'Classic Haircut', 'type' => 'bookable', 'price' => 200, 'duration' => 30],
                            ['name' => 'Fade Haircut', 'type' => 'bookable', 'price' => 300, 'duration' => 45],
                            ['name' => 'Hot Towel Shave', 'type' => 'bookable', 'price' => 250, 'duration' => 30],
                            ['name' => 'Beard Trim', 'type' => 'bookable', 'price' => 150, 'duration' => 20],
                            ['name' => 'Hair & Beard Combo', 'type' => 'bookable', 'price' => 400, 'duration' => 60],
                        ],
                    ],
                    [
                        'name' => 'Grooming Products',
                        'services' => [
                            ['name' => 'Pomade', 'type' => 'sellable', 'price' => 350],
                            ['name' => 'Beard Oil', 'type' => 'sellable', 'price' => 280],
                            ['name' => 'After Shave', 'type' => 'sellable', 'price' => 200],
                        ],
                    ],
                ],
            ],

            'flower-shop' => [
                'description_prefix' => 'A charming flower shop specializing in',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => false,
                    'can_rent_units' => false,
                ],
                'hours' => $this->buildHours('08:00', '18:00', [0]),
                'names' => [
                    'Petals & Blooms',
                    'Garden of Eden Flowers',
                    'Blossom Lane Floristry',
                    'Flora & Fauna Flower Shop',
                    'Rosebud Flower Studio',
                    'Dahlia Dreams Florals',
                ],
                'categories' => [
                    [
                        'name' => 'Bouquets',
                        'services' => [
                            ['name' => 'Rose Bouquet', 'type' => 'sellable', 'price' => 1200],
                            ['name' => 'Sunflower Bouquet', 'type' => 'sellable', 'price' => 800],
                            ['name' => 'Mixed Flower Bouquet', 'type' => 'sellable', 'price' => 950],
                            ['name' => 'Tulip Bouquet', 'type' => 'sellable', 'price' => 1500],
                            ['name' => 'Lily Bouquet', 'type' => 'sellable', 'price' => 1100],
                        ],
                    ],
                    [
                        'name' => 'Arrangements',
                        'services' => [
                            ['name' => 'Wedding Centerpiece', 'type' => 'sellable', 'price' => 3500],
                            ['name' => 'Sympathy Arrangement', 'type' => 'sellable', 'price' => 2000],
                            ['name' => 'Birthday Arrangement', 'type' => 'sellable', 'price' => 1500],
                            ['name' => 'Corporate Arrangement', 'type' => 'sellable', 'price' => 2500],
                        ],
                    ],
                    [
                        'name' => 'Gifts & Add-ons',
                        'services' => [
                            ['name' => 'Chocolate Box', 'type' => 'sellable', 'price' => 450],
                            ['name' => 'Greeting Card', 'type' => 'sellable', 'price' => 80],
                            ['name' => 'Teddy Bear', 'type' => 'sellable', 'price' => 350],
                        ],
                    ],
                ],
            ],

            'camping-glamping' => [
                'description_prefix' => 'An outdoor adventure destination featuring',
                'capabilities' => [
                    'can_sell_products' => false,
                    'can_take_bookings' => true,
                    'can_rent_units' => true,
                ],
                'hours' => $this->buildHours('06:00', '20:00'),
                'names' => [
                    'Camp Lakeside Adventures',
                    'Pine Ridge Glamping',
                    'Wild Trail Camp',
                    'Stargazer Glamping Site',
                    'Summit View Campgrounds',
                ],
                'categories' => [
                    [
                        'name' => 'Activities',
                        'services' => [
                            ['name' => 'Guided Nature Hike', 'type' => 'bookable', 'price' => 500, 'duration' => 120],
                            ['name' => 'Campfire Experience', 'type' => 'bookable', 'price' => 300, 'duration' => 90],
                            ['name' => 'Sunrise Trek', 'type' => 'bookable', 'price' => 800, 'duration' => 180],
                        ],
                    ],
                    [
                        'name' => 'Accommodations',
                        'services' => [
                            ['name' => 'Tent Site', 'type' => 'reservation', 'price' => 800, 'price_per_night' => 800],
                            ['name' => 'Glamping Tent', 'type' => 'reservation', 'price' => 2500, 'price_per_night' => 2500],
                            ['name' => 'Tree House', 'type' => 'reservation', 'price' => 3500, 'price_per_night' => 3500],
                            ['name' => 'Cabin', 'type' => 'reservation', 'price' => 4000, 'price_per_night' => 4000],
                            ['name' => 'RV Spot', 'type' => 'reservation', 'price' => 600, 'price_per_night' => 600],
                        ],
                    ],
                ],
            ],

            'restaurant-cafe' => [
                'description_prefix' => 'A popular dining establishment serving',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
                ],
                'hours' => $this->buildHours('10:00', '22:00'),
                'names' => [
                    'Kusina ni Maria',
                    'The Hungry Fork Bistro',
                    'Sarap Pinoy Kitchen',
                    'Cafe Terraza',
                    'Luto Lola Restaurant',
                ],
                'categories' => [
                    [
                        'name' => 'Dine-In',
                        'services' => [
                            ['name' => 'Table Reservation', 'type' => 'bookable', 'price' => 0, 'duration' => 60, 'requires_confirmation' => true, 'max_capacity' => 8],
                            ['name' => 'Private Dining', 'type' => 'bookable', 'price' => 2000, 'duration' => 120, 'requires_confirmation' => true, 'max_capacity' => 12],
                        ],
                    ],
                    [
                        'name' => 'Menu Items',
                        'services' => [
                            ['name' => 'Pasta Set', 'type' => 'sellable', 'price' => 380],
                            ['name' => 'Steak Dinner', 'type' => 'sellable', 'price' => 850],
                            ['name' => 'Seafood Platter', 'type' => 'sellable', 'price' => 1200],
                            ['name' => 'Coffee & Cake Set', 'type' => 'sellable', 'price' => 280],
                            ['name' => 'Family Meal Bundle', 'type' => 'sellable', 'price' => 1500],
                            ['name' => 'Dessert Sampler', 'type' => 'sellable', 'price' => 420],
                            ['name' => 'Wine Bottle', 'type' => 'sellable', 'price' => 950],
                            ['name' => 'Chef\'s Special', 'type' => 'sellable', 'price' => 680],
                            ['name' => 'Lunch Box', 'type' => 'sellable', 'price' => 250],
                            ['name' => 'Party Tray', 'type' => 'sellable', 'price' => 2500],
                        ],
                    ],
                ],
            ],

            'fitness-gym' => [
                'description_prefix' => 'A modern fitness facility offering',
                'capabilities' => [
                    'can_sell_products' => false,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
                ],
                'hours' => $this->buildHoursWithSundayDiff('05:00', '22:00', '07:00', '18:00'),
                'names' => [
                    'Iron Temple Gym',
                    'FitZone Training Center',
                    'Flex Fitness Studio',
                ],
                'categories' => [
                    [
                        'name' => 'Personal Training',
                        'services' => [
                            ['name' => 'PT Session', 'type' => 'bookable', 'price' => 800, 'duration' => 60],
                            ['name' => 'Boxing Training', 'type' => 'bookable', 'price' => 600, 'duration' => 45],
                            ['name' => 'Yoga Session', 'type' => 'bookable', 'price' => 400, 'duration' => 60],
                            ['name' => 'CrossFit Class', 'type' => 'bookable', 'price' => 350, 'duration' => 45],
                        ],
                    ],
                    [
                        'name' => 'Group Classes',
                        'services' => [
                            ['name' => 'Zumba Class', 'type' => 'bookable', 'price' => 200, 'duration' => 60, 'max_capacity' => 20],
                            ['name' => 'Spin Class', 'type' => 'bookable', 'price' => 250, 'duration' => 45, 'max_capacity' => 15],
                        ],
                    ],
                ],
            ],

            'photography-studio' => [
                'description_prefix' => 'A professional photography studio providing',
                'capabilities' => [
                    'can_sell_products' => true,
                    'can_take_bookings' => true,
                    'can_rent_units' => false,
                ],
                'hours' => $this->buildHours('09:00', '18:00', [0]),
                'names' => [
                    'Lens & Light Studio',
                    'Captured Moments Photography',
                    'Frame Perfect Studios',
                ],
                'categories' => [
                    [
                        'name' => 'Photo Sessions',
                        'services' => [
                            ['name' => 'Portrait Session', 'type' => 'bookable', 'price' => 2500, 'duration' => 60],
                            ['name' => 'Family Photo', 'type' => 'bookable', 'price' => 3500, 'duration' => 90],
                            ['name' => 'Product Photography', 'type' => 'bookable', 'price' => 5000, 'duration' => 120],
                            ['name' => 'Event Coverage', 'type' => 'bookable', 'price' => 15000, 'duration' => 240],
                            ['name' => 'Passport Photo', 'type' => 'bookable', 'price' => 200, 'duration' => 15],
                        ],
                    ],
                    [
                        'name' => 'Prints & Packages',
                        'services' => [
                            ['name' => '8x10 Print', 'type' => 'sellable', 'price' => 350],
                            ['name' => 'Photo Album', 'type' => 'sellable', 'price' => 2500],
                            ['name' => 'Digital Package', 'type' => 'sellable', 'price' => 1500],
                        ],
                    ],
                ],
            ],
        ];
    }
}
