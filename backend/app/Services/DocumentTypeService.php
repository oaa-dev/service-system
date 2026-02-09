<?php

namespace App\Services;

use App\Data\DocumentTypeData;
use App\Models\DocumentType;
use App\Repositories\Contracts\DocumentTypeRepositoryInterface;
use App\Services\Contracts\DocumentTypeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DocumentTypeService implements DocumentTypeServiceInterface
{
    public function __construct(
        protected DocumentTypeRepositoryInterface $documentTypeRepository
    ) {}

    public function getAllDocumentTypes(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(DocumentType::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('is_required'),
                AllowedFilter::exact('level'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('name', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'name', 'sort_order', 'is_active', 'is_required', 'level', 'created_at'])
            ->defaultSort('sort_order')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getAllDocumentTypesWithoutPagination(): Collection
    {
        return DocumentType::orderBy('sort_order')->get();
    }

    public function getActiveDocumentTypes(): Collection
    {
        return $this->documentTypeRepository->getActive();
    }

    public function getDocumentTypeById(int $id): DocumentType
    {
        return $this->documentTypeRepository->findOrFail($id);
    }

    public function createDocumentType(DocumentTypeData $data): DocumentType
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->documentTypeRepository->create($createData);
    }

    public function updateDocumentType(int $id, DocumentTypeData $data): DocumentType
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->toArray();

        return $this->documentTypeRepository->update($id, $updateData);
    }

    public function deleteDocumentType(int $id): bool
    {
        return $this->documentTypeRepository->delete($id);
    }
}
