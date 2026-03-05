<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\PayMongoServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayMongoWebhookController extends Controller
{
    public function __construct(
        protected PaymentServiceInterface $paymentService,
        protected PayMongoServiceInterface $payMongoService,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('Paymongo-Signature', '');

        Log::info('PayMongo webhook received', [
            'event_type' => $request->input('data.attributes.type'),
        ]);

        if (! $this->payMongoService->verifyWebhookSignature($payload, $signature)) {
            Log::warning('PayMongo webhook signature verification failed');

            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $this->paymentService->handleWebhookEvent($request->all());

        return response()->json(['message' => 'Webhook processed'], 200);
    }
}
