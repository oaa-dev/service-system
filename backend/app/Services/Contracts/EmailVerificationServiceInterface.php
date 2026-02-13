<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\User;

interface EmailVerificationServiceInterface
{
    public function generateAndSendOtp(User $user): void;

    public function verifyOtp(User $user, string $otp): void;

    public function resendOtp(User $user): void;

    public function isVerified(User $user): bool;

    public function cleanupExpired(): void;
}
