<?php

declare(strict_types=1);

namespace App\Services;

use App\Mail\OtpMail;
use App\Models\EmailVerification;
use App\Models\User;
use App\Services\Contracts\EmailVerificationServiceInterface;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class EmailVerificationService implements EmailVerificationServiceInterface
{
    private const OTP_LENGTH = 6;

    private const OTP_EXPIRY_MINUTES = 10;

    private const RESEND_COOLDOWN_MINUTES = 5;

    private const MAX_ATTEMPTS = 3;

    private const LOCKOUT_MINUTES = 30;

    public function generateAndSendOtp(User $user): void
    {
        $otp = str_pad((string) random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);

        // Delete old unverified records for this user
        EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->delete();

        // Create new verification record
        EmailVerification::create([
            'user_id' => $user->id,
            'otp_hash' => hash('sha256', $otp),
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
            'attempted_count' => 0,
            'last_resent_at' => now(),
        ]);

        Mail::to($user->email)->send(new OtpMail($otp, $user->name));
    }

    public function verifyOtp(User $user, string $otp): void
    {
        // Check if already verified
        if ($user->email_verified_at !== null) {
            throw ValidationException::withMessages([
                'otp' => ['Email is already verified.'],
            ]);
        }

        // Find the latest unverified record
        $verification = EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $verification) {
            throw ValidationException::withMessages([
                'otp' => ['No verification record found. Please request a new code.'],
            ]);
        }

        // Check lockout
        if ($verification->isLocked()) {
            $minutesRemaining = (int) now()->diffInMinutes($verification->locked_until, false);

            throw ValidationException::withMessages([
                'otp' => ["Too many failed attempts. Please try again in {$minutesRemaining} minutes."],
            ]);
        }

        // Check expiry
        if ($verification->isExpired()) {
            throw ValidationException::withMessages([
                'otp' => ['Verification code has expired. Please request a new code.'],
            ]);
        }

        // Compare OTP using hash_equals for timing-safe comparison
        $otpHash = hash('sha256', $otp);

        if (! hash_equals($verification->otp_hash, $otpHash)) {
            // Increment attempts
            $verification->increment('attempted_count');

            // Lock after max attempts
            if ($verification->attempted_count >= self::MAX_ATTEMPTS) {
                $verification->update([
                    'locked_until' => now()->addMinutes(self::LOCKOUT_MINUTES),
                ]);

                throw ValidationException::withMessages([
                    'otp' => ['Too many failed attempts. Your account has been temporarily locked for '.self::LOCKOUT_MINUTES.' minutes.'],
                ]);
            }

            $remainingAttempts = self::MAX_ATTEMPTS - $verification->attempted_count;

            throw ValidationException::withMessages([
                'otp' => ["Invalid verification code. {$remainingAttempts} attempts remaining."],
            ]);
        }

        // OTP is valid — mark as verified
        $verification->update([
            'verified_at' => now(),
        ]);

        $user->update([
            'email_verified_at' => now(),
        ]);
    }

    public function resendOtp(User $user): void
    {
        // Check if already verified
        if ($user->email_verified_at !== null) {
            throw ValidationException::withMessages([
                'otp' => ['Email is already verified.'],
            ]);
        }

        // Check cooldown
        $latestVerification = EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if ($latestVerification && $latestVerification->last_resent_at) {
            $secondsSinceLastResend = $latestVerification->last_resent_at->diffInSeconds(now());

            if ($secondsSinceLastResend < (self::RESEND_COOLDOWN_MINUTES * 60)) {
                $secondsRemaining = (self::RESEND_COOLDOWN_MINUTES * 60) - $secondsSinceLastResend;

                throw ValidationException::withMessages([
                    'otp' => ["Please wait {$secondsRemaining} seconds before requesting a new code."],
                ]);
            }
        }

        $this->generateAndSendOtp($user);
    }

    public function isVerified(User $user): bool
    {
        return $user->email_verified_at !== null;
    }

    public function cleanupExpired(): void
    {
        EmailVerification::where('expires_at', '<', now()->subDay())
            ->whereNull('verified_at')
            ->delete();
    }
}
