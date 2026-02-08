<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\MessagingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    // Config routes (public)
    Route::get('config/images', [ConfigController::class, 'images']);

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
