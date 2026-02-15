<?php

namespace App\Services;

use App\Data\MerchantData;
use App\Data\ServiceData;
use App\Models\BusinessTypeField;
use App\Models\Merchant;
use App\Models\MerchantDocument;
use App\Models\MerchantSocialLink;
use App\Models\MerchantStatusLog;
use App\Models\Service;
use App\Models\User;
use App\Notifications\MerchantApplicationSubmittedNotification;
use App\Notifications\MerchantStatusChangedNotification;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\MerchantServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;
use App\Http\Resources\Api\V1\BookingResource;
use App\Http\Resources\Api\V1\ReservationResource;
use App\Http\Resources\Api\V1\ServiceOrderResource;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MerchantService implements MerchantServiceInterface
{
    private const VALID_TRANSITIONS = [
        'pending' => ['submitted'],
        'submitted' => ['approved', 'rejected'],
        'approved' => ['active', 'suspended'],
        'active' => ['suspended'],
        'rejected' => ['pending'],
        'suspended' => ['active'],
    ];

    public function __construct(
        protected MerchantRepositoryInterface $merchantRepository
    ) {}

    public function getAllMerchants(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Merchant::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('business_type_id'),
                AllowedFilter::exact('user_id'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where(function ($q) use ($value) {
                    $q->where('name', 'like', "%{$value}%")
                        ->orWhere('contact_email', 'like', "%{$value}%")
                        ->orWhere('contact_phone', 'like', "%{$value}%");
                })),
            ])
            ->allowedSorts(['id', 'name', 'type', 'status', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['user', 'businessType', 'media'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getAllMerchantsWithoutPagination(): Collection
    {
        return Merchant::with(['user', 'businessType', 'media'])->orderBy('name')->get();
    }

    public function getMerchantById(int $id): Merchant
    {
        return Merchant::with([
            'user',
            'businessType',
            'address.region',
            'address.province',
            'address.geoCity',
            'address.barangay',
            'paymentMethods',
            'socialLinks.socialPlatform',
            'documents.documentType',
            'documents.media',
            'businessHours',
            'media',
        ])->findOrFail($id);
    }

    public function createMerchant(MerchantData $data): Merchant
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        $merchant = $this->merchantRepository->create($createData);

        MerchantStatusLog::create([
            'merchant_id' => $merchant->id,
            'from_status' => null,
            'to_status' => 'pending',
            'reason' => null,
            'changed_by' => null,
        ]);

        return $merchant;
    }

    public function createMerchantForUser(int $userId, MerchantData $data): Merchant
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        $createData['user_id'] = $userId;

        $merchant = $this->merchantRepository->create($createData);

        MerchantStatusLog::create([
            'merchant_id' => $merchant->id,
            'from_status' => null,
            'to_status' => 'pending',
            'reason' => null,
            'changed_by' => null,
        ]);

        return $merchant;
    }

    public function updateMerchant(int $id, MerchantData $data): Merchant
    {
        $addressData = $data->address;

        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        // Auto-copy capabilities from business type only when business_type_id actually changes
        $merchant = $this->merchantRepository->findOrFail($id);
        if (isset($updateData['business_type_id']) && $updateData['business_type_id']
            && $updateData['business_type_id'] !== $merchant->business_type_id) {
            $businessType = \App\Models\BusinessType::find($updateData['business_type_id']);
            if ($businessType) {
                $updateData['can_sell_products'] = $businessType->can_sell_products;
                $updateData['can_take_bookings'] = $businessType->can_take_bookings;
                $updateData['can_rent_units'] = $businessType->can_rent_units;
            }
        }

        $merchant = $this->merchantRepository->update($id, $updateData);

        if (! $addressData instanceof Optional && $addressData !== null) {
            $merchant->updateOrCreateAddress($addressData->toArray());
        }

        return $merchant;
    }

    public function updateMerchantAccount(int $id, array $data): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($id);
        $user = $merchant->user;

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

        if (isset($data['email'])) {
            $merchant->update(['contact_email' => $data['email']]);
        }

        return $merchant->load('user');
    }

    public function deleteMerchant(int $id): bool
    {
        return $this->merchantRepository->delete($id);
    }

    public function updateStatus(int $id, string $status, ?string $reason = null, ?int $changedBy = null): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($id);
        $fromStatus = $merchant->status;

        $allowedTransitions = self::VALID_TRANSITIONS[$merchant->status] ?? [];

        if (! in_array($status, $allowedTransitions)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from '{$merchant->status}' to '{$status}'."],
            ]);
        }

        $updateData = [
            'status' => $status,
            'status_changed_at' => now(),
            'status_reason' => $reason,
        ];

        if ($status === 'approved') {
            $updateData['approved_at'] = now();
        }

        // Reset submitted_at when going back to pending from rejected
        if ($status === 'pending' && $fromStatus === 'rejected') {
            $updateData['submitted_at'] = null;
        }

        $merchant = $this->merchantRepository->update($id, $updateData);

        // Create status log
        MerchantStatusLog::create([
            'merchant_id' => $id,
            'from_status' => $fromStatus,
            'to_status' => $status,
            'reason' => $reason,
            'changed_by' => $changedBy,
        ]);

        // Notify merchant user
        $merchant->load('user');
        if ($merchant->user) {
            $merchant->user->notify(
                new MerchantStatusChangedNotification($merchant, $fromStatus, $status, $reason)
            );
        }

        return $merchant;
    }

    public function getMerchantStatusLogs(int $merchantId): \Illuminate\Database\Eloquent\Collection
    {
        $this->merchantRepository->findOrFail($merchantId);

        return MerchantStatusLog::where('merchant_id', $merchantId)
            ->with('changedBy')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function submitApplication(int $merchantId): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        if (! in_array($merchant->status, ['pending', 'rejected'])) {
            throw ValidationException::withMessages([
                'status' => ['Application can only be submitted when status is pending or rejected.'],
            ]);
        }

        $fromStatus = $merchant->status;

        $merchant = $this->merchantRepository->update($merchantId, [
            'submitted_at' => now(),
            'status' => 'submitted',
            'status_changed_at' => now(),
            'status_reason' => null,
        ]);

        // Log the status change
        $merchant->statusLogs()->create([
            'from_status' => $fromStatus,
            'to_status' => 'submitted',
            'reason' => $fromStatus === 'rejected' ? 'Application re-submitted for review' : 'Application submitted for review',
            'changed_by' => null,
        ]);

        // Notify all admin/super-admin users
        $admins = User::role(['admin', 'super-admin'], 'api')->get();
        Notification::send($admins, new MerchantApplicationSubmittedNotification($merchant));

        return $merchant;
    }

    public function getOnboardingChecklist(int $merchantId, int $userId): array
    {
        $merchant = Merchant::with(['address', 'documents', 'media'])->findOrFail($merchantId);
        $user = User::findOrFail($userId);

        $items = [
            [
                'key' => 'account_created',
                'label' => 'Create your account',
                'description' => 'Register on the platform',
                'completed' => true,
            ],
            [
                'key' => 'email_verified',
                'label' => 'Verify your email',
                'description' => 'Confirm your email address via OTP',
                'completed' => $user->email_verified_at !== null,
            ],
            [
                'key' => 'business_type_selected',
                'label' => 'Select business type',
                'description' => 'Choose your business category',
                'completed' => $merchant->business_type_id !== null,
            ],
            [
                'key' => 'capabilities_configured',
                'label' => 'Configure store capabilities',
                'description' => 'Select what your store can do (sell products, take bookings, or rent units)',
                'completed' => $merchant->can_sell_products || $merchant->can_take_bookings || $merchant->can_rent_units,
            ],
            [
                'key' => 'business_details_completed',
                'label' => 'Complete business details',
                'description' => 'Fill in your store name, contact info, description, and address',
                'completed' => $this->isBusinessDetailsComplete($merchant),
            ],
            [
                'key' => 'logo_uploaded',
                'label' => 'Upload your logo',
                'description' => 'Add a logo image for your store',
                'completed' => $merchant->hasMedia('logo'),
            ],
            [
                'key' => 'documents_uploaded',
                'label' => 'Upload required documents',
                'description' => 'Submit at least one business document',
                'completed' => $merchant->documents->isNotEmpty(),
            ],
            [
                'key' => 'application_submitted',
                'label' => 'Submit application',
                'description' => 'Submit your store for admin review',
                'completed' => in_array($merchant->status, ['submitted', 'approved', 'active']),
            ],
            [
                'key' => 'admin_approved',
                'label' => 'Admin approval',
                'description' => 'Wait for admin to approve your application',
                'completed' => in_array($merchant->status, ['approved', 'active']),
            ],
        ];

        $completedCount = collect($items)->where('completed', true)->count();
        $totalCount = count($items);

        return [
            'items' => $items,
            'completed_count' => $completedCount,
            'total_count' => $totalCount,
            'completion_percentage' => $totalCount > 0 ? (int) round(($completedCount / $totalCount) * 100) : 0,
        ];
    }

    private function isBusinessDetailsComplete(Merchant $merchant): bool
    {
        return ! empty($merchant->name)
            && ! empty($merchant->contact_email)
            && ! empty($merchant->description)
            && $merchant->address !== null;
    }

    public function updateBusinessHours(int $merchantId, array $hours): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        foreach ($hours as $hour) {
            $merchant->businessHours()->updateOrCreate(
                ['day_of_week' => $hour['day_of_week']],
                [
                    'open_time' => $hour['open_time'] ?? null,
                    'close_time' => $hour['close_time'] ?? null,
                    'is_closed' => $hour['is_closed'] ?? false,
                ]
            );
        }

        return $merchant->load('businessHours');
    }

    public function syncPaymentMethods(int $merchantId, array $paymentMethodIds): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        $merchant->paymentMethods()->sync($paymentMethodIds);

        return $merchant->load('paymentMethods');
    }

    public function syncSocialLinks(int $merchantId, array $socialLinks): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        // Delete existing and recreate
        $merchant->socialLinks()->delete();

        foreach ($socialLinks as $link) {
            $merchant->socialLinks()->create([
                'social_platform_id' => $link['social_platform_id'],
                'url' => $link['url'],
            ]);
        }

        return $merchant->load('socialLinks.socialPlatform');
    }

    public function createDocument(int $merchantId, int $documentTypeId, ?string $notes = null): MerchantDocument
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        return $merchant->documents()->updateOrCreate(
            ['document_type_id' => $documentTypeId],
            ['notes' => $notes]
        );
    }

    public function deleteDocument(int $merchantId, int $documentId): bool
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        $document = $merchant->documents()->findOrFail($documentId);
        $document->clearMediaCollection('document');

        return $document->delete();
    }

    public function getMerchantServices(int $merchantId, array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $this->merchantRepository->findOrFail($merchantId);

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Service::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('service_category_id'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('service_type'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('name', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'name', 'price', 'is_active', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['serviceCategory', 'media', 'customFieldValues.businessTypeField.field', 'customFieldValues.fieldValue'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantServiceById(int $merchantId, int $serviceId): Service
    {
        $this->merchantRepository->findOrFail($merchantId);

        return Service::where('merchant_id', $merchantId)
            ->with(['serviceCategory', 'media', 'customFieldValues.businessTypeField.field', 'customFieldValues.fieldValue'])
            ->findOrFail($serviceId);
    }

    public function createMerchantService(int $merchantId, ServiceData $data): Service
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        $customFields = ! $data->custom_fields instanceof Optional ? $data->custom_fields : null;

        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('custom_fields')
            ->toArray();

        $service = $merchant->services()->create($createData);

        if ($customFields) {
            $this->saveCustomFieldValues($service, $customFields);
        }

        return $service->load(['serviceCategory', 'media', 'customFieldValues.businessTypeField.field', 'customFieldValues.fieldValue']);
    }

    public function updateMerchantService(int $merchantId, int $serviceId, ServiceData $data): Service
    {
        $this->merchantRepository->findOrFail($merchantId);

        $service = Service::where('merchant_id', $merchantId)->findOrFail($serviceId);

        $customFields = ! $data->custom_fields instanceof Optional ? $data->custom_fields : null;

        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('custom_fields')
            ->toArray();

        $service->update($updateData);

        if ($customFields !== null) {
            $this->saveCustomFieldValues($service, $customFields);
        }

        return $service->load(['serviceCategory', 'media', 'customFieldValues.businessTypeField.field', 'customFieldValues.fieldValue']);
    }

    public function deleteMerchantService(int $merchantId, int $serviceId): bool
    {
        $this->merchantRepository->findOrFail($merchantId);

        $service = Service::where('merchant_id', $merchantId)->findOrFail($serviceId);
        $service->clearMediaCollection('image');

        return $service->delete();
    }

    private function saveCustomFieldValues(Service $service, array $customFields): void
    {
        // Delete existing values for this service
        $service->customFieldValues()->delete();

        foreach ($customFields as $btFieldId => $value) {
            $btField = BusinessTypeField::with('field')->find($btFieldId);
            if (! $btField) {
                continue;
            }

            $fieldType = $btField->field->type;

            if ($fieldType === 'checkbox' && is_array($value)) {
                // Checkbox: multiple rows with field_value_id
                foreach ($value as $fieldValueId) {
                    $service->customFieldValues()->create([
                        'business_type_field_id' => $btFieldId,
                        'field_value_id' => $fieldValueId,
                        'value' => null,
                    ]);
                }
            } elseif (in_array($fieldType, ['select', 'radio'])) {
                // Select/Radio: single row with field_value_id
                $service->customFieldValues()->create([
                    'business_type_field_id' => $btFieldId,
                    'field_value_id' => $value,
                    'value' => null,
                ]);
            } else {
                // Input: single row with text value
                $service->customFieldValues()->create([
                    'business_type_field_id' => $btFieldId,
                    'field_value_id' => null,
                    'value' => $value,
                ]);
            }
        }
    }

    public function getServiceSchedules(int $merchantId, int $serviceId): Service
    {
        $this->merchantRepository->findOrFail($merchantId);

        return Service::where('merchant_id', $merchantId)
            ->with('schedules')
            ->findOrFail($serviceId);
    }

    public function upsertServiceSchedules(int $merchantId, int $serviceId, array $schedules): Service
    {
        $this->merchantRepository->findOrFail($merchantId);

        $service = Service::where('merchant_id', $merchantId)->findOrFail($serviceId);

        foreach ($schedules as $schedule) {
            $service->schedules()->updateOrCreate(
                ['day_of_week' => $schedule['day_of_week']],
                [
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                    'is_available' => $schedule['is_available'] ?? true,
                ]
            );
        }

        return $service->load('schedules');
    }

    public function getMerchantStats(int $merchantId): array
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        $stats = [
            'services' => [
                'total' => $merchant->services()->count(),
                'active' => $merchant->services()->where('is_active', true)->count(),
            ],
        ];

        if ($merchant->can_take_bookings) {
            $stats['bookings'] = [
                'total' => $merchant->bookings()->count(),
                'pending' => $merchant->bookings()->where('status', 'pending')->count(),
                'confirmed' => $merchant->bookings()->where('status', 'confirmed')->count(),
                'completed' => $merchant->bookings()->where('status', 'completed')->count(),
                'cancelled' => $merchant->bookings()->where('status', 'cancelled')->count(),
                'today' => $merchant->bookings()->whereDate('booking_date', today())->count(),
            ];
            $stats['recent_bookings'] = BookingResource::collection(
                $merchant->bookings()->with(['service', 'customer'])->latest()->take(5)->get()
            )->resolve();
        }

        if ($merchant->can_sell_products) {
            $stats['orders'] = [
                'total' => $merchant->serviceOrders()->count(),
                'pending' => $merchant->serviceOrders()->where('status', 'pending')->count(),
                'processing' => $merchant->serviceOrders()->where('status', 'processing')->count(),
                'completed' => $merchant->serviceOrders()->where('status', 'completed')->count(),
                'cancelled' => $merchant->serviceOrders()->where('status', 'cancelled')->count(),
                'today' => $merchant->serviceOrders()->whereDate('created_at', today())->count(),
            ];
            $stats['recent_orders'] = ServiceOrderResource::collection(
                $merchant->serviceOrders()->with(['service', 'customer'])->latest()->take(5)->get()
            )->resolve();
        }

        if ($merchant->can_rent_units) {
            $stats['reservations'] = [
                'total' => $merchant->reservations()->count(),
                'pending' => $merchant->reservations()->where('status', 'pending')->count(),
                'confirmed' => $merchant->reservations()->where('status', 'confirmed')->count(),
                'checked_in' => $merchant->reservations()->where('status', 'checked_in')->count(),
                'checked_out' => $merchant->reservations()->where('status', 'checked_out')->count(),
                'cancelled' => $merchant->reservations()->where('status', 'cancelled')->count(),
                'today' => $merchant->reservations()->whereDate('check_in', today())->count(),
            ];
            $stats['recent_reservations'] = ReservationResource::collection(
                $merchant->reservations()->with(['service', 'customer'])->latest()->take(5)->get()
            )->resolve();
        }

        return $stats;
    }

    public function getMerchantBranches(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        if ($merchant->type !== 'organization') {
            throw ValidationException::withMessages([
                'type' => ['Only organization-type merchants can have branches.'],
            ]);
        }

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Merchant::where('parent_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('status'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where(function ($q) use ($value) {
                    $q->where('name', 'like', "%{$value}%")
                        ->orWhere('contact_email', 'like', "%{$value}%")
                        ->orWhere('contact_phone', 'like', "%{$value}%");
                })),
            ])
            ->allowedSorts(['id', 'name', 'status', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['businessType', 'media'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantBranchById(int $merchantId, int $branchId): Merchant
    {
        return Merchant::where('parent_id', $merchantId)
            ->with([
                'businessType',
                'address.region',
                'address.province',
                'address.geoCity',
                'address.barangay',
                'media',
            ])
            ->findOrFail($branchId);
    }

    public function createBranch(int $parentId, MerchantData $data, ?int $userId = null): Merchant
    {
        $parent = $this->merchantRepository->findOrFail($parentId);

        if ($parent->type !== 'organization') {
            throw ValidationException::withMessages([
                'type' => ['Only organization-type merchants can have branches.'],
            ]);
        }

        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        // Auto-set branch defaults from parent
        $createData['parent_id'] = $parentId;
        $createData['user_id'] = $userId;
        $createData['type'] = 'individual';

        // When a user account is provided, auto-activate the branch
        if ($userId) {
            $createData['status'] = 'active';
            $createData['approved_at'] = now();
            $createData['status_changed_at'] = now();
        } else {
            $createData['status'] = 'pending';
        }

        // Inherit business_type_id and capabilities from parent if not explicitly provided
        if (! isset($createData['business_type_id'])) {
            $createData['business_type_id'] = $parent->business_type_id;
        }
        if (! isset($createData['can_sell_products'])) {
            $createData['can_sell_products'] = $parent->can_sell_products;
        }
        if (! isset($createData['can_take_bookings'])) {
            $createData['can_take_bookings'] = $parent->can_take_bookings;
        }
        if (! isset($createData['can_rent_units'])) {
            $createData['can_rent_units'] = $parent->can_rent_units;
        }

        $branch = $this->merchantRepository->create($createData);

        // Create status log
        $initialStatus = $userId ? 'active' : 'pending';
        $reason = $userId ? 'Branch created with user account' : null;
        MerchantStatusLog::create([
            'merchant_id' => $branch->id,
            'from_status' => null,
            'to_status' => $initialStatus,
            'reason' => $reason,
            'changed_by' => null,
        ]);

        // Handle address
        $addressData = $data->address;
        if (! $addressData instanceof Optional && $addressData !== null) {
            $branch->updateOrCreateAddress($addressData->toArray());
        }

        return $branch->load(['businessType', 'address.region', 'address.province', 'address.geoCity', 'address.barangay', 'media']);
    }

    public function updateBranch(int $parentId, int $branchId, MerchantData $data): Merchant
    {
        $branch = Merchant::where('parent_id', $parentId)->findOrFail($branchId);

        $addressData = $data->address;

        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except(['address', 'type', 'parent_id'])
            ->toArray();

        $branch->update($updateData);

        if (! $addressData instanceof Optional && $addressData !== null) {
            $branch->updateOrCreateAddress($addressData->toArray());
        }

        return $branch->fresh()->load(['businessType', 'address.region', 'address.province', 'address.geoCity', 'address.barangay', 'media']);
    }

    public function deleteBranch(int $parentId, int $branchId): bool
    {
        $branch = Merchant::where('parent_id', $parentId)->findOrFail($branchId);

        $branch->clearMediaCollection('logo');

        // Clean up associated user account if one exists
        if ($branch->user_id) {
            $branchUser = User::find($branch->user_id);
            if ($branchUser) {
                $branchUser->tokens()->delete();
                $branchUser->delete();
            }
        }

        return $branch->delete();
    }
}
