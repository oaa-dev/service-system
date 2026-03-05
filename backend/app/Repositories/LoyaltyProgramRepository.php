<?php

namespace App\Repositories;

use App\Models\LoyaltyProgram;
use App\Repositories\Contracts\LoyaltyProgramRepositoryInterface;

class LoyaltyProgramRepository extends BaseRepository implements LoyaltyProgramRepositoryInterface
{
    public function __construct(LoyaltyProgram $model)
    {
        parent::__construct($model);
    }
}
