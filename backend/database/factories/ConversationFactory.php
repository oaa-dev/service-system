<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'merchant_id' => Merchant::factory(),
            'customer_id' => User::factory(),
            'conversable_type' => 'booking',
            'conversable_id' => 1,
            'last_message_at' => null,
        ];
    }

    public function forBooking(): static
    {
        return $this->state(fn () => [
            'conversable_type' => 'booking',
        ]);
    }

    public function forReservation(): static
    {
        return $this->state(fn () => [
            'conversable_type' => 'reservation',
        ]);
    }

    public function forServiceOrder(): static
    {
        return $this->state(fn () => [
            'conversable_type' => 'service_order',
        ]);
    }

    public function withLastMessage(): static
    {
        return $this->state(fn () => [
            'last_message_at' => now(),
        ]);
    }
}
