<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface CustomerTagRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?\Illuminate\Database\Eloquent\Model;

    public function getActive(): Collection;
}
