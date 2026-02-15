<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveMerchant
{
    use ApiResponse;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->unauthorizedResponse('Unauthenticated');
        }

        // Only enforce for merchant role users (admin/super-admin bypass)
        if (! $user->hasAnyRole(['merchant', 'branch-merchant'])) {
            return $next($request);
        }

        $merchant = $user->merchant;

        if (! $merchant) {
            return $this->errorResponse('Merchant profile required', 403);
        }

        if (! in_array($merchant->status, ['active', 'approved'])) {
            return $this->errorResponse('Your merchant account is not active. Current status: ' . $merchant->status, 403);
        }

        return $next($request);
    }
}
