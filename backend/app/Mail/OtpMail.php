<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $userName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Email Verification Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.otp-verification',
            with: [
                'otp' => $this->otp,
                'userName' => $this->userName,
                'expiresInMinutes' => 10,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
