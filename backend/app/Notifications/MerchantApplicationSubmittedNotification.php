<?php

namespace App\Notifications;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MerchantApplicationSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Merchant $merchant
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
            'type' => 'merchant_application_submitted',
            'title' => 'New Merchant Application',
            'message' => "Merchant '{$this->merchant->name}' has submitted their application for review.",
            'merchant_id' => $this->merchant->id,
            'merchant_name' => $this->merchant->name,
        ];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Merchant Application Submitted')
            ->markdown('emails.merchant-application-submitted', [
                'merchantName' => $this->merchant->name,
                'merchantId' => $this->merchant->id,
                'submittedAt' => $this->merchant->submitted_at?->format('M d, Y H:i'),
            ]);
    }

    /**
     * Dispatch the broadcast event after the notification is stored.
     */
    public function afterCommit(): bool
    {
        return true;
    }
}
