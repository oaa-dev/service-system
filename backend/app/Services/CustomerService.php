<?php

namespace App\Services;

use App\Data\CustomerData;
use App\Data\CustomerInteractionData;
use App\Data\ProfileData;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Models\CustomerInteraction;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Services\Contracts\CustomerServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerService implements CustomerServiceInterface
{
    private const VALID_TRANSITIONS = [
        'active' => ['suspended', 'banned'],
        'suspended' => ['active', 'banned'],
        'banned' => ['active'],
    ];

    public function __construct(
        protected CustomerRepositoryInterface $customerRepository
    ) {}

    public function getAllCustomers(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Customer::class)
            ->allowedFilters([
                AllowedFilter::exact('customer_type'),
                AllowedFilter::exact('customer_tier'),
                AllowedFilter::exact('status'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->whereHas('user', function ($q) use ($value) {
                    $q->where('name', 'like', "%{$value}%")
                        ->orWhere('email', 'like', "%{$value}%");
                })),
                AllowedFilter::callback('tag_id', fn ($query, $value) => $query->whereHas('tags', function ($q) use ($value) {
                    $q->where('customer_tags.id', $value);
                })),
            ])
            ->allowedSorts(['id', 'customer_type', 'customer_tier', 'status', 'loyalty_points', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['user', 'tags'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getCustomerById(int $id): Customer
    {
        return Customer::with([
            'user.profile.media',
            'user.profile.address.region',
            'user.profile.address.province',
            'user.profile.address.geoCity',
            'user.profile.address.barangay',
            'tags',
            'documents.documentType',
            'documents.media',
            'interactions' => fn ($q) => $q->latest()->limit(10),
            'interactions.loggedByUser',
        ])->findOrFail($id);
    }

    public function createCustomerForUser(int $userId, CustomerData $data): Customer
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except(['user_name', 'user_email', 'user_password'])
            ->toArray();

        $createData['user_id'] = $userId;

        return $this->customerRepository->create($createData);
    }

    public function updateCustomer(int $id, CustomerData $data): Customer
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except(['user_name', 'user_email', 'user_password', 'status'])
            ->toArray();

        return $this->customerRepository->update($id, $updateData);
    }

    public function updateCustomerStatus(int $id, string $status): Customer
    {
        $customer = $this->customerRepository->findOrFail($id);

        $currentStatus = $customer->status;
        $validTransitions = self::VALID_TRANSITIONS[$currentStatus] ?? [];

        if (! in_array($status, $validTransitions)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from '{$currentStatus}' to '{$status}'."],
            ]);
        }

        return $this->customerRepository->update($id, ['status' => $status]);
    }

    public function deactivateCustomer(int $id): Customer
    {
        $customer = $this->customerRepository->findOrFail($id);

        if ($customer->status === 'banned') {
            throw ValidationException::withMessages([
                'status' => ['Customer is already banned.'],
            ]);
        }

        return $this->customerRepository->update($id, ['status' => 'banned']);
    }

    public function syncCustomerTags(int $id, array $tagIds): Customer
    {
        $customer = $this->customerRepository->findOrFail($id);
        $customer->tags()->sync($tagIds);

        return $customer->fresh(['tags']);
    }

    public function getCustomerInteractions(int $customerId, array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(CustomerInteraction::class)
            ->where('customer_id', $customerId)
            ->allowedFilters([
                AllowedFilter::exact('type'),
            ])
            ->allowedSorts(['id', 'type', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['loggedByUser'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function createCustomerInteraction(int $customerId, CustomerInteractionData $data, int $loggedBy): CustomerInteraction
    {
        $customer = $this->customerRepository->findOrFail($customerId);

        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        $createData['customer_id'] = $customer->id;
        $createData['logged_by'] = $loggedBy;

        return CustomerInteraction::create($createData);
    }

    public function deleteCustomerInteraction(int $customerId, int $interactionId): bool
    {
        $interaction = CustomerInteraction::where('customer_id', $customerId)
            ->where('id', $interactionId)
            ->firstOrFail();

        return $interaction->delete();
    }

    public function updateCustomerProfile(int $customerId, ProfileData $data): Customer
    {
        $customer = $this->customerRepository->findOrFail($customerId);
        $profile = $customer->user->profile;

        $addressData = $data->address;

        $profileData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        $profile->update($profileData);

        if (! $addressData instanceof Optional && $addressData !== null) {
            $profile->updateOrCreateAddress($addressData->toArray());
        }

        return $this->getCustomerById($customerId);
    }

    public function uploadCustomerAvatar(int $customerId, UploadedFile $file): Customer
    {
        $customer = $this->customerRepository->findOrFail($customerId);
        $profile = $customer->user->profile;
        $profile->addMedia($file)->toMediaCollection('avatar');

        return $this->getCustomerById($customerId);
    }

    public function deleteCustomerAvatar(int $customerId): Customer
    {
        $customer = $this->customerRepository->findOrFail($customerId);
        $profile = $customer->user->profile;
        $profile->clearMediaCollection('avatar');

        return $this->getCustomerById($customerId);
    }

    public function createCustomerDocument(int $customerId, int $documentTypeId, ?string $notes = null): CustomerDocument
    {
        $customer = $this->customerRepository->findOrFail($customerId);

        return $customer->documents()->updateOrCreate(
            ['document_type_id' => $documentTypeId],
            ['notes' => $notes]
        );
    }

    public function deleteCustomerDocument(int $customerId, int $documentId): bool
    {
        $customer = $this->customerRepository->findOrFail($customerId);

        $document = $customer->documents()->findOrFail($documentId);
        $document->clearMediaCollection('document');

        return $document->delete();
    }

    public function updateCustomerAccount(int $customerId, array $data): Customer
    {
        $customer = $this->customerRepository->findOrFail($customerId);
        $user = $customer->user;

        $updateData = [];
        if (isset($data['email'])) {
            $updateData['email'] = $data['email'];
        }
        if (isset($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        if (! empty($updateData)) {
            $user->update($updateData);
        }

        return $customer->load('user');
    }
}
