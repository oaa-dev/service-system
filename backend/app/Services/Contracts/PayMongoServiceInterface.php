<?php

namespace App\Services\Contracts;

use App\Models\Payment;

interface PayMongoServiceInterface
{
    public function createCheckoutSession(Payment $payment, string $description, array $lineItems): array;

    public function retrieveCheckoutSession(string $sessionId): array;

    public function verifyWebhookSignature(string $payload, string $signature): bool;
}
