<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\DocumentTypeData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\DocumentType\StoreDocumentTypeRequest;
use App\Http\Requests\Api\V1\DocumentType\UpdateDocumentTypeRequest;
use App\Http\Resources\Api\V1\DocumentTypeResource;
use App\Services\Contracts\DocumentTypeServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DocumentTypeServiceInterface $documentTypeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $documentTypes = $this->documentTypeService->getAllDocumentTypes([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($documentTypes, DocumentTypeResource::class);
    }

    public function all(): JsonResponse
    {
        $documentTypes = $this->documentTypeService->getAllDocumentTypesWithoutPagination();

        return $this->successResponse(
            DocumentTypeResource::collection($documentTypes),
            'Document types retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $documentTypes = $this->documentTypeService->getActiveDocumentTypes();

        return $this->successResponse(
            DocumentTypeResource::collection($documentTypes),
            'Active document types retrieved successfully'
        );
    }

    public function store(StoreDocumentTypeRequest $request): JsonResponse
    {
        $data = DocumentTypeData::from($request->validated());
        $documentType = $this->documentTypeService->createDocumentType($data);

        return $this->createdResponse(
            new DocumentTypeResource($documentType),
            'Document type created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $documentType = $this->documentTypeService->getDocumentTypeById($id);

        return $this->successResponse(
            new DocumentTypeResource($documentType),
            'Document type retrieved successfully'
        );
    }

    public function update(UpdateDocumentTypeRequest $request, int $id): JsonResponse
    {
        $data = DocumentTypeData::from($request->validated());
        $documentType = $this->documentTypeService->updateDocumentType($id, $data);

        return $this->successResponse(
            new DocumentTypeResource($documentType),
            'Document type updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->documentTypeService->deleteDocumentType($id);

            return $this->successResponse(null, 'Document type deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
