<?php

namespace App\Services;

use App\Data\FieldData;
use App\Models\Field;
use App\Repositories\Contracts\FieldRepositoryInterface;
use App\Services\Contracts\FieldServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Optional;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class FieldService implements FieldServiceInterface
{
    public function __construct(
        protected FieldRepositoryInterface $fieldRepository
    ) {}

    public function getAllFields(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;

        return QueryBuilder::for(Field::class)
            ->allowedFilters([
                AllowedFilter::partial('label'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where('label', 'like', "%{$value}%")),
            ])
            ->allowedSorts(['id', 'label', 'type', 'sort_order', 'is_active', 'created_at'])
            ->defaultSort('sort_order')
            ->with('fieldValues')
            ->paginate($perPage)
            ->appends(request()->query());
    }

    public function getAllFieldsWithoutPagination(): Collection
    {
        return Field::with('fieldValues')->orderBy('sort_order')->get();
    }

    public function getActiveFields(): Collection
    {
        return $this->fieldRepository->getActive();
    }

    public function getFieldById(int $id): Field
    {
        return Field::with('fieldValues')->findOrFail($id);
    }

    public function createField(FieldData $data): Field
    {
        $createData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('values')
            ->toArray();

        $field = $this->fieldRepository->create($createData);

        if (! $data->values instanceof Optional && ! empty($data->values)) {
            $this->syncFieldValues($field, $data->values);
        }

        return $field->load('fieldValues');
    }

    public function updateField(int $id, FieldData $data): Field
    {
        $updateData = collect($data->toArray())
            ->reject(fn ($value) => $value instanceof Optional)
            ->except('values')
            ->toArray();

        $field = $this->fieldRepository->update($id, $updateData);

        if (! $data->values instanceof Optional) {
            $this->syncFieldValues($field, $data->values ?? []);
        }

        return $field->load('fieldValues');
    }

    public function deleteField(int $id): bool
    {
        return $this->fieldRepository->delete($id);
    }

    private function syncFieldValues(Field $field, array $values): void
    {
        $field->fieldValues()->delete();

        foreach ($values as $index => $value) {
            $field->fieldValues()->create([
                'label' => $value['label'] ?? $value['value'],
                'value' => $value['value'],
                'sort_order' => $value['sort_order'] ?? $index,
            ]);
        }
    }
}
