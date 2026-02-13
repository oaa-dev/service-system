<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingComplete
{
    use ApiResponse;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $this->unauthorizedResponse('Unauthenticated');
        }

        // Only enforce onboarding for merchant role users
        if (!$user->hasRole('merchant')) {
            return $next($request);
        }

        // For merchant role: email must be verified
        if ($user->email_verified_at === null) {
            return $this->errorResponse('Email verification required', 403);
        }

        // For merchant role: must have a merchant profile
        if (!$user->hasMerchant()) {
            return $this->errorResponse('Merchant profile setup required', 403);
        }

        return $next($request);
    }
}
