<?php

namespace App\Repositories;

use App\Models\ReferralProgram;
use App\Repositories\Contracts\ReferralProgramRepositoryInterface;

class ReferralProgramRepository extends BaseRepository implements ReferralProgramRepositoryInterface
{
    public function __construct(ReferralProgram $model)
    {
        parent::__construct($model);
    }
}
