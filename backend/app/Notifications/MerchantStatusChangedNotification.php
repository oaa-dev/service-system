<?php

namespace App\Notifications;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MerchantStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Merchant $merchant,
        public string $oldStatus,
        public string $newStatus,
        public ?string $reason = null,
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
            'type' => 'merchant_status_changed',
            'title' => 'Merchant Status Updated',
            'message' => "Your merchant '{$this->merchant->name}' status has been changed from '{$this->oldStatus}' to '{$this->newStatus}'.",
            'merchant_id' => $this->merchant->id,
            'merchant_name' => $this->merchant->name,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'reason' => $this->reason,
        ];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Merchant Application: ' . ucfirst($this->newStatus))
            ->markdown('emails.merchant-status-changed', [
                'merchantName' => $this->merchant->name,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
                'reason' => $this->reason,
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
