<?php

namespace App\Services\Contracts;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Model;

interface PaymentServiceInterface
{
    public function createPaymentForTransaction(Model $payable, string $paymentMethod): Payment;

    public function requestOnlinePayment(Payment $payment): Payment;

    public function markAsCash(Payment $payment): Payment;

    public function markAsPaid(Payment $payment, ?string $reference = null): Payment;

    public function handleWebhookEvent(array $payload): void;

    public function checkPaymentStatus(Payment $payment): Payment;

    public function requestRefund(Payment $payment, ?string $reason = null): Payment;

    public function markRefunded(Payment $payment): Payment;

    public function getPaymentForTransaction(Model $payable): ?Payment;
}
