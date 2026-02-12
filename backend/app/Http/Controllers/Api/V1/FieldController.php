<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\FieldData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Field\StoreFieldRequest;
use App\Http\Requests\Api\V1\Field\UpdateFieldRequest;
use App\Http\Resources\Api\V1\FieldResource;
use App\Services\Contracts\FieldServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected FieldServiceInterface $fieldService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $fields = $this->fieldService->getAllFields([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($fields, FieldResource::class);
    }

    public function all(): JsonResponse
    {
        $fields = $this->fieldService->getAllFieldsWithoutPagination();

        return $this->successResponse(
            FieldResource::collection($fields),
            'Fields retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $fields = $this->fieldService->getActiveFields();

        return $this->successResponse(
            FieldResource::collection($fields),
            'Active fields retrieved successfully'
        );
    }

    public function store(StoreFieldRequest $request): JsonResponse
    {
        $data = FieldData::from($request->validated());
        $field = $this->fieldService->createField($data);

        return $this->createdResponse(
            new FieldResource($field),
            'Field created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $field = $this->fieldService->getFieldById($id);

        return $this->successResponse(
            new FieldResource($field),
            'Field retrieved successfully'
        );
    }

    public function update(UpdateFieldRequest $request, int $id): JsonResponse
    {
        $data = FieldData::from($request->validated());
        $field = $this->fieldService->updateField($id, $data);

        return $this->successResponse(
            new FieldResource($field),
            'Field updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->fieldService->deleteField($id);

            return $this->successResponse(null, 'Field deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
