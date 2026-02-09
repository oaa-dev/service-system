<?php

namespace App\Services\Contracts;

use App\Data\DocumentTypeData;
use App\Models\DocumentType;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface DocumentTypeServiceInterface
{
    public function getAllDocumentTypes(array $filters = []): LengthAwarePaginator;

    public function getAllDocumentTypesWithoutPagination(): Collection;

    public function getActiveDocumentTypes(): Collection;

    public function getDocumentTypeById(int $id): DocumentType;

    public function createDocumentType(DocumentTypeData $data): DocumentType;

    public function updateDocumentType(int $id, DocumentTypeData $data): DocumentType;

    public function deleteDocumentType(int $id): bool;
}
