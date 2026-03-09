<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OtpManagementResource;
use App\Models\EmailVerification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class OtpManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $result = QueryBuilder::for(EmailVerification::class)
            ->with('user')
            ->allowedFilters([
                AllowedFilter::callback('status', function ($query, $value) {
                    match ($value) {
                        'verified' => $query->whereNotNull('verified_at'),
                        'locked' => $query->whereNull('verified_at')
                            ->whereNotNull('locked_until')
                            ->where('locked_until', '>', now()),
                        'expired' => $query->whereNull('verified_at')
                            ->where(fn ($q) => $q->whereNull('locked_until')->orWhere('locked_until', '<=', now()))
                            ->where('expires_at', '<', now()),
                        'pending' => $query->whereNull('verified_at')
                            ->where(fn ($q) => $q->whereNull('locked_until')->orWhere('locked_until', '<=', now()))
                            ->where('expires_at', '>=', now()),
                        default => $query,
                    };
                }),
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->whereHas('user', function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                            ->orWhere('email', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::callback('created_from', fn ($query, $value) => $query->where('created_at', '>=', $value)),
                AllowedFilter::callback('created_to', fn ($query, $value) => $query->where('created_at', '<=', $value)),
            ])
            ->allowedSorts(['created_at', 'expires_at', 'verified_at'])
            ->defaultSort('-created_at')
            ->paginate($request->per_page ?? 15)
            ->appends(request()->query());

        return $this->paginatedResponse($result, OtpManagementResource::class);
    }

    public function show(EmailVerification $emailVerification): JsonResponse
    {
        $emailVerification->load('user');

        return $this->successResponse(
            new OtpManagementResource($emailVerification),
            'OTP record retrieved'
        );
    }

    public function verifyUser(EmailVerification $emailVerification): JsonResponse
    {
        if ($emailVerification->isVerified()) {
            return $this->errorResponse('User is already verified.', 422);
        }

        $emailVerification->update(['verified_at' => now()]);
        $emailVerification->user->update(['email_verified_at' => now()]);
        $emailVerification->load('user');

        return $this->successResponse(
            new OtpManagementResource($emailVerification),
            'User verified successfully'
        );
    }

    public function unlockUser(EmailVerification $emailVerification): JsonResponse
    {
        if (! $emailVerification->isLocked()) {
            return $this->errorResponse('User is not locked.', 422);
        }

        $emailVerification->update(['locked_until' => null, 'attempted_count' => 0]);
        $emailVerification->load('user');

        return $this->successResponse(
            new OtpManagementResource($emailVerification),
            'User unlocked successfully'
        );
    }
}
