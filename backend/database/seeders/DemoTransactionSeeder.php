<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Merchant;
use App\Models\PlatformFee;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoTransactionSeeder extends Seeder
{
    public function run(): void
    {
        // Get customer user IDs (users with customer role, active customers only)
        $customerUserIds = User::role('customer')
            ->whereHas('customer', fn ($q) => $q->where('status', 'active'))
            ->pluck('id')
            ->toArray();

        if (empty($customerUserIds)) {
            $this->command->warn('No active customers found. Skipping transactions.');

            return;
        }

        // Get active merchants with their services
        $activeMerchants = Merchant::where('status', 'active')->get();

        if ($activeMerchants->isEmpty()) {
            $this->command->warn('No active merchants found. Skipping transactions.');

            return;
        }

        // Lookup platform fees
        $bookingFee = PlatformFee::where('transaction_type', 'booking')->where('is_active', true)->first();
        $reservationFee = PlatformFee::where('transaction_type', 'reservation')->where('is_active', true)->first();
        $sellProductFee = PlatformFee::where('transaction_type', 'sell_product')->where('is_active', true)->first();

        $bookingCount = $this->seedBookings($activeMerchants, $customerUserIds, $bookingFee);
        $reservationCount = $this->seedReservations($activeMerchants, $customerUserIds, $reservationFee);
        $orderCount = $this->seedServiceOrders($activeMerchants, $customerUserIds, $sellProductFee);

        $this->command->info("Seeded {$bookingCount} bookings, {$reservationCount} reservations, {$orderCount} service orders.");
    }

    /**
     * Seed bookings for merchants with bookable services.
     */
    private function seedBookings($merchants, array $customerUserIds, ?PlatformFee $fee): int
    {
        $bookableMerchants = $merchants->filter(fn ($m) => $m->can_take_bookings);
        $bookableServices = Service::whereIn('merchant_id', $bookableMerchants->pluck('id'))
            ->where('service_type', 'bookable')
            ->where('is_active', true)
            ->get()
            ->groupBy('merchant_id');

        if ($bookableServices->isEmpty()) {
            return 0;
        }

        $feeRate = $fee?->rate_percentage ?? 0;

        // Status distribution: 10 pending, 18 confirmed, 28 completed, 7 cancelled, 7 no_show
        $statuses = array_merge(
            array_fill(0, 10, 'pending'),
            array_fill(0, 18, 'confirmed'),
            array_fill(0, 28, 'completed'),
            array_fill(0, 7, 'cancelled'),
            array_fill(0, 7, 'no_show'),
        );
        shuffle($statuses);

        $count = 0;

        foreach ($statuses as $status) {
            // Pick a random merchant that has bookable services
            $merchantId = $bookableServices->keys()->random();
            $services = $bookableServices->get($merchantId);
            $service = $services->random();
            $customerId = $customerUserIds[array_rand($customerUserIds)];

            // Determine booking date based on status
            $bookingDate = $this->getBookingDate($status);

            // Time slot: 1-hour block within business hours
            $startHour = rand(8, 16);
            $startTime = sprintf('%02d:00', $startHour);
            $endTime = sprintf('%02d:00', $startHour + 1);

            $servicePrice = (float) $service->price;
            $feeAmount = round($servicePrice * ($feeRate / 100), 2);
            $totalAmount = round($servicePrice + $feeAmount, 2);

            $attrs = [
                'merchant_id' => $merchantId,
                'service_id' => $service->id,
                'customer_id' => $customerId,
                'booking_date' => $bookingDate->format('Y-m-d'),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'party_size' => rand(1, (int) ($service->max_capacity ?: 1)),
                'service_price' => $servicePrice,
                'fee_rate' => $feeRate,
                'fee_amount' => $feeAmount,
                'total_amount' => $totalAmount,
                'status' => $status,
                'notes' => rand(0, 3) === 0 ? fake()->sentence() : null,
            ];

            // Set timestamps based on status
            if (in_array($status, ['confirmed', 'completed'])) {
                $attrs['confirmed_at'] = $bookingDate->copy()->subDays(rand(1, 3));
            }
            if ($status === 'cancelled') {
                $attrs['cancelled_at'] = $bookingDate->copy()->subDays(rand(0, 2));
            }

            Booking::create($attrs);
            $count++;
        }

        return $count;
    }

    /**
     * Seed reservations for merchants with rentable services.
     */
    private function seedReservations($merchants, array $customerUserIds, ?PlatformFee $fee): int
    {
        $rentableMerchants = $merchants->filter(fn ($m) => $m->can_rent_units);
        $reservationServices = Service::whereIn('merchant_id', $rentableMerchants->pluck('id'))
            ->where('service_type', 'reservation')
            ->where('is_active', true)
            ->get()
            ->groupBy('merchant_id');

        if ($reservationServices->isEmpty()) {
            return 0;
        }

        $feeRate = $fee?->rate_percentage ?? 0;

        // Status distribution: 5 pending, 7 confirmed, 4 checked_in, 12 checked_out, 7 cancelled
        $statuses = array_merge(
            array_fill(0, 5, 'pending'),
            array_fill(0, 7, 'confirmed'),
            array_fill(0, 4, 'checked_in'),
            array_fill(0, 12, 'checked_out'),
            array_fill(0, 7, 'cancelled'),
        );
        shuffle($statuses);

        $count = 0;

        foreach ($statuses as $status) {
            $merchantId = $reservationServices->keys()->random();
            $services = $reservationServices->get($merchantId);
            $service = $services->random();
            $customerId = $customerUserIds[array_rand($customerUserIds)];

            $nights = rand(1, 7);
            $pricePerNight = (float) ($service->price_per_night ?: $service->price);
            $totalPrice = round($nights * $pricePerNight, 2);
            $feeAmount = round($totalPrice * ($feeRate / 100), 2);
            $totalAmount = round($totalPrice + $feeAmount, 2);

            // Determine dates based on status
            [$checkIn, $checkOut] = $this->getReservationDates($status, $nights);

            $attrs = [
                'merchant_id' => $merchantId,
                'service_id' => $service->id,
                'customer_id' => $customerId,
                'check_in' => $checkIn->format('Y-m-d'),
                'check_out' => $checkOut->format('Y-m-d'),
                'guest_count' => rand(1, (int) ($service->max_capacity ?: 4)),
                'nights' => $nights,
                'price_per_night' => $pricePerNight,
                'total_price' => $totalPrice,
                'fee_rate' => $feeRate,
                'fee_amount' => $feeAmount,
                'total_amount' => $totalAmount,
                'status' => $status,
                'notes' => rand(0, 3) === 0 ? fake()->sentence() : null,
                'special_requests' => rand(0, 4) === 0 ? fake()->sentence() : null,
            ];

            // Timestamps based on status
            if (in_array($status, ['confirmed', 'checked_in', 'checked_out'])) {
                $attrs['confirmed_at'] = $checkIn->copy()->subDays(rand(1, 5));
            }
            if (in_array($status, ['checked_in', 'checked_out'])) {
                $attrs['checked_in_at'] = $checkIn->copy()->addHours(rand(12, 16));
            }
            if ($status === 'checked_out') {
                $attrs['checked_out_at'] = $checkOut->copy()->addHours(rand(8, 12));
            }
            if ($status === 'cancelled') {
                $attrs['cancelled_at'] = $checkIn->copy()->subDays(rand(1, 7));
            }

            Reservation::create($attrs);
            $count++;
        }

        return $count;
    }

    /**
     * Seed service orders for merchants with sellable services.
     */
    private function seedServiceOrders($merchants, array $customerUserIds, ?PlatformFee $fee): int
    {
        $sellableMerchants = $merchants->filter(fn ($m) => $m->can_sell_products);
        $sellableServices = Service::whereIn('merchant_id', $sellableMerchants->pluck('id'))
            ->where('service_type', 'sellable')
            ->where('is_active', true)
            ->get()
            ->groupBy('merchant_id');

        if ($sellableServices->isEmpty()) {
            return 0;
        }

        $feeRate = $fee?->rate_percentage ?? 0;

        // Status distribution: 5 pending, 5 received, 5 processing, 5 ready, 2 delivering, 18 completed, 5 cancelled
        $statuses = array_merge(
            array_fill(0, 5, 'pending'),
            array_fill(0, 5, 'received'),
            array_fill(0, 5, 'processing'),
            array_fill(0, 5, 'ready'),
            array_fill(0, 2, 'delivering'),
            array_fill(0, 18, 'completed'),
            array_fill(0, 5, 'cancelled'),
        );
        shuffle($statuses);

        $orderCounter = 0;
        $count = 0;

        // Create orders across multiple dates for realistic order numbers
        $orderDates = collect();
        for ($i = 30; $i >= 0; $i--) {
            $orderDates->push(Carbon::now()->subDays($i));
        }

        foreach ($statuses as $status) {
            $merchantId = $sellableServices->keys()->random();
            $services = $sellableServices->get($merchantId);
            $service = $services->random();
            $customerId = $customerUserIds[array_rand($customerUserIds)];

            $orderCounter++;
            $orderDate = $this->getOrderDate($status);
            $orderNumber = 'ORD-' . $orderDate->format('Ymd') . '-' . str_pad($orderCounter, 3, '0', STR_PAD_LEFT);

            $quantity = (float) rand(1, 10);
            $unitPrice = (float) $service->price;
            $totalPrice = round($quantity * $unitPrice, 2);
            $feeAmount = round($totalPrice * ($feeRate / 100), 2);
            $totalAmount = round($totalPrice + $feeAmount, 2);

            $unitLabel = fake()->randomElement(['pcs', 'kg', 'bundle', 'set', 'box']);

            $attrs = [
                'merchant_id' => $merchantId,
                'service_id' => $service->id,
                'customer_id' => $customerId,
                'order_number' => $orderNumber,
                'quantity' => $quantity,
                'unit_label' => $unitLabel,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'fee_rate' => $feeRate,
                'fee_amount' => $feeAmount,
                'total_amount' => $totalAmount,
                'status' => $status,
                'notes' => rand(0, 3) === 0 ? fake()->sentence() : null,
            ];

            // Timestamps based on status
            if (in_array($status, ['received', 'processing', 'ready', 'delivering', 'completed'])) {
                $attrs['received_at'] = $orderDate->copy()->addHours(rand(1, 4));
            }
            if ($status === 'completed') {
                $attrs['completed_at'] = $orderDate->copy()->addDays(rand(1, 5));
            }
            if ($status === 'cancelled') {
                $attrs['cancelled_at'] = $orderDate->copy()->addHours(rand(1, 24));
            }

            ServiceOrder::create($attrs);
            $count++;
        }

        return $count;
    }

    /**
     * Get appropriate booking date based on status.
     */
    private function getBookingDate(string $status): Carbon
    {
        return match ($status) {
            'pending', 'confirmed' => Carbon::now()->addDays(rand(1, 14)),
            'completed', 'no_show' => Carbon::now()->subDays(rand(1, 30)),
            'cancelled' => Carbon::now()->subDays(rand(0, 20)),
        };
    }

    /**
     * Get appropriate reservation dates based on status.
     */
    private function getReservationDates(string $status, int $nights): array
    {
        $checkIn = match ($status) {
            'pending', 'confirmed' => Carbon::now()->addDays(rand(3, 30)),
            'checked_in' => Carbon::now()->subDays(rand(0, 2)),
            'checked_out' => Carbon::now()->subDays(rand($nights + 1, $nights + 30)),
            'cancelled' => Carbon::now()->addDays(rand(1, 20)),
        };
        $checkOut = $checkIn->copy()->addDays($nights);

        return [$checkIn, $checkOut];
    }

    /**
     * Get appropriate order date based on status.
     */
    private function getOrderDate(string $status): Carbon
    {
        return match ($status) {
            'pending', 'received', 'processing', 'ready', 'delivering' => Carbon::now()->subDays(rand(0, 5)),
            'completed' => Carbon::now()->subDays(rand(3, 30)),
            'cancelled' => Carbon::now()->subDays(rand(1, 15)),
        };
    }
}
