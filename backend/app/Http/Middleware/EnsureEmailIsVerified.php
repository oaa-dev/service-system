<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    use ApiResponse;

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return $this->unauthorizedResponse('Unauthenticated');
        }

        if ($request->user()->email_verified_at === null) {
            return $this->forbiddenResponse('Email verification required. Please verify your email address.');
        }

        return $next($request);
    }
}
