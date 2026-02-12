<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface FieldRepositoryInterface extends BaseRepositoryInterface
{
    public function findByName(string $name): ?\Illuminate\Database\Eloquent\Model;

    public function getActive(): Collection;
}
