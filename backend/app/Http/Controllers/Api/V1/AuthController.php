<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\MerchantData;
use App\Data\UserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\SelectMerchantTypeRequest;
use App\Http\Requests\Api\V1\Auth\UpdateProfileRequest;
use App\Http\Requests\Api\V1\Auth\VerifyOtpRequest;
use App\Http\Resources\Api\V1\MerchantResource;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\EmailVerification;
use App\Models\User;
use App\Services\Contracts\EmailVerificationServiceInterface;
use App\Services\Contracts\MerchantServiceInterface;
use App\Services\Contracts\UserServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected UserServiceInterface $userService,
        protected MerchantServiceInterface $merchantService,
        protected EmailVerificationServiceInterface $emailVerificationService
    ) {}

    #[OA\Post(
        path: '/auth/register',
        summary: 'Register a new user',
        description: 'Create a new user account and return access token',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['first_name', 'last_name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'first_name', type: 'string', example: 'John'),
                    new OA\Property(property: 'last_name', type: 'string', example: 'Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'test@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8, example: 'password'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User registered successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'User registered successfully. Please verify your email.'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                                new OA\Property(property: 'access_token', type: 'string'),
                                new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                                new OA\Property(property: 'requires_verification', type: 'boolean', example: true),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $firstName = $validated['first_name'];
        $lastName = $validated['last_name'];

        // Check if an unverified user with this email already exists
        $existingUser = User::where('email', $validated['email'])->first();
        if ($existingUser && $existingUser->email_verified_at === null) {
            // Resend OTP to the existing unverified user (bypasses cooldown)
            $this->emailVerificationService->generateAndSendOtp($existingUser);

            $existingUser->load(['profile.media', 'roles', 'merchant']);
            $token = $existingUser->createToken('auth_token')->accessToken;

            return $this->createdResponse([
                'user' => new UserResource($existingUser),
                'access_token' => $token,
                'token_type' => 'Bearer',
                'requires_verification' => true,
            ], 'Verification code resent. Please verify your email.');
        }

        $data = UserData::from([
            'name' => trim("{$firstName} {$lastName}"),
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);
        $user = $this->userService->createUser($data);

        // Save first/last name to profile
        $user->profile()->update([
            'first_name' => $firstName,
            'last_name' => $lastName,
        ]);

        // Assign merchant role to newly registered users
        if ($user->roles->isEmpty()) {
            $user->assignRole('merchant');
            $user->load('roles');
        }

        // Send OTP verification email
        $this->emailVerificationService->generateAndSendOtp($user);

        $user->load(['profile.media', 'roles', 'merchant']);

        $token = $user->createToken('auth_token')->accessToken;

        return $this->createdResponse([
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'Bearer',
            'requires_verification' => true,
        ], 'User registered successfully. Please verify your email.');
    }

    #[OA\Post(
        path: '/auth/login',
        summary: 'Login user',
        description: 'Authenticate user and return access token',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'test@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Login successful'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                                new OA\Property(property: 'access_token', type: 'string'),
                                new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                                new OA\Property(property: 'requires_verification', type: 'boolean'),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Invalid credentials', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt($credentials)) {
            return $this->unauthorizedResponse('Invalid credentials');
        }

        $user = Auth::user();
        $user->load(['profile.media', 'roles', 'merchant']);
        $token = $user->createToken('auth_token')->accessToken;

        // Send OTP if email is not verified
        if ($user->email_verified_at === null) {
            $this->emailVerificationService->generateAndSendOtp($user);
        }

        return $this->successResponse([
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'Bearer',
            'requires_verification' => $user->email_verified_at === null,
        ], 'Login successful');
    }

    #[OA\Post(
        path: '/auth/logout',
        summary: 'Logout user',
        description: 'Revoke the current access token',
        tags: ['Auth'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Logged out successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Logged out successfully'),
                        new OA\Property(property: 'data', type: 'null'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function logout(Request $request): JsonResponse
    {
        $request->user()->token()->revoke();

        return $this->successResponse(null, 'Logged out successfully');
    }

    #[OA\Get(
        path: '/auth/me',
        summary: 'Get current user profile',
        description: 'Get the authenticated user profile',
        tags: ['Auth'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User profile retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'User profile retrieved successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile.media', 'roles', 'merchant']);

        return $this->successResponse(
            new UserResource($user),
            'User profile retrieved successfully'
        );
    }

    #[OA\Put(
        path: '/auth/me',
        summary: 'Update current user profile',
        description: 'Update the authenticated user profile',
        tags: ['Auth'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'first_name', type: 'string', example: 'John'),
                    new OA\Property(property: 'last_name', type: 'string', example: 'Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'test@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Profile updated successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $firstName = $data['first_name'] ?? null;
        $lastName = $data['last_name'] ?? null;
        unset($data['first_name'], $data['last_name']);

        // Update name on users table if first/last name provided
        if ($firstName !== null || $lastName !== null) {
            $currentFirst = $user->profile?->first_name ?? '';
            $currentLast = $user->profile?->last_name ?? '';
            $newFirst = $firstName ?? $currentFirst;
            $newLast = $lastName ?? $currentLast;
            $data['name'] = trim("{$newFirst} {$newLast}");

            // Update profile
            $profileData = [];
            if ($firstName !== null) $profileData['first_name'] = $firstName;
            if ($lastName !== null) $profileData['last_name'] = $lastName;
            $user->profile()->update($profileData);
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if (! empty($data)) {
            $user->update($data);
        }

        return $this->successResponse(
            new UserResource($user->fresh(['profile.media', 'roles'])),
            'Profile updated successfully'
        );
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->emailVerificationService->verifyOtp($user, $request->validated('otp'));
        $user->refresh();
        $user->load(['profile.media', 'roles', 'merchant']);

        return $this->successResponse(new UserResource($user), 'Email verified successfully');
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->emailVerificationService->resendOtp($user);

        return $this->successResponse(null, 'Verification code sent successfully');
    }

    public function verificationStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $verification = EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        return $this->successResponse([
            'is_verified' => $user->email_verified_at !== null,
            'can_resend' => $verification === null
                || $verification->last_resent_at === null
                || $verification->last_resent_at->diffInMinutes(now()) >= 5,
            'locked_until' => $verification?->isLocked() ? $verification->locked_until->toISOString() : null,
            'expires_at' => $verification && ! $verification->isExpired() ? $verification->expires_at->toISOString() : null,
        ], 'Verification status retrieved');
    }

    public function selectMerchantType(SelectMerchantTypeRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole('merchant')) {
            return $this->errorResponse('This action is only available for merchant accounts', 403);
        }

        if ($user->hasMerchant()) {
            return $this->errorResponse('You already have a merchant profile', 422);
        }

        $data = MerchantData::from([
            'type' => $request->validated('type'),
            'name' => $request->validated('name'),
            'contact_email' => $user->email,
        ]);

        $merchant = $this->merchantService->createMerchantForUser($user->id, $data);
        $user->load(['profile.media', 'roles', 'merchant']);

        return $this->createdResponse([
            'user' => new UserResource($user),
            'merchant' => new MerchantResource($merchant),
        ], 'Merchant profile created successfully');
    }
}
