<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Laravel API Boilerplate',
    description: 'API documentation for Laravel API Boilerplate with User Management',
    contact: new OA\Contact(email: 'support@example.com')
)]
#[OA\Server(url: '/api/v1', description: 'API V1 Server')]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
)]
#[OA\Tag(name: 'Auth', description: 'Authentication endpoints')]
#[OA\Tag(name: 'Users', description: 'User management endpoints')]
#[OA\Tag(name: 'Profile', description: 'User profile management endpoints')]
#[OA\Tag(name: 'Messaging', description: 'Real-time messaging between users')]
#[OA\Tag(name: 'Config', description: 'Application configuration endpoints')]
#[OA\Schema(
    schema: 'SuccessResponse',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Success'),
        new OA\Property(property: 'data', type: 'object'),
    ]
)]
#[OA\Schema(
    schema: 'ErrorResponse',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'Error message'),
        new OA\Property(property: 'errors', type: 'object'),
    ]
)]
#[OA\Schema(
    schema: 'ValidationErrorResponse',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'Validation failed'),
        new OA\Property(
            property: 'errors',
            type: 'object',
            example: ['field' => ['The field is required.']]
        ),
    ]
)]
#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'test@example.com'),
        new OA\Property(property: 'email_verified_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(
            property: 'avatar',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'original', type: 'string', format: 'uri'),
                new OA\Property(property: 'thumb', type: 'string', format: 'uri'),
                new OA\Property(property: 'preview', type: 'string', format: 'uri'),
            ]
        ),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
#[OA\Schema(
    schema: 'PaginationMeta',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1),
        new OA\Property(property: 'last_page', type: 'integer', example: 10),
        new OA\Property(property: 'per_page', type: 'integer', example: 15),
        new OA\Property(property: 'total', type: 'integer', example: 150),
        new OA\Property(property: 'from', type: 'integer', example: 1),
        new OA\Property(property: 'to', type: 'integer', example: 15),
    ]
)]
#[OA\Schema(
    schema: 'Address',
    properties: [
        new OA\Property(property: 'street', type: 'string', nullable: true, example: '123 Main Street'),
        new OA\Property(property: 'city', type: 'string', nullable: true, example: 'New York'),
        new OA\Property(property: 'state', type: 'string', nullable: true, example: 'NY'),
        new OA\Property(property: 'postal_code', type: 'string', nullable: true, example: '10001'),
        new OA\Property(property: 'country', type: 'string', nullable: true, example: 'United States'),
    ]
)]
#[OA\Schema(
    schema: 'AddressInput',
    properties: [
        new OA\Property(property: 'street', type: 'string', maxLength: 255, nullable: true, example: '123 Main Street'),
        new OA\Property(property: 'city', type: 'string', maxLength: 100, nullable: true, example: 'New York'),
        new OA\Property(property: 'state', type: 'string', maxLength: 100, nullable: true, example: 'NY'),
        new OA\Property(property: 'postal_code', type: 'string', maxLength: 20, nullable: true, example: '10001'),
        new OA\Property(property: 'country', type: 'string', maxLength: 100, nullable: true, example: 'United States'),
    ]
)]
#[OA\Schema(
    schema: 'UserProfile',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'bio', type: 'string', nullable: true, example: 'Software developer with 5 years of experience'),
        new OA\Property(property: 'phone', type: 'string', nullable: true, example: '+1234567890'),
        new OA\Property(property: 'address', ref: '#/components/schemas/Address', nullable: true),
        new OA\Property(
            property: 'avatar',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'original', type: 'string', format: 'uri'),
                new OA\Property(property: 'thumb', type: 'string', format: 'uri'),
                new OA\Property(property: 'preview', type: 'string', format: 'uri'),
            ]
        ),
        new OA\Property(property: 'date_of_birth', type: 'string', format: 'date', nullable: true, example: '1990-01-15'),
        new OA\Property(property: 'gender', type: 'string', enum: ['male', 'female', 'other'], nullable: true, example: 'male'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
#[OA\Schema(
    schema: 'Notification',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000'),
        new OA\Property(property: 'type', type: 'string', example: 'App\\Notifications\\UserCreatedNotification'),
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'type', type: 'string', example: 'user_created'),
                new OA\Property(property: 'title', type: 'string', example: 'New User Created'),
                new OA\Property(property: 'message', type: 'string', example: 'A new user has been created'),
            ]
        ),
        new OA\Property(property: 'read_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ]
)]
#[OA\Schema(
    schema: 'MessageSender',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
        new OA\Property(
            property: 'avatar',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'original', type: 'string', format: 'uri'),
                new OA\Property(property: 'thumb', type: 'string', format: 'uri'),
                new OA\Property(property: 'preview', type: 'string', format: 'uri'),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'Message',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'conversation_id', type: 'integer', example: 1),
        new OA\Property(property: 'sender_id', type: 'integer', example: 1),
        new OA\Property(property: 'sender', ref: '#/components/schemas/MessageSender'),
        new OA\Property(property: 'body', type: 'string', example: 'Hello, how are you?'),
        new OA\Property(property: 'read_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'is_mine', type: 'boolean', example: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
#[OA\Schema(
    schema: 'Conversation',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'other_user', ref: '#/components/schemas/MessageSender'),
        new OA\Property(property: 'latest_message', ref: '#/components/schemas/Message', nullable: true),
        new OA\Property(property: 'unread_count', type: 'integer', example: 3),
        new OA\Property(property: 'last_message_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
abstract class Controller
{
    //
}
