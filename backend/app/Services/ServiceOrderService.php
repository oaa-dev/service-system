<?php

namespace App\Services;

use App\Data\ServiceOrderData;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use App\Services\Contracts\ServiceOrderServiceInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ServiceOrderService implements ServiceOrderServiceInterface
{
    private const VALID_TRANSITIONS = [
        'pending' => ['received', 'cancelled'],
        'received' => ['processing', 'cancelled'],
        'processing' => ['ready'],
        'ready' => ['completed', 'delivering'],
        'delivering' => ['completed'],
    ];

    public function __construct(
        protected MerchantRepositoryInterface $merchantRepository,
        protected PlatformFeeServiceInterface $platformFeeService
    ) {}

    public function getMerchantServiceOrders(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $this->merchantRepository->findOrFail($merchantId);

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(ServiceOrder::where('merchant_id', $merchantId))
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('service_id'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::callback('date_from', fn ($query, $value) => $query->whereDate('created_at', '>=', $value)),
                AllowedFilter::callback('date_to', fn ($query, $value) => $query->whereDate('created_at', '<=', $value)),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where(function ($q) use ($value) {
                    $q->where('order_number', 'like', "%{$value}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'like', "%{$value}%")->orWhere('email', 'like', "%{$value}%"));
                })),
            ])
            ->allowedSorts(['id', 'order_number', 'status', 'total_price', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['service', 'customer'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantServiceOrderById(int $merchantId, int $serviceOrderId): ServiceOrder
    {
        $this->merchantRepository->findOrFail($merchantId);

        return ServiceOrder::where('merchant_id', $merchantId)
            ->with(['service', 'customer'])
            ->findOrFail($serviceOrderId);
    }

    public function createServiceOrder(int $merchantId, ServiceOrderData $data): ServiceOrder
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);

        if (! $merchant->can_sell_products) {
            throw ValidationException::withMessages([
                'merchant' => ['This merchant does not accept orders.'],
            ]);
        }

        // Branch merchants use parent organization's services
        $serviceMerchantId = $merchant->parent_id ?? $merchantId;

        $service = Service::where('merchant_id', $serviceMerchantId)
            ->where('is_active', true)
            ->findOrFail($data->service_id);

        $quantity = $data->quantity;
        $unitPrice = (float) $service->price;
        $totalPrice = round($quantity * $unitPrice, 2);

        // Calculate platform fee
        $feeData = $this->platformFeeService->calculateFee('sell_product', $totalPrice);

        // Generate order number
        $orderNumber = $this->generateOrderNumber();

        $serviceOrder = ServiceOrder::create([
            'merchant_id' => $merchantId,
            'service_id' => $service->id,
            'customer_id' => auth()->id(),
            'order_number' => $orderNumber,
            'quantity' => $quantity,
            'unit_label' => $data->unit_label,
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
            'fee_rate' => $feeData['fee_rate'],
            'fee_amount' => $feeData['fee_amount'],
            'total_amount' => $feeData['total_amount'],
            'status' => 'pending',
            'notes' => $data->notes instanceof Optional ? null : $data->notes,
        ]);

        return $serviceOrder->load(['service', 'customer']);
    }

    public function updateServiceOrderStatus(int $merchantId, int $serviceOrderId, string $status): ServiceOrder
    {
        $this->merchantRepository->findOrFail($merchantId);

        $serviceOrder = ServiceOrder::where('merchant_id', $merchantId)->findOrFail($serviceOrderId);

        $allowedTransitions = self::VALID_TRANSITIONS[$serviceOrder->status] ?? [];

        if (! in_array($status, $allowedTransitions)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from '{$serviceOrder->status}' to '{$status}'."],
            ]);
        }

        $updateData = ['status' => $status];

        if ($status === 'received') {
            $updateData['received_at'] = now();
        }
        if ($status === 'completed') {
            $updateData['completed_at'] = now();
        }
        if ($status === 'cancelled') {
            $updateData['cancelled_at'] = now();
        }

        $serviceOrder->update($updateData);

        return $serviceOrder->load(['service', 'customer']);
    }

    private function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "ORD-{$date}-";

        $lastOrder = ServiceOrder::where('order_number', 'like', "{$prefix}%")
            ->orderBy('order_number', 'desc')
            ->first();

        if ($lastOrder) {
            $lastNumber = (int) substr($lastOrder->order_number, strlen($prefix));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
}
