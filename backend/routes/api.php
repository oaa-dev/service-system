<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessTypeController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\DocumentTypeController;
use App\Http\Controllers\Api\V1\GeographicController;
use App\Http\Controllers\Api\V1\MerchantController;
use App\Http\Controllers\Api\V1\MessagingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\MerchantServiceCategoryController;
use App\Http\Controllers\Api\V1\MerchantServiceController;
use App\Http\Controllers\Api\V1\SocialPlatformController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    // Config routes (public)
    Route::get('config/images', [ConfigController::class, 'images']);

    // Public reference data routes (active items for forms)
    Route::get('payment-methods/active', [PaymentMethodController::class, 'active']);
    Route::get('document-types/active', [DocumentTypeController::class, 'active']);
    Route::get('business-types/active', [BusinessTypeController::class, 'active']);
    Route::get('social-platforms/active', [SocialPlatformController::class, 'active']);

    // Public geographic data routes (PSGC)
    Route::get('geographic/regions', [GeographicController::class, 'regions']);
    Route::get('geographic/regions/{region}/provinces', [GeographicController::class, 'provinces']);
    Route::get('geographic/provinces/{province}/cities', [GeographicController::class, 'cities']);
    Route::get('geographic/cities/{city}/barangays', [GeographicController::class, 'barangays']);

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        // Auth routes
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/me', [AuthController::class, 'updateProfile']);

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
        });
        Route::middleware('permission:business_types.create')->post('business-types', [BusinessTypeController::class, 'store']);
        Route::middleware('permission:business_types.update')->put('business-types/{businessType}', [BusinessTypeController::class, 'update']);
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

        // Merchant management routes
        Route::get('merchants/all', [MerchantController::class, 'all']);
        Route::middleware('permission:merchants.view')->group(function () {
            Route::get('merchants', [MerchantController::class, 'index']);
            Route::get('merchants/{merchant}', [MerchantController::class, 'show']);
            Route::get('merchants/{merchant}/gallery', [MerchantController::class, 'getGallery']);
        });
        Route::middleware('permission:merchants.create')->post('merchants', [MerchantController::class, 'store']);
        Route::middleware('permission:merchants.update')->group(function () {
            Route::put('merchants/{merchant}', [MerchantController::class, 'update']);
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
        Route::middleware('permission:merchants.update_status')->patch('merchants/{merchant}/status', [MerchantController::class, 'updateStatus']);
        Route::middleware('permission:merchants.delete')->delete('merchants/{merchant}', [MerchantController::class, 'destroy']);

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
        });
        Route::middleware('permission:services.delete')->delete('merchants/{merchant}/services/{service}', [MerchantServiceController::class, 'destroy']);

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
        Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::delete('profile/avatar', [ProfileController::class, 'deleteAvatar']);

        // Notification routes
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

        // Messaging routes
        Route::get('conversations', [MessagingController::class, 'conversations']);
        Route::post('conversations', [MessagingController::class, 'startConversation']);
        Route::get('conversations/{conversationId}', [MessagingController::class, 'showConversation']);
        Route::delete('conversations/{conversationId}', [MessagingController::class, 'deleteConversation']);
        Route::get('conversations/{conversationId}/messages', [MessagingController::class, 'messages']);
        Route::post('conversations/{conversationId}/messages', [MessagingController::class, 'sendMessage']);
        Route::post('conversations/{conversationId}/read', [MessagingController::class, 'markAsRead']);
        Route::get('messages/unread-count', [MessagingController::class, 'unreadCount']);
        Route::get('messages/search', [MessagingController::class, 'searchMessages']);
        Route::delete('messages/{messageId}', [MessagingController::class, 'deleteMessage']);

        // Broadcasting authentication
        Broadcast::routes();
    });
});
