<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Payment;
use App\Services\Contracts\PayMongoServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService implements PayMongoServiceInterface
{
    private string $baseUrl = 'https://api.paymongo.com/v1';

    public function createCheckoutSession(Payment $payment, string $description, array $lineItems): array
    {
        $response = Http::withBasicAuth(config('paymongo.secret_key'), '')
            ->post("{$this->baseUrl}/checkout_sessions", [
                'data' => [
                    'attributes' => [
                        'line_items' => $lineItems,
                        'payment_method_types' => ['card', 'gcash', 'grab_pay', 'paymaya'],
                        'success_url' => config('paymongo.success_url').'?payment_id='.$payment->id,
                        'cancel_url' => config('paymongo.cancel_url').'?payment_id='.$payment->id,
                        'description' => $description,
                        'send_email_receipt' => true,
                        'metadata' => [
                            'payment_id' => $payment->id,
                            'payable_type' => $payment->payable_type,
                            'payable_id' => $payment->payable_id,
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error('PayMongo checkout session creation failed', [
                'status' => $response->status(),
                'body' => $response->json(),
                'payment_id' => $payment->id,
            ]);

            $errorMessage = $response->json('errors.0.detail', 'Failed to create checkout session');
            throw new ApiException($errorMessage, 502);
        }

        $data = $response->json('data');

        return [
            'checkout_session_id' => $data['id'],
            'checkout_url' => $data['attributes']['checkout_url'],
        ];
    }

    public function retrieveCheckoutSession(string $sessionId): array
    {
        $response = Http::withBasicAuth(config('paymongo.secret_key'), '')
            ->get("{$this->baseUrl}/checkout_sessions/{$sessionId}");

        if ($response->failed()) {
            Log::error('PayMongo checkout session retrieval failed', [
                'status' => $response->status(),
                'session_id' => $sessionId,
            ]);

            throw new ApiException('Failed to retrieve checkout session', 502);
        }

        $attributes = $response->json('data.attributes');

        // Determine effective payment status from checkout session
        // PayMongo checkout sessions use 'active'/'expired' as top-level status,
        // the actual payment result is in payment_intent or payments array
        $rawStatus = $attributes['status'] ?? 'unknown';
        $paymentIntentStatus = $attributes['payment_intent']['attributes']['status'] ?? null;
        $payments = $attributes['payments'] ?? [];

        // Derive a normalized status: paid, expired, or the raw status
        if ($paymentIntentStatus === 'succeeded' || $rawStatus === 'paid') {
            $effectiveStatus = 'paid';
        } elseif (! empty($payments) && collect($payments)->contains(fn ($p) => ($p['attributes']['status'] ?? null) === 'paid')) {
            $effectiveStatus = 'paid';
        } elseif ($rawStatus === 'expired') {
            $effectiveStatus = 'expired';
        } else {
            $effectiveStatus = $rawStatus;
        }

        return [
            'id' => $response->json('data.id'),
            'status' => $effectiveStatus,
            'payment_intent' => $attributes['payment_intent'] ?? null,
            'payments' => $payments,
            'payment_method_used' => $attributes['payment_method_used'] ?? null,
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secret = config('paymongo.webhook_secret');

        if (empty($secret)) {
            Log::warning('PayMongo webhook secret not configured');

            return false;
        }

        // PayMongo sends signature in format: t=timestamp,te=test_signature,li=live_signature
        $parts = collect(explode(',', $signature))
            ->mapWithKeys(function ($part) {
                [$key, $value] = explode('=', $part, 2);

                return [$key => $value];
            });

        $timestamp = $parts->get('t');
        $testSignature = $parts->get('te');
        $liveSignature = $parts->get('li');

        // Use test signature in test mode, live signature in live mode
        $expectedSignature = config('paymongo.mode') === 'test' ? $testSignature : $liveSignature;

        if (! $timestamp || ! $expectedSignature) {
            return false;
        }

        $signedPayload = $timestamp.'.'.$payload;
        $computedSignature = hash_hmac('sha256', $signedPayload, $secret);

        return hash_equals($computedSignature, $expectedSignature);
    }
}
