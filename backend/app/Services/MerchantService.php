<?php

namespace App\Services;

use App\Data\MerchantData;
use App\Data\ServiceData;
use App\Models\BusinessTypeField;
use App\Models\Merchant;
use App\Models\MerchantDocument;
use App\Models\MerchantSocialLink;
use App\Models\Service;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\MerchantServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
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
        'pending' => ['approved', 'rejected'],
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

        return $this->merchantRepository->create($createData);
    }

    public function createMerchantForUser(int $userId, MerchantData $data): Merchant
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

        $createData['user_id'] = $userId;

        return $this->merchantRepository->create($createData);
    }

    public function updateMerchant(int $id, MerchantData $data): Merchant
    {
        $addressData = $data->address;

        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('address')
            ->toArray();

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

    public function updateStatus(int $id, string $status, ?string $reason = null): Merchant
    {
        $merchant = $this->merchantRepository->findOrFail($id);

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

        return $this->merchantRepository->update($id, $updateData);
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
            ->with(['serviceCategory', 'media'])
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
}
