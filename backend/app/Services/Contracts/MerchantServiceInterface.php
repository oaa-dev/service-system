<?php

namespace App\Services\Contracts;

use App\Data\MerchantData;
use App\Data\ServiceData;
use App\Models\Merchant;
use App\Models\MerchantDocument;
use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface MerchantServiceInterface
{
    public function getAllMerchants(array $filters = []): LengthAwarePaginator;

    public function getAllMerchantsWithoutPagination(): Collection;

    public function getMerchantById(int $id): Merchant;

    public function createMerchant(MerchantData $data): Merchant;

    public function createMerchantForUser(int $userId, MerchantData $data): Merchant;

    public function updateMerchant(int $id, MerchantData $data): Merchant;

    public function updateMerchantAccount(int $id, array $data): Merchant;

    public function deleteMerchant(int $id): bool;

    public function updateStatus(int $id, string $status, ?string $reason = null, ?int $changedBy = null): Merchant;

    public function getMerchantStatusLogs(int $merchantId): \Illuminate\Database\Eloquent\Collection;

    public function submitApplication(int $merchantId): Merchant;

    public function getOnboardingChecklist(int $merchantId, int $userId): array;

    public function updateBusinessHours(int $merchantId, array $hours): Merchant;

    public function syncPaymentMethods(int $merchantId, array $paymentMethodIds): Merchant;

    public function syncSocialLinks(int $merchantId, array $socialLinks): Merchant;

    public function createDocument(int $merchantId, int $documentTypeId, ?string $notes = null): MerchantDocument;

    public function deleteDocument(int $merchantId, int $documentId): bool;

    public function getMerchantServices(int $merchantId, array $filters = []): \Illuminate\Pagination\LengthAwarePaginator;

    public function getMerchantServiceById(int $merchantId, int $serviceId): Service;

    public function createMerchantService(int $merchantId, ServiceData $data): Service;

    public function updateMerchantService(int $merchantId, int $serviceId, ServiceData $data): Service;

    public function deleteMerchantService(int $merchantId, int $serviceId): bool;

    public function getMerchantStats(int $merchantId): array;

    public function getMerchantBranches(int $merchantId, array $filters = []): LengthAwarePaginator;

    public function getMerchantBranchById(int $merchantId, int $branchId): Merchant;

    public function createBranch(int $parentId, MerchantData $data, ?int $userId = null): Merchant;

    public function updateBranch(int $parentId, int $branchId, MerchantData $data): Merchant;

    public function deleteBranch(int $parentId, int $branchId): bool;
}
