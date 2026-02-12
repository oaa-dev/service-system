<?php

namespace App\Services\Contracts;

use App\Data\FieldData;
use App\Models\Field;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface FieldServiceInterface
{
    public function getAllFields(array $filters = []): LengthAwarePaginator;

    public function getAllFieldsWithoutPagination(): Collection;

    public function getActiveFields(): Collection;

    public function getFieldById(int $id): Field;

    public function createField(FieldData $data): Field;

    public function updateField(int $id, FieldData $data): Field;

    public function deleteField(int $id): bool;
}
