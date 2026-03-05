<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use App\Notifications\PaymentReceivedNotification;
use App\Notifications\PaymentRequestedNotification;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\PayMongoServiceInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService implements PaymentServiceInterface
{
    private const VALID_TRANSITIONS = [
        'unpaid' => ['pending', 'cancelled'],
        'pending' => ['paid', 'failed', 'expired', 'cancelled'],
        'failed' => ['pending'],
        'expired' => ['pending'],
        'paid' => ['refunded'],
    ];

    public function __construct(
        protected PaymentRepositoryInterface $paymentRepository,
        protected PayMongoServiceInterface $payMongoService,
    ) {}

    public function createPaymentForTransaction(Model $payable, string $paymentMethod): Payment
    {
        $payableType = $payable->getMorphClass();

        return $this->paymentRepository->create([
            'payable_type' => $payableType,
            'payable_id' => $payable->id,
            'amount' => $payable->total_amount,
            'payment_method' => $paymentMethod,
        ]);
    }

    public function requestOnlinePayment(Payment $payment): Payment
    {
        $this->validateTransition($payment, 'pending');

        $payment->load('payable');
        $payable = $payment->payable;

        $description = ucfirst($payment->payable_type).' #'.$payment->payable_id;

        $lineItems = [
            [
                'name' => $description,
                'amount' => (int) round((float) $payment->amount * 100),
                'currency' => 'PHP',
                'quantity' => 1,
            ],
        ];

        $checkoutSession = $this->payMongoService->createCheckoutSession($payment, $description, $lineItems);

        $payment = $this->paymentRepository->update($payment->id, [
            'status' => 'pending',
            'gateway_payment_id' => $checkoutSession['checkout_session_id'] ?? null,
            'checkout_url' => $checkoutSession['checkout_url'] ?? null,
            'expires_at' => now()->addHours((int) config('paymongo.link_expiry_hours', 24)),
        ]);

        // Update payable payment_status
        $payable->update(['payment_status' => 'pending']);

        // Notify customer
        $customerUser = User::find($payable->customer_id);
        if ($customerUser) {
            $customerUser->notify(new PaymentRequestedNotification($payment));
        }

        return $payment;
    }

    public function markAsCash(Payment $payment): Payment
    {
        return $this->paymentRepository->update($payment->id, [
            'payment_method' => 'cash',
        ]);
    }

    public function markAsPaid(Payment $payment, ?string $reference = null): Payment
    {
        $this->validateTransition($payment, 'paid');

        $payment->load('payable');

        $updateData = [
            'status' => 'paid',
            'paid_at' => now(),
        ];

        if ($reference !== null) {
            $updateData['gateway_reference'] = $reference;
        }

        $payment = $this->paymentRepository->update($payment->id, $updateData);

        // Update payable payment_status
        $payment->payable->update(['payment_status' => 'paid']);

        return $payment;
    }

    public function handleWebhookEvent(array $payload): void
    {
        $eventType = $payload['data']['attributes']['type'] ?? null;
        $sessionData = $payload['data']['attributes']['data'] ?? [];

        $sessionId = $sessionData['id'] ?? null;
        if (! $sessionId) {
            return;
        }

        DB::transaction(function () use ($eventType, $sessionData, $sessionId) {
            $payment = $this->paymentRepository->findByGatewayPaymentId($sessionId);
            if (! $payment) {
                return;
            }

            // Idempotent: if already paid, do nothing
            if ($payment->isPaid()) {
                return;
            }

            $payment->load('payable.merchant');

            if ($eventType === 'checkout_session.payment.paid') {
                $this->validateTransition($payment, 'paid');

                $paymentMethodUsed = $sessionData['attributes']['payment_method_used'] ?? null;

                $updateData = [
                    'status' => 'paid',
                    'paid_at' => now(),
                ];

                if ($paymentMethodUsed) {
                    $updateData['metadata'] = array_merge($payment->metadata ?? [], [
                        'payment_method_used' => $paymentMethodUsed,
                    ]);
                }

                $this->paymentRepository->update($payment->id, $updateData);

                // Update payable payment_status
                $payment->payable->update(['payment_status' => 'paid']);

                // Notify customer
                $customerUser = User::find($payment->payable->customer_id);
                if ($customerUser) {
                    $customerUser->notify(new PaymentReceivedNotification($payment));
                }

                // Notify merchant owner
                $merchantOwner = User::find($payment->payable->merchant->user_id);
                if ($merchantOwner) {
                    $merchantOwner->notify(new PaymentReceivedNotification($payment));
                }
            } elseif ($eventType === 'payment.failed') {
                $this->validateTransition($payment, 'failed');

                $this->paymentRepository->update($payment->id, [
                    'status' => 'failed',
                ]);
            }
        });
    }

    public function checkPaymentStatus(Payment $payment): Payment
    {
        if (! $payment->gateway_payment_id) {
            return $payment;
        }

        $session = $this->payMongoService->retrieveCheckoutSession($payment->gateway_payment_id);

        $sessionStatus = $session['status'] ?? null;

        if ($sessionStatus === 'paid' && ! $payment->isPaid()) {
            $payment->load('payable');

            $this->validateTransition($payment, 'paid');

            $payment = $this->paymentRepository->update($payment->id, [
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $payment->payable->update(['payment_status' => 'paid']);
        } elseif ($sessionStatus === 'expired' && $payment->status === 'pending') {
            $this->validateTransition($payment, 'expired');

            $payment = $this->paymentRepository->update($payment->id, [
                'status' => 'expired',
            ]);
        }

        return $payment;
    }

    public function requestRefund(Payment $payment, ?string $reason = null): Payment
    {
        $metadata = array_merge($payment->metadata ?? [], [
            'refund_reason' => $reason,
            'refund_requested_at' => now()->toISOString(),
        ]);

        return $this->paymentRepository->update($payment->id, [
            'refund_status' => 'requested',
            'metadata' => $metadata,
        ]);
    }

    public function markRefunded(Payment $payment): Payment
    {
        $this->validateTransition($payment, 'refunded');

        $payment->load('payable');

        $payment = $this->paymentRepository->update($payment->id, [
            'status' => 'refunded',
            'refund_status' => 'processed',
            'refunded_at' => now(),
        ]);

        // Update payable payment_status
        $payment->payable->update(['payment_status' => 'refunded']);

        return $payment;
    }

    public function getPaymentForTransaction(Model $payable): ?Payment
    {
        $payableType = $payable->getMorphClass();

        return $this->paymentRepository->findByPayable($payableType, $payable->id);
    }

    /**
     * Validate that the given status transition is allowed.
     *
     * @throws ValidationException
     */
    private function validateTransition(Payment $payment, string $newStatus): void
    {
        $allowedTransitions = self::VALID_TRANSITIONS[$payment->status] ?? [];

        if (! in_array($newStatus, $allowedTransitions)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition payment from '{$payment->status}' to '{$newStatus}'."],
            ]);
        }
    }
}
