<?php

namespace App\Repositories;

use App\Models\DocumentType;
use App\Repositories\Contracts\DocumentTypeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class DocumentTypeRepository extends BaseRepository implements DocumentTypeRepositoryInterface
{
    public function __construct(DocumentType $model)
    {
        parent::__construct($model);
    }

    public function findBySlug(string $slug): ?Model
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->orderBy('sort_order')->get();
    }
}
