<?php

namespace App\Repositories;

use App\Models\Advertisement;
use App\Repositories\Contracts\AdvertisementRepositoryInterface;

class AdvertisementRepository extends BaseRepository implements AdvertisementRepositoryInterface
{
    public function __construct(Advertisement $model)
    {
        parent::__construct($model);
    }
}
