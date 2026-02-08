<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! $request->user()) {
            return $this->unauthorizedResponse('Unauthenticated');
        }

        if (! $request->user()->can($permission)) {
            return $this->forbiddenResponse('You do not have permission to perform this action');
        }

        return $next($request);
    }
}
