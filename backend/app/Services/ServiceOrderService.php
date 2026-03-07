<?php

namespace App\Services;

use App\Data\ServiceOrderData;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Services\Contracts\LoyaltyServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use App\Services\Contracts\ReferralServiceInterface;
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
        protected PlatformFeeServiceInterface $platformFeeService,
        protected LoyaltyServiceInterface $loyaltyService,
        protected ReferralServiceInterface $referralService,
        protected PaymentServiceInterface $paymentService,
        protected \App\Services\Contracts\CouponServiceInterface $couponService
    ) {}

    public function getMerchantServiceOrders(int $merchantId, array $filters = []): LengthAwarePaginator
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(ServiceOrder::whereIn('merchant_id', $merchantIds))
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
            ->with(['service', 'customer', 'merchant:id,name'])
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getMerchantServiceOrderById(int $merchantId, int $serviceOrderId): ServiceOrder
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        return ServiceOrder::whereIn('merchant_id', $merchantIds)
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

        // Validate loyalty reward and calculate discount if provided
        $loyaltyRewardId = ($data->loyalty_reward_id instanceof Optional) ? null : $data->loyalty_reward_id;
        $discountAmount = 0;
        $couponId = null;
        if ($loyaltyRewardId !== null) {
            $reward = $this->loyaltyService->redeemReward($loyaltyRewardId, auth()->id());
            $discountAmount = $this->loyaltyService->calculateRewardDiscount($reward, $totalPrice);
        }

        // Coupon discount (only if no loyalty reward applied)
        $couponCode = ($data->coupon_code instanceof Optional) ? null : $data->coupon_code;
        if ($couponCode !== null && $discountAmount === 0) {
            $result = $this->couponService->validateCoupon($couponCode, $merchantId, 'sell_product', $totalPrice, auth()->id());
            $discountAmount = $result['discount_amount'];
            $couponId = $result['coupon']->id;
        }

        $discountedTotal = max(0, $totalPrice - $discountAmount);

        // Calculate platform fee on discounted total
        $feeData = $this->platformFeeService->calculateFee('sell_product', $discountedTotal);

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
            'discount_amount' => $discountAmount,
            'coupon_id' => $couponId,
            'fee_rate' => $feeData['fee_rate'],
            'fee_amount' => $feeData['fee_amount'],
            'total_amount' => $feeData['total_amount'],
            'status' => 'pending',
            'notes' => $data->notes instanceof Optional ? null : $data->notes,
        ]);

        // Mark loyalty reward as redeemed against this order
        if ($loyaltyRewardId !== null) {
            $this->loyaltyService->markRewardRedeemed($loyaltyRewardId, 'service_order', $serviceOrder->id);
        }

        // Record coupon usage
        if ($couponId) {
            $customer = \App\Models\Customer::where('user_id', auth()->id())->firstOrFail();
            $this->couponService->applyCoupon($couponId, $customer->id, 'service_order', $serviceOrder->id, $discountAmount);
        }

        return $serviceOrder->load(['service', 'customer']);
    }

    public function updateServiceOrderStatus(int $merchantId, int $serviceOrderId, string $status, ?string $paymentAction = null): ServiceOrder
    {
        $merchant = $this->merchantRepository->findOrFail($merchantId);
        $merchantIds = $merchant->getAccessibleMerchantIds();

        $serviceOrder = ServiceOrder::whereIn('merchant_id', $merchantIds)->findOrFail($serviceOrderId);

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

        // Handle payment action on receiving the order
        if ($status === 'received' && $paymentAction !== null) {
            $payment = $this->paymentService->createPaymentForTransaction($serviceOrder, $paymentAction === 'request_payment' ? 'online' : 'cash');

            if ($paymentAction === 'request_payment') {
                $this->paymentService->requestOnlinePayment($payment);
            } else {
                $this->paymentService->markAsCash($payment);
            }
        }

        // Check and complete referral when order is completed
        if ($status === 'completed') {
            $this->referralService->checkAndCompleteReferral(
                $serviceOrder->customer_id,
                $serviceOrder->merchant_id,
                'service_order',
                $serviceOrder->id
            );
        }

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

        return $prefix.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
}
