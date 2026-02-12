<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\CustomerData;
use App\Data\CustomerInteractionData;
use App\Data\ProfileData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Customer\StoreCustomerInteractionRequest;
use App\Http\Requests\Api\V1\Customer\StoreCustomerRequest;
use App\Http\Requests\Api\V1\Customer\SyncCustomerTagsRequest;
use App\Http\Requests\Api\V1\Customer\UpdateCustomerAccountRequest;
use App\Http\Requests\Api\V1\Customer\UpdateCustomerProfileRequest;
use App\Http\Requests\Api\V1\Customer\UpdateCustomerRequest;
use App\Http\Requests\Api\V1\Customer\UpdateCustomerStatusRequest;
use App\Http\Requests\Api\V1\Customer\UploadCustomerAvatarRequest;
use App\Http\Requests\Api\V1\Customer\UploadCustomerDocumentRequest;
use App\Http\Resources\Api\V1\CustomerDocumentResource;
use App\Http\Resources\Api\V1\CustomerInteractionResource;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\User;
use App\Services\Contracts\CustomerServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerServiceInterface $customerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerService->getAllCustomers([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($customers, CustomerResource::class);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = DB::transaction(function () use ($request) {
            $validated = $request->validated();

            $firstName = $validated['user_first_name'];
            $lastName = $validated['user_last_name'];

            $user = User::create([
                'name' => trim("{$firstName} {$lastName}"),
                'email' => $validated['user_email'],
                'password' => Hash::make($validated['user_password']),
            ]);
            $user->assignRole('customer');
            $user->profile()->update([
                'first_name' => $firstName,
                'last_name' => $lastName,
            ]);

            $customerFields = collect($validated)
                ->except(['user_first_name', 'user_last_name', 'user_email', 'user_password'])
                ->toArray();

            $data = CustomerData::from($customerFields);

            return $this->customerService->createCustomerForUser($user->id, $data);
        });

        return $this->createdResponse(
            new CustomerResource($customer->load(['user', 'tags'])),
            'Customer created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $customer = $this->customerService->getCustomerById($id);

        return $this->successResponse(
            new CustomerResource($customer),
            'Customer retrieved successfully'
        );
    }

    public function update(UpdateCustomerRequest $request, int $id): JsonResponse
    {
        $data = CustomerData::from($request->validated());
        $customer = $this->customerService->updateCustomer($id, $data);

        return $this->successResponse(
            new CustomerResource($customer->load(['user', 'tags'])),
            'Customer updated successfully'
        );
    }

    public function updateStatus(UpdateCustomerStatusRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->updateCustomerStatus($id, $request->validated('status'));

        return $this->successResponse(
            new CustomerResource($customer->load(['user', 'tags'])),
            'Customer status updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $customer = $this->customerService->deactivateCustomer($id);

            return $this->successResponse(
                new CustomerResource($customer->load(['user', 'tags'])),
                'Customer deactivated successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function updateAccount(UpdateCustomerAccountRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->updateCustomerAccount($id, $request->validated());

        return $this->successResponse(
            new CustomerResource($customer),
            'Customer account updated successfully'
        );
    }

    public function updateProfile(UpdateCustomerProfileRequest $request, int $id): JsonResponse
    {
        $data = ProfileData::from($request->validated());
        $customer = $this->customerService->updateCustomerProfile($id, $data);

        return $this->successResponse(
            new CustomerResource($customer),
            'Customer profile updated successfully'
        );
    }

    public function uploadAvatar(UploadCustomerAvatarRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->uploadCustomerAvatar($id, $request->file('avatar'));

        return $this->successResponse(
            new CustomerResource($customer),
            'Avatar uploaded successfully'
        );
    }

    public function deleteAvatar(int $id): JsonResponse
    {
        $customer = $this->customerService->deleteCustomerAvatar($id);

        return $this->successResponse(
            new CustomerResource($customer),
            'Avatar deleted successfully'
        );
    }

    public function uploadDocument(UploadCustomerDocumentRequest $request, int $id): JsonResponse
    {
        $document = $this->customerService->createCustomerDocument(
            $id,
            $request->validated('document_type_id'),
            $request->validated('notes')
        );

        $document->addMediaFromRequest('document')
            ->toMediaCollection('document');

        return $this->createdResponse(
            new CustomerDocumentResource($document->load(['documentType', 'media'])),
            'Document uploaded successfully'
        );
    }

    public function deleteDocument(int $customerId, int $documentId): JsonResponse
    {
        try {
            $this->customerService->deleteCustomerDocument($customerId, $documentId);

            return $this->successResponse(null, 'Document deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function syncTags(SyncCustomerTagsRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->syncCustomerTags($id, $request->validated('tag_ids'));

        return $this->successResponse(
            new CustomerResource($customer->load(['user'])),
            'Customer tags synced successfully'
        );
    }

    public function interactions(Request $request, int $id): JsonResponse
    {
        $interactions = $this->customerService->getCustomerInteractions($id, [
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($interactions, CustomerInteractionResource::class);
    }

    public function storeInteraction(StoreCustomerInteractionRequest $request, int $id): JsonResponse
    {
        $data = CustomerInteractionData::from($request->validated());
        $interaction = $this->customerService->createCustomerInteraction($id, $data, auth()->id());

        return $this->createdResponse(
            new CustomerInteractionResource($interaction->load('loggedByUser')),
            'Interaction logged successfully'
        );
    }

    public function destroyInteraction(int $id, int $interactionId): JsonResponse
    {
        try {
            $this->customerService->deleteCustomerInteraction($id, $interactionId);

            return $this->successResponse(null, 'Interaction deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
