<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class ConfigController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/config/images',
        summary: 'Get image upload configuration',
        description: 'Get the configuration settings for image uploads (avatar, documents, etc.)',
        tags: ['Config'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Configuration retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Configuration retrieved successfully'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(
                                    property: 'avatar',
                                    properties: [
                                        new OA\Property(property: 'mimes', type: 'array', items: new OA\Items(type: 'string'), example: ['jpeg', 'png', 'webp']),
                                        new OA\Property(property: 'max_size', type: 'integer', description: 'Max size in KB', example: 5120),
                                        new OA\Property(property: 'min_width', type: 'integer', example: 100),
                                        new OA\Property(property: 'min_height', type: 'integer', example: 100),
                                        new OA\Property(property: 'max_width', type: 'integer', example: 4000),
                                        new OA\Property(property: 'max_height', type: 'integer', example: 4000),
                                        new OA\Property(property: 'recommendation', type: 'string', example: 'Upload a square image (e.g., 400x400) in JPEG, PNG, or WebP format.'),
                                    ],
                                    type: 'object'
                                ),
                                new OA\Property(
                                    property: 'document',
                                    properties: [
                                        new OA\Property(property: 'mimes', type: 'array', items: new OA\Items(type: 'string'), example: ['pdf', 'doc', 'docx']),
                                        new OA\Property(property: 'max_size', type: 'integer', description: 'Max size in KB', example: 10240),
                                        new OA\Property(property: 'recommendation', type: 'string', example: 'Upload documents in PDF, DOC, or DOCX format.'),
                                    ],
                                    type: 'object'
                                ),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
        ]
    )]
    public function images(): JsonResponse
    {
        return $this->successResponse(
            config('images'),
            'Configuration retrieved successfully'
        );
    }
}
