<?php

namespace App\Repositories;

use App\Models\ServiceOrder;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;

class ServiceOrderRepository extends BaseRepository implements ServiceOrderRepositoryInterface
{
    public function __construct(ServiceOrder $model)
    {
        parent::__construct($model);
    }
}
