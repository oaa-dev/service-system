<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Payment $payment,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment_received',
            'title' => 'Payment Received',
            'message' => "Payment of ₱" . number_format((float) $this->payment->amount, 2) . " received for {$this->payment->payable_type} #{$this->payment->payable_id}.",
            'payment_id' => $this->payment->id,
            'payable_type' => $this->payment->payable_type,
            'payable_id' => $this->payment->payable_id,
            'amount' => $this->payment->amount,
            'currency' => $this->payment->currency,
            'payment_method' => $this->payment->payment_method,
        ];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payment Received - ₱' . number_format((float) $this->payment->amount, 2))
            ->line("Payment of ₱" . number_format((float) $this->payment->amount, 2) . " has been received.")
            ->line("Payment method: " . ($this->payment->payment_method ?? 'Online'))
            ->line("Reference: " . ($this->payment->gateway_reference ?? 'N/A'))
            ->line('Thank you for your payment!');
    }

    /**
     * Dispatch the broadcast event after the notification is stored.
     */
    public function afterCommit(): bool
    {
        return true;
    }
}
