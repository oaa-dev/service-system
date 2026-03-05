<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DeployController;
use App\Http\Controllers\Api\V1\BusinessTypeController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\DocumentTypeController;
use App\Http\Controllers\Api\V1\GeographicController;
use App\Http\Controllers\Api\V1\MerchantController;
use App\Http\Controllers\Api\V1\MyMerchantController;
use App\Http\Controllers\Api\V1\MerchantBookingSlotController;
use App\Http\Controllers\Api\V1\MessagingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CustomerTagController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\FieldController;
use App\Http\Controllers\Api\V1\MerchantServiceCategoryController;
use App\Http\Controllers\Api\V1\PlatformFeeController;
use App\Http\Controllers\Api\V1\MerchantServiceController;
use App\Http\Controllers\Api\V1\ReservationController;
use App\Http\Controllers\Api\V1\ServiceOrderController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\CustomerPortalController;
use App\Http\Controllers\Api\V1\CustomerReviewController;
use App\Http\Controllers\Api\V1\MerchantReviewController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\CustomerLoyaltyController;
use App\Http\Controllers\Api\V1\LoyaltyController;
use App\Http\Controllers\Api\V1\LoyaltyProgramController;
use App\Http\Controllers\Api\V1\CustomerReferralController;
use App\Http\Controllers\Api\V1\ReferralProgramController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PayMongoWebhookController;
use App\Http\Controllers\Api\V1\SocialPlatformController;
use App\Http\Controllers\Api\V1\StorefrontController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    // Config routes (public)
    Route::get('config/images', [ConfigController::class, 'images']);

    // Deploy routes (protected by deploy key)
    Route::get('deploy/seed', [DeployController::class, 'seed']);
    Route::get('deploy/seed-psgc', [DeployController::class, 'seedPsgc']);
    Route::get('deploy/migrate', [DeployController::class, 'migrate']);
    Route::get('deploy/migrate-fresh', [DeployController::class, 'migrateFresh']);

    // Public reference data routes (active items for forms)
    Route::get('payment-methods/active', [PaymentMethodController::class, 'active']);
    Route::get('document-types/active', [DocumentTypeController::class, 'active']);
    Route::get('business-types/active', [BusinessTypeController::class, 'active']);
    Route::get('social-platforms/active', [SocialPlatformController::class, 'active']);
    Route::get('customer-tags/active', [CustomerTagController::class, 'active']);
    Route::get('platform-fees/active', [PlatformFeeController::class, 'active']);
    Route::get('fields/active', [FieldController::class, 'active']);

    // Public geographic data routes (PSGC)
    Route::get('geographic/regions', [GeographicController::class, 'regions']);
    Route::get('geographic/regions/{region}/provinces', [GeographicController::class, 'provinces']);
    Route::get('geographic/provinces/{province}/cities', [GeographicController::class, 'cities']);
    Route::get('geographic/cities/{city}/barangays', [GeographicController::class, 'barangays']);

    // Storefront routes (public)
    Route::prefix('storefront')->group(function () {
        Route::get('business-types', [StorefrontController::class, 'businessTypes']);
        Route::get('payment-methods', [StorefrontController::class, 'paymentMethods']);
        Route::get('merchants/map', [StorefrontController::class, 'mapMerchants']);
        Route::get('merchants', [StorefrontController::class, 'merchants']);
        Route::get('merchants/{slug}', [StorefrontController::class, 'merchantDetail']);
        Route::get('merchants/{slug}/services', [StorefrontController::class, 'merchantServices']);
        Route::get('merchants/{slug}/services/{service}', [StorefrontController::class, 'serviceDetail']);
        Route::get('merchants/{slug}/services/{service}/booking-availability', [StorefrontController::class, 'bookingAvailability']);
        Route::get('merchants/{slug}/services/{service}/reservation-availability', [StorefrontController::class, 'reservationAvailability']);
        Route::get('merchants/{slug}/branches', [StorefrontController::class, 'branches']);
        Route::get('merchants/{slug}/reviews', [StorefrontController::class, 'merchantReviews']);

        // Referral code validation (public)
        Route::get('referral/{code}', [CustomerReferralController::class, 'validateCode']);
    });

    // Webhook routes (public, signature-verified)
    Route::post('webhooks/paymongo', [PayMongoWebhookController::class, 'handle']);

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        // === Routes that do NOT require verification or onboarding ===
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp']);
        Route::post('auth/resend-otp', [AuthController::class, 'resendOtp']);
        Route::get('auth/verification-status', [AuthController::class, 'verificationStatus']);
        Route::post('auth/select-merchant-type', [AuthController::class, 'selectMerchantType']);

        // === Routes that require verified email + completed onboarding ===
        Route::middleware(['ensure.verified', 'onboarding'])->group(function () {
            // Auth profile update (requires verification)
            Route::put('auth/me', [AuthController::class, 'updateProfile']);

            // My Merchant self-service routes (auto-detect merchant from auth user)
            Route::prefix('auth/merchant')->group(function () {
                // Always accessible (for onboarding + settings)
                Route::get('/', [MyMerchantController::class, 'show']);
                Route::get('/stats', [MyMerchantController::class, 'stats']);
                Route::get('/onboarding-checklist', [MyMerchantController::class, 'onboardingChecklist']);
                Route::get('/status-logs', [MyMerchantController::class, 'statusLogs']);
                Route::post('/submit-application', [MyMerchantController::class, 'submitApplication']);
                Route::put('/', [MyMerchantController::class, 'update']);
                Route::post('/logo', [MyMerchantController::class, 'uploadLogo']);
                Route::delete('/logo', [MyMerchantController::class, 'deleteLogo']);
                Route::put('/business-hours', [MyMerchantController::class, 'updateBusinessHours']);
                Route::post('/payment-methods', [MyMerchantController::class, 'syncPaymentMethods']);
                Route::post('/social-links', [MyMerchantController::class, 'syncSocialLinks']);
                Route::post('/documents', [MyMerchantController::class, 'uploadDocument']);
                Route::delete('/documents/{document}', [MyMerchantController::class, 'deleteDocument']);

                // Calendar views
                Route::get('/bookings/calendar', [MyMerchantController::class, 'bookingsCalendar']);
                Route::get('/reservations/calendar', [MyMerchantController::class, 'reservationsCalendar']);

                // Booking slots (self-service)
                Route::get('/booking-slots', [MerchantBookingSlotController::class, 'index']);
                Route::post('/booking-slots', [MerchantBookingSlotController::class, 'store']);
                Route::get('/booking-slots/{slot}', [MerchantBookingSlotController::class, 'show']);
                Route::put('/booking-slots/{slot}', [MerchantBookingSlotController::class, 'update']);
                Route::delete('/booking-slots/{slot}', [MerchantBookingSlotController::class, 'destroy']);

                // Branch management (organization merchants only)
                Route::get('/branches', [MyMerchantController::class, 'branches']);
                Route::post('/branches', [MyMerchantController::class, 'storeBranch']);
                Route::get('/branches/{branch}', [MyMerchantController::class, 'showBranch']);
                Route::put('/branches/{branch}', [MyMerchantController::class, 'updateBranch']);
                Route::delete('/branches/{branch}', [MyMerchantController::class, 'destroyBranch']);

                // Organization managing branch settings/gallery
                Route::prefix('branches/{branch}')->group(function () {
                    Route::get('/detail', [MyMerchantController::class, 'showBranchDetail']);
                    Route::put('/detail', [MyMerchantController::class, 'updateBranchDetails']);
                    Route::post('/logo', [MyMerchantController::class, 'uploadBranchLogo']);
                    Route::delete('/logo', [MyMerchantController::class, 'deleteBranchLogo']);
                    Route::get('/gallery', [MyMerchantController::class, 'getBranchGallery']);
                    Route::post('/gallery/{collection}', [MyMerchantController::class, 'uploadBranchGalleryImage']);
                    Route::delete('/gallery/{media}', [MyMerchantController::class, 'deleteBranchGalleryImage']);
                    Route::put('/business-hours', [MyMerchantController::class, 'updateBranchBusinessHours']);
                    Route::post('/payment-methods', [MyMerchantController::class, 'syncBranchPaymentMethods']);
                    Route::post('/social-links', [MyMerchantController::class, 'syncBranchSocialLinks']);
                });

                // Requires active merchant
                Route::middleware('merchant.active')->group(function () {
                    Route::get('/gallery', [MyMerchantController::class, 'getGallery']);
                    Route::post('/gallery/{collection}', [MyMerchantController::class, 'uploadGalleryImage']);
                    Route::delete('/gallery/{media}', [MyMerchantController::class, 'deleteGalleryImage']);
                });

                // Loyalty program management (self-service)
                Route::get('/loyalty-program', [LoyaltyProgramController::class, 'show']);
                Route::post('/loyalty-program', [LoyaltyProgramController::class, 'store']);
                Route::delete('/loyalty-program', [LoyaltyProgramController::class, 'destroy']);

                // Loyalty QR + cards (self-service)
                Route::post('/loyalty/generate-qr', [LoyaltyController::class, 'generateQr']);
                Route::get('/loyalty-cards', [LoyaltyController::class, 'index']);
                Route::get('/loyalty-cards/{id}', [LoyaltyController::class, 'show']);
                Route::post('/loyalty-cards/{id}/stamp', [LoyaltyController::class, 'awardStamp']);

                // Referral program management (self-service)
                Route::get('/referral-program', [ReferralProgramController::class, 'show']);
                Route::post('/referral-program', [ReferralProgramController::class, 'store']);
                Route::delete('/referral-program', [ReferralProgramController::class, 'destroy']);
                Route::get('/referrals', [ReferralProgramController::class, 'referrals']);
                Route::get('/referral-stats', [ReferralProgramController::class, 'stats']);
            });

            // User management routes with permission middleware
            Route::middleware('permission:users.view')->group(function () {
                Route::get('users', [UserController::class, 'index']);
                Route::get('users/{user}', [UserController::class, 'show']);
            });
            Route::middleware('permission:users.create')->post('users', [UserController::class, 'store']);
            Route::middleware('permission:users.update')->put('users/{user}', [UserController::class, 'update']);
            Route::middleware('permission:users.update')->post('users/{user}/roles', [UserController::class, 'syncRoles']);
            Route::middleware('permission:users.delete')->delete('users/{user}', [UserController::class, 'destroy']);

            // Role management routes
            Route::get('roles/all', [RoleController::class, 'all']);
            Route::middleware('permission:roles.view')->group(function () {
                Route::get('roles', [RoleController::class, 'index']);
                Route::get('roles/{role}', [RoleController::class, 'show']);
            });
            Route::middleware('permission:roles.create')->post('roles', [RoleController::class, 'store']);
            Route::middleware('permission:roles.update')->group(function () {
                Route::put('roles/{role}', [RoleController::class, 'update']);
                Route::post('roles/{role}/permissions', [RoleController::class, 'syncPermissions']);
            });
            Route::middleware('permission:roles.delete')->delete('roles/{role}', [RoleController::class, 'destroy']);

            // Payment method management routes
            Route::get('payment-methods/all', [PaymentMethodController::class, 'all']);
            Route::middleware('permission:payment_methods.view')->group(function () {
                Route::get('payment-methods', [PaymentMethodController::class, 'index']);
                Route::get('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'show']);
            });
            Route::middleware('permission:payment_methods.create')->post('payment-methods', [PaymentMethodController::class, 'store']);
            Route::middleware('permission:payment_methods.update')->put('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update']);
            Route::middleware('permission:payment_methods.delete')->delete('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy']);

            // Document type management routes
            Route::get('document-types/all', [DocumentTypeController::class, 'all']);
            Route::middleware('permission:document_types.view')->group(function () {
                Route::get('document-types', [DocumentTypeController::class, 'index']);
                Route::get('document-types/{documentType}', [DocumentTypeController::class, 'show']);
            });
            Route::middleware('permission:document_types.create')->post('document-types', [DocumentTypeController::class, 'store']);
            Route::middleware('permission:document_types.update')->put('document-types/{documentType}', [DocumentTypeController::class, 'update']);
            Route::middleware('permission:document_types.delete')->delete('document-types/{documentType}', [DocumentTypeController::class, 'destroy']);

            // Business type management routes
            Route::get('business-types/all', [BusinessTypeController::class, 'all']);
            Route::middleware('permission:business_types.view')->group(function () {
                Route::get('business-types', [BusinessTypeController::class, 'index']);
                Route::get('business-types/{businessType}', [BusinessTypeController::class, 'show']);
                Route::get('business-types/{businessType}/fields', [BusinessTypeController::class, 'getFields']);
            });
            Route::middleware('permission:business_types.create')->post('business-types', [BusinessTypeController::class, 'store']);
            Route::middleware('permission:business_types.update')->group(function () {
                Route::put('business-types/{businessType}', [BusinessTypeController::class, 'update']);
                Route::put('business-types/{businessType}/fields', [BusinessTypeController::class, 'syncFields']);
            });
            Route::middleware('permission:business_types.delete')->delete('business-types/{businessType}', [BusinessTypeController::class, 'destroy']);

            // Social platform management routes
            Route::get('social-platforms/all', [SocialPlatformController::class, 'all']);
            Route::middleware('permission:social_platforms.view')->group(function () {
                Route::get('social-platforms', [SocialPlatformController::class, 'index']);
                Route::get('social-platforms/{socialPlatform}', [SocialPlatformController::class, 'show']);
            });
            Route::middleware('permission:social_platforms.create')->post('social-platforms', [SocialPlatformController::class, 'store']);
            Route::middleware('permission:social_platforms.update')->put('social-platforms/{socialPlatform}', [SocialPlatformController::class, 'update']);
            Route::middleware('permission:social_platforms.delete')->delete('social-platforms/{socialPlatform}', [SocialPlatformController::class, 'destroy']);

            // Customer tag management routes
            Route::get('customer-tags/all', [CustomerTagController::class, 'all']);
            Route::middleware('permission:customer_tags.view')->group(function () {
                Route::get('customer-tags', [CustomerTagController::class, 'index']);
                Route::get('customer-tags/{customerTag}', [CustomerTagController::class, 'show']);
            });
            Route::middleware('permission:customer_tags.create')->post('customer-tags', [CustomerTagController::class, 'store']);
            Route::middleware('permission:customer_tags.update')->put('customer-tags/{customerTag}', [CustomerTagController::class, 'update']);
            Route::middleware('permission:customer_tags.delete')->delete('customer-tags/{customerTag}', [CustomerTagController::class, 'destroy']);

            // Platform fee management routes
            Route::get('platform-fees/all', [PlatformFeeController::class, 'all']);
            Route::middleware('permission:platform_fees.view')->group(function () {
                Route::get('platform-fees', [PlatformFeeController::class, 'index']);
                Route::get('platform-fees/{platformFee}', [PlatformFeeController::class, 'show']);
            });
            Route::middleware('permission:platform_fees.create')->post('platform-fees', [PlatformFeeController::class, 'store']);
            Route::middleware('permission:platform_fees.update')->put('platform-fees/{platformFee}', [PlatformFeeController::class, 'update']);
            Route::middleware('permission:platform_fees.delete')->delete('platform-fees/{platformFee}', [PlatformFeeController::class, 'destroy']);

            // Field management routes
            Route::get('fields/all', [FieldController::class, 'all']);
            Route::middleware('permission:fields.view')->group(function () {
                Route::get('fields', [FieldController::class, 'index']);
                Route::get('fields/{field}', [FieldController::class, 'show']);
            });
            Route::middleware('permission:fields.create')->post('fields', [FieldController::class, 'store']);
            Route::middleware('permission:fields.update')->put('fields/{field}', [FieldController::class, 'update']);
            Route::middleware('permission:fields.delete')->delete('fields/{field}', [FieldController::class, 'destroy']);

            // Customer management routes
            Route::middleware('permission:customers.view')->group(function () {
                Route::get('customers', [CustomerController::class, 'index']);
                Route::get('customers/{customer}', [CustomerController::class, 'show']);
                Route::get('customers/{customer}/interactions', [CustomerController::class, 'interactions']);
            });
            Route::middleware('permission:customers.create')->post('customers', [CustomerController::class, 'store']);
            Route::middleware('permission:customers.update')->group(function () {
                Route::put('customers/{customer}', [CustomerController::class, 'update']);
                Route::put('customers/{customer}/profile', [CustomerController::class, 'updateProfile']);
                Route::put('customers/{customer}/account', [CustomerController::class, 'updateAccount']);
                Route::post('customers/{customer}/avatar', [CustomerController::class, 'uploadAvatar']);
                Route::delete('customers/{customer}/avatar', [CustomerController::class, 'deleteAvatar']);
                Route::post('customers/{customer}/documents', [CustomerController::class, 'uploadDocument']);
                Route::delete('customers/{customer}/documents/{document}', [CustomerController::class, 'deleteDocument']);
                Route::post('customers/{customer}/tags', [CustomerController::class, 'syncTags']);
                Route::post('customers/{customer}/interactions', [CustomerController::class, 'storeInteraction']);
                Route::delete('customers/{customer}/interactions/{interaction}', [CustomerController::class, 'destroyInteraction']);
                Route::patch('customers/{customer}/verify-identity', [CustomerController::class, 'verifyIdentity']);
                Route::patch('customers/{customer}/reject-identity', [CustomerController::class, 'rejectIdentity']);
            });
            Route::middleware('permission:customers.update_status')->patch('customers/{customer}/status', [CustomerController::class, 'updateStatus']);
            Route::middleware('permission:customers.delete')->delete('customers/{customer}', [CustomerController::class, 'destroy']);

            // Merchant management routes
            Route::get('merchants/all', [MerchantController::class, 'all']);
            Route::middleware('permission:merchants.view')->group(function () {
                Route::get('merchants', [MerchantController::class, 'index']);
                Route::get('merchants/{merchant}', [MerchantController::class, 'show']);
                Route::get('merchants/{merchant}/gallery', [MerchantController::class, 'getGallery']);
                Route::get('merchants/{merchant}/status-logs', [MerchantController::class, 'statusLogs']);
                Route::get('merchants/{merchant}/branches', [MerchantController::class, 'branches']);
                Route::get('merchants/{merchant}/branches/{branch}', [MerchantController::class, 'showBranch']);
            });
            Route::middleware('permission:merchants.create')->group(function () {
                Route::post('merchants', [MerchantController::class, 'store']);
                Route::post('merchants/{merchant}/branches', [MerchantController::class, 'storeBranch']);
            });
            // Merchant booking slot admin routes
            Route::middleware('permission:merchants.update')->group(function () {
                Route::get('merchants/{merchant}/booking-slots', [MerchantBookingSlotController::class, 'index']);
                Route::post('merchants/{merchant}/booking-slots', [MerchantBookingSlotController::class, 'store']);
                Route::put('merchants/{merchant}/booking-slots/{slot}', [MerchantBookingSlotController::class, 'update']);
                Route::delete('merchants/{merchant}/booking-slots/{slot}', [MerchantBookingSlotController::class, 'destroy']);
            });

            Route::middleware('permission:merchants.update')->group(function () {
                Route::put('merchants/{merchant}', [MerchantController::class, 'update']);
                Route::put('merchants/{merchant}/branches/{branch}', [MerchantController::class, 'updateBranch']);
                Route::post('merchants/{merchant}/logo', [MerchantController::class, 'uploadLogo']);
                Route::delete('merchants/{merchant}/logo', [MerchantController::class, 'deleteLogo']);
                Route::put('merchants/{merchant}/business-hours', [MerchantController::class, 'updateBusinessHours']);
                Route::post('merchants/{merchant}/payment-methods', [MerchantController::class, 'syncPaymentMethods']);
                Route::post('merchants/{merchant}/social-links', [MerchantController::class, 'syncSocialLinks']);
                Route::post('merchants/{merchant}/documents', [MerchantController::class, 'uploadDocument']);
                Route::delete('merchants/{merchant}/documents/{document}', [MerchantController::class, 'deleteDocument']);
                Route::put('merchants/{merchant}/account', [MerchantController::class, 'updateAccount']);
                Route::post('merchants/{merchant}/gallery/{collection}', [MerchantController::class, 'uploadGalleryImage']);
                Route::delete('merchants/{merchant}/gallery/{media}', [MerchantController::class, 'deleteGalleryImage']);
            });
            // Admin loyalty program routes
            Route::middleware('permission:loyalty_programs.view')->get('merchants/{merchant}/loyalty-program', [LoyaltyProgramController::class, 'adminShow']);
            Route::middleware('permission:loyalty_programs.update')->put('merchants/{merchant}/loyalty-program', [LoyaltyProgramController::class, 'adminUpdate']);

            // Admin referral program routes
            Route::middleware('permission:referral_programs.view')->get('merchants/{merchant}/referral-program', [ReferralProgramController::class, 'adminShow']);
            Route::middleware('permission:referral_programs.update')->put('merchants/{merchant}/referral-program', [ReferralProgramController::class, 'adminUpdate']);

            Route::middleware('permission:merchants.update_status')->patch('merchants/{merchant}/status', [MerchantController::class, 'updateStatus']);
            Route::middleware('permission:merchants.delete')->group(function () {
                Route::delete('merchants/{merchant}', [MerchantController::class, 'destroy']);
                Route::delete('merchants/{merchant}/branches/{branch}', [MerchantController::class, 'destroyBranch']);
            });

            // Merchant service routes
            Route::middleware('permission:services.view')->group(function () {
                Route::get('merchants/{merchant}/services', [MerchantServiceController::class, 'index']);
                Route::get('merchants/{merchant}/services/{service}', [MerchantServiceController::class, 'show']);
            });
            Route::middleware('permission:services.create')->post('merchants/{merchant}/services', [MerchantServiceController::class, 'store']);
            Route::middleware('permission:services.update')->group(function () {
                Route::put('merchants/{merchant}/services/{service}', [MerchantServiceController::class, 'update']);
                Route::post('merchants/{merchant}/services/{service}/image', [MerchantServiceController::class, 'uploadImage']);
                Route::delete('merchants/{merchant}/services/{service}/image', [MerchantServiceController::class, 'deleteImage']);
                Route::get('merchants/{merchant}/services/{service}/schedules', [MerchantServiceController::class, 'getSchedules']);
                Route::put('merchants/{merchant}/services/{service}/schedules', [MerchantServiceController::class, 'updateSchedules']);
            });
            Route::middleware('permission:services.delete')->delete('merchants/{merchant}/services/{service}', [MerchantServiceController::class, 'destroy']);

            // Booking routes
            Route::middleware('permission:bookings.view')->group(function () {
                Route::get('merchants/{merchant}/bookings', [BookingController::class, 'index']);
                Route::get('merchants/{merchant}/bookings/{booking}', [BookingController::class, 'show']);
            });
            Route::middleware('permission:bookings.create')->post('merchants/{merchant}/bookings', [BookingController::class, 'store']);
            Route::middleware('permission:bookings.update_status')->patch('merchants/{merchant}/bookings/{booking}/status', [BookingController::class, 'updateStatus']);

            // Reservation routes
            Route::middleware('permission:reservations.view')->group(function () {
                Route::get('merchants/{merchant}/reservations', [ReservationController::class, 'index']);
                Route::get('merchants/{merchant}/reservations/{reservation}', [ReservationController::class, 'show']);
            });
            Route::middleware('permission:reservations.create')->post('merchants/{merchant}/reservations', [ReservationController::class, 'store']);
            Route::middleware('permission:reservations.update_status')->patch('merchants/{merchant}/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);

            // Service order routes
            Route::middleware('permission:service_orders.view')->group(function () {
                Route::get('merchants/{merchant}/service-orders', [ServiceOrderController::class, 'index']);
                Route::get('merchants/{merchant}/service-orders/{serviceOrder}', [ServiceOrderController::class, 'show']);
            });
            Route::middleware('permission:service_orders.create')->post('merchants/{merchant}/service-orders', [ServiceOrderController::class, 'store']);
            Route::middleware('permission:service_orders.update_status')->patch('merchants/{merchant}/service-orders/{serviceOrder}/status', [ServiceOrderController::class, 'updateStatus']);

            // Merchant service category routes
            Route::middleware('permission:service_categories.view')->group(function () {
                Route::get('merchants/{merchant}/service-categories', [MerchantServiceCategoryController::class, 'index']);
                Route::get('merchants/{merchant}/service-categories/all', [MerchantServiceCategoryController::class, 'all']);
                Route::get('merchants/{merchant}/service-categories/active', [MerchantServiceCategoryController::class, 'active']);
                Route::get('merchants/{merchant}/service-categories/{serviceCategory}', [MerchantServiceCategoryController::class, 'show']);
            });
            Route::middleware('permission:service_categories.create')->post('merchants/{merchant}/service-categories', [MerchantServiceCategoryController::class, 'store']);
            Route::middleware('permission:service_categories.update')->put('merchants/{merchant}/service-categories/{serviceCategory}', [MerchantServiceCategoryController::class, 'update']);
            Route::middleware('permission:service_categories.delete')->delete('merchants/{merchant}/service-categories/{serviceCategory}', [MerchantServiceCategoryController::class, 'destroy']);

            // Permission routes
            Route::middleware('permission:roles.view')->group(function () {
                Route::get('permissions', [PermissionController::class, 'index']);
                Route::get('permissions/grouped', [PermissionController::class, 'grouped']);
            });

            // Profile routes
            Route::get('profile', [ProfileController::class, 'show']);
            Route::put('profile', [ProfileController::class, 'update']);
            Route::put('profile/password', [ProfileController::class, 'changePassword']);
            Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('profile/avatar', [ProfileController::class, 'deleteAvatar']);
            Route::get('profile/customer', [ProfileController::class, 'showCustomer']);
            Route::put('profile/customer', [ProfileController::class, 'updateCustomer']);

            // Notification routes
            Route::get('notifications', [NotificationController::class, 'index']);
            Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
            Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

            // Messaging routes
            Route::get('conversations', [MessagingController::class, 'conversations']);
            Route::get('conversations/{conversationId}/messages', [MessagingController::class, 'messages']);
            Route::post('conversations/{conversationId}/messages', [MessagingController::class, 'sendMessage']);
            Route::post('conversations/{conversationId}/read', [MessagingController::class, 'markAsRead']);
            Route::get('messages/unread-count', [MessagingController::class, 'unreadCount']);

            // Admin review moderation routes
            Route::middleware('permission:reviews.view')->get('reviews', [ReviewController::class, 'index']);
            Route::middleware('permission:reviews.moderate')->group(function () {
                Route::patch('reviews/{review}/toggle-publish', [ReviewController::class, 'togglePublish']);
                Route::put('reviews/{review}/notes', [ReviewController::class, 'updateNotes']);
            });

            // Merchant self-service review routes
            Route::prefix('auth/merchant')->group(function () {
                Route::get('/reviews', [MerchantReviewController::class, 'index']);
                Route::post('/reviews/{review}/reply', [MerchantReviewController::class, 'reply']);
                Route::put('/reviews/{review}/reply', [MerchantReviewController::class, 'updateReply']);
                Route::delete('/reviews/{review}/reply', [MerchantReviewController::class, 'deleteReply']);
            });

            // Customer portal review routes
            Route::group([], function () {
                Route::post('customer/merchants/{merchantId}/reviews', [CustomerReviewController::class, 'store']);
                Route::put('customer/reviews/{review}', [CustomerReviewController::class, 'update']);
                Route::delete('customer/reviews/{review}', [CustomerReviewController::class, 'destroy']);
                Route::get('customer/reviews', [CustomerReviewController::class, 'myReviews']);
            });

            // Customer Loyalty routes
            Route::post('customer/loyalty/scan', [CustomerLoyaltyController::class, 'scan'])->middleware('permission:customer_portal.scan_loyalty');
            Route::get('customer/loyalty-cards', [CustomerLoyaltyController::class, 'cards'])->middleware('permission:customer_portal.view_loyalty');
            Route::get('customer/loyalty-cards/{id}', [CustomerLoyaltyController::class, 'cardDetail'])->middleware('permission:customer_portal.view_loyalty');
            Route::get('customer/loyalty-rewards', [CustomerLoyaltyController::class, 'rewards'])->middleware('permission:customer_portal.view_loyalty');

            // Customer Referral routes
            Route::post('customer/referrals/generate/{merchant}', [CustomerReferralController::class, 'generateCode'])->middleware('permission:customer_portal.referral');
            Route::get('customer/referral-codes', [CustomerReferralController::class, 'myCodes'])->middleware('permission:customer_portal.referral');
            Route::get('customer/referrals', [CustomerReferralController::class, 'myReferrals'])->middleware('permission:customer_portal.referral');
            Route::get('customer/referral-rewards', [CustomerReferralController::class, 'myRewards'])->middleware('permission:customer_portal.referral');
            Route::post('customer/referrals/accept', [CustomerReferralController::class, 'accept'])->middleware('permission:customer_portal.referral');

            // Payment routes
            Route::prefix('payments')->middleware('permission:payments.view')->group(function () {
                Route::get('{payment}', [PaymentController::class, 'show']);
                Route::post('{payment}/mark-paid', [PaymentController::class, 'markAsPaid'])
                    ->middleware('permission:payments.manage');
                Route::post('{payment}/request-refund', [PaymentController::class, 'requestRefund'])
                    ->middleware('permission:payments.manage');
                Route::post('{payment}/mark-refunded', [PaymentController::class, 'markRefunded'])
                    ->middleware('permission:payments.manage');
                Route::post('{payment}/check-status', [PaymentController::class, 'checkStatus'])
                    ->middleware('permission:payments.manage');
            });

            // Customer Portal - Booking/Ordering
            Route::prefix('customer/merchants/{slug}')->group(function () {
                Route::post('/bookings', [CustomerPortalController::class, 'createBooking'])->middleware('permission:customer_portal.book');
                Route::post('/reservations', [CustomerPortalController::class, 'createReservation'])->middleware('permission:customer_portal.reserve');
                Route::post('/orders', [CustomerPortalController::class, 'createOrder'])->middleware('permission:customer_portal.order');
            });

            // Customer Portal - My History & Dashboard
            Route::prefix('customer/my')->group(function () {
                Route::get('/stats', [CustomerPortalController::class, 'myStats'])->middleware('permission:customer_portal.view_own');
                Route::get('/bookings', [CustomerPortalController::class, 'myBookings'])->middleware('permission:customer_portal.view_own');
                Route::get('/bookings/{booking}', [CustomerPortalController::class, 'myBooking'])->middleware('permission:customer_portal.view_own');
                Route::patch('/bookings/{booking}/cancel', [CustomerPortalController::class, 'cancelMyBooking'])->middleware('permission:customer_portal.cancel_own');
                Route::get('/reservations', [CustomerPortalController::class, 'myReservations'])->middleware('permission:customer_portal.view_own');
                Route::get('/reservations/{reservation}', [CustomerPortalController::class, 'myReservation'])->middleware('permission:customer_portal.view_own');
                Route::patch('/reservations/{reservation}/cancel', [CustomerPortalController::class, 'cancelMyReservation'])->middleware('permission:customer_portal.cancel_own');
                Route::get('/orders', [CustomerPortalController::class, 'myOrders'])->middleware('permission:customer_portal.view_own');
                Route::get('/orders/{order}', [CustomerPortalController::class, 'myOrder'])->middleware('permission:customer_portal.view_own');
                Route::patch('/orders/{order}/cancel', [CustomerPortalController::class, 'cancelMyOrder'])->middleware('permission:customer_portal.cancel_own');

                Route::get('/payment-methods', [CustomerPortalController::class, 'getPaymentMethods'])->middleware('permission:customer_portal.view_own');
                Route::put('/payment-preferences', [CustomerPortalController::class, 'updatePaymentPreferences'])->middleware('permission:customer_portal.view_own');

                Route::post('/identity-document', [CustomerPortalController::class, 'uploadIdentityDocument'])->middleware('permission:customer_portal.view_own');

                Route::post('/favorite-merchants/{merchant}', [CustomerPortalController::class, 'toggleFavoriteMerchant'])->middleware('permission:customer_portal.view_own');
                Route::get('/favorite-merchants', [CustomerPortalController::class, 'myFavoriteMerchants'])->middleware('permission:customer_portal.view_own');

                // Chat conversations (scoped per booking/reservation/order/inquiry)
                // {type} = bookings|reservations|orders|inquiries
                // {id}   = numeric entity id for bookings/reservations/orders; merchant slug for inquiries
                Route::prefix('conversations/{type}/{id}')->middleware('permission:customer_portal.view_own')->group(function () {
                    Route::get('messages', [ConversationController::class, 'messages']);
                    Route::post('messages', [ConversationController::class, 'send']);
                    Route::patch('read', [ConversationController::class, 'markRead']);
                });
            });

            // Broadcasting authentication
            Broadcast::routes();
        });
    });
});
