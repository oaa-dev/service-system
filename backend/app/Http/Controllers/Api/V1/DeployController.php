<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class DeployController extends Controller
{
    use ApiResponse;

    public function seed(Request $request): JsonResponse
    {
        if ($request->query('key') !== config('app.deploy_key')) {
            return $this->forbiddenResponse('Invalid deploy key');
        }

        Artisan::call('db:seed', ['--force' => true]);

        return $this->successResponse([
            'output' => Artisan::output(),
        ], 'Seeder completed');
    }

    public function seedPsgc(Request $request): JsonResponse
    {
        if ($request->query('key') !== config('app.deploy_key')) {
            return $this->forbiddenResponse('Invalid deploy key');
        }

        Artisan::call('psgc:seed');

        return $this->successResponse([
            'output' => Artisan::output(),
        ], 'PSGC data seeded');
    }

    public function migrate(Request $request): JsonResponse
    {
        if ($request->query('key') !== config('app.deploy_key')) {
            return $this->forbiddenResponse('Invalid deploy key');
        }

        Artisan::call('migrate', ['--force' => true]);

        return $this->successResponse([
            'output' => Artisan::output(),
        ], 'Migration completed');
    }

    public function migrateFresh(Request $request): JsonResponse
    {
        if ($request->query('key') !== config('app.deploy_key')) {
            return $this->forbiddenResponse('Invalid deploy key');
        }

        Artisan::call('migrate:fresh', ['--force' => true]);

        return $this->successResponse([
            'output' => Artisan::output(),
        ], 'Fresh migration completed');
    }
}
