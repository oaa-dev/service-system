<?php

namespace App\Services\Contracts;

use App\Data\CustomerData;
use App\Data\CustomerInteractionData;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Models\CustomerInteraction;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;

interface CustomerServiceInterface
{
    public function getAllCustomers(array $filters = []): LengthAwarePaginator;

    public function getCustomerById(int $id): Customer;

    public function createCustomerForUser(int $userId, CustomerData $data): Customer;

    public function updateCustomer(int $id, CustomerData $data): Customer;

    public function updateCustomerStatus(int $id, string $status): Customer;

    public function deactivateCustomer(int $id): Customer;

    public function syncCustomerTags(int $id, array $tagIds): Customer;

    public function getCustomerInteractions(int $customerId, array $filters = []): LengthAwarePaginator;

    public function createCustomerInteraction(int $customerId, CustomerInteractionData $data, int $loggedBy): CustomerInteraction;

    public function deleteCustomerInteraction(int $customerId, int $interactionId): bool;

    public function uploadCustomerAvatar(int $customerId, UploadedFile $file): Customer;

    public function deleteCustomerAvatar(int $customerId): Customer;

    public function createCustomerDocument(int $customerId, int $documentTypeId, ?string $notes = null): CustomerDocument;

    public function deleteCustomerDocument(int $customerId, int $documentId): bool;
}
