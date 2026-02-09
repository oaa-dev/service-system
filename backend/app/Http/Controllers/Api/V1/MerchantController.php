<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\MerchantData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Merchant\StoreMerchantRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateMerchantAccountRequest;
use App\Http\Requests\Api\V1\Merchant\SyncPaymentMethodsRequest;
use App\Http\Requests\Api\V1\Merchant\SyncSocialLinksRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateBusinessHoursRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateMerchantRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateMerchantStatusRequest;
use App\Http\Requests\Api\V1\Merchant\UploadMerchantDocumentRequest;
use App\Http\Requests\Api\V1\Merchant\UploadMerchantGalleryImageRequest;
use App\Http\Requests\Api\V1\Merchant\UploadMerchantLogoRequest;
use App\Http\Resources\Api\V1\MerchantBusinessHourResource;
use App\Http\Resources\Api\V1\MerchantDocumentResource;
use App\Http\Resources\Api\V1\MerchantResource;
use App\Http\Resources\Api\V1\MerchantSocialLinkResource;
use App\Http\Resources\Api\V1\PaymentMethodResource;
use App\Models\Merchant;
use App\Models\User;
use App\Services\Contracts\MerchantServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MerchantController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MerchantServiceInterface $merchantService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $merchants = $this->merchantService->getAllMerchants([
            'per_page' => $request->query('per_page', 15),
        ]);

        return $this->paginatedResponse($merchants, MerchantResource::class);
    }

    public function all(): JsonResponse
    {
        $merchants = $this->merchantService->getAllMerchantsWithoutPagination();

        return $this->successResponse(
            MerchantResource::collection($merchants),
            'Merchants retrieved successfully'
        );
    }

    public function store(StoreMerchantRequest $request): JsonResponse
    {
        $merchant = DB::transaction(function () use ($request) {
            $validated = $request->validated();

            $user = User::create([
                'name' => $validated['user_name'],
                'email' => $validated['user_email'],
                'password' => Hash::make($validated['user_password']),
            ]);
            $user->assignRole('user');

            $merchantFields = collect($validated)
                ->except(['user_name', 'user_email', 'user_password'])
                ->toArray();
            $merchantFields['contact_email'] = $validated['user_email'];

            $data = MerchantData::from($merchantFields);

            return $this->merchantService->createMerchantForUser($user->id, $data);
        });

        return $this->createdResponse(
            new MerchantResource($merchant->load(['user', 'businessType'])),
            'Merchant created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $merchant = $this->merchantService->getMerchantById($id);

        return $this->successResponse(
            new MerchantResource($merchant),
            'Merchant retrieved successfully'
        );
    }

    public function update(UpdateMerchantRequest $request, int $id): JsonResponse
    {
        $data = MerchantData::from($request->validated());
        $merchant = $this->merchantService->updateMerchant($id, $data);

        return $this->successResponse(
            new MerchantResource($merchant->load(['user', 'businessType', 'address'])),
            'Merchant updated successfully'
        );
    }

    public function updateAccount(UpdateMerchantAccountRequest $request, int $id): JsonResponse
    {
        $merchant = $this->merchantService->updateMerchantAccount($id, $request->validated());

        return $this->successResponse(
            new MerchantResource($merchant),
            'Merchant account updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->merchantService->deleteMerchant($id);

            return $this->successResponse(null, 'Merchant deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function updateStatus(UpdateMerchantStatusRequest $request, int $id): JsonResponse
    {
        try {
            $merchant = $this->merchantService->updateStatus(
                $id,
                $request->validated('status'),
                $request->validated('status_reason')
            );

            return $this->successResponse(
                new MerchantResource($merchant->load(['user', 'businessType'])),
                'Merchant status updated successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function uploadLogo(UploadMerchantLogoRequest $request, int $id): JsonResponse
    {
        $merchant = $this->merchantService->getMerchantById($id);

        $merchant->addMediaFromRequest('logo')
            ->toMediaCollection('logo');

        return $this->successResponse(
            new MerchantResource($merchant->refresh()->load(['user', 'businessType', 'media'])),
            'Merchant logo uploaded successfully'
        );
    }

    public function deleteLogo(int $id): JsonResponse
    {
        $merchant = $this->merchantService->getMerchantById($id);

        $merchant->clearMediaCollection('logo');

        return $this->successResponse(null, 'Merchant logo deleted successfully');
    }

    public function updateBusinessHours(UpdateBusinessHoursRequest $request, int $id): JsonResponse
    {
        $merchant = $this->merchantService->updateBusinessHours($id, $request->validated('hours'));

        return $this->successResponse(
            MerchantBusinessHourResource::collection($merchant->businessHours),
            'Business hours updated successfully'
        );
    }

    public function syncPaymentMethods(SyncPaymentMethodsRequest $request, int $id): JsonResponse
    {
        $merchant = $this->merchantService->syncPaymentMethods($id, $request->validated('payment_method_ids'));

        return $this->successResponse(
            PaymentMethodResource::collection($merchant->paymentMethods),
            'Payment methods synced successfully'
        );
    }

    public function syncSocialLinks(SyncSocialLinksRequest $request, int $id): JsonResponse
    {
        $merchant = $this->merchantService->syncSocialLinks($id, $request->validated('social_links'));

        return $this->successResponse(
            MerchantSocialLinkResource::collection($merchant->socialLinks),
            'Social links synced successfully'
        );
    }

    public function uploadDocument(UploadMerchantDocumentRequest $request, int $id): JsonResponse
    {
        $document = $this->merchantService->createDocument(
            $id,
            $request->validated('document_type_id'),
            $request->validated('notes')
        );

        $document->addMediaFromRequest('document')
            ->toMediaCollection('document');

        return $this->createdResponse(
            new MerchantDocumentResource($document->load(['documentType', 'media'])),
            'Document uploaded successfully'
        );
    }

    public function deleteDocument(int $merchantId, int $documentId): JsonResponse
    {
        try {
            $this->merchantService->deleteDocument($merchantId, $documentId);

            return $this->successResponse(null, 'Document deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function getGallery(int $id): JsonResponse
    {
        $merchant = $this->merchantService->getMerchantById($id);

        $data = [];
        foreach (Merchant::GALLERY_COLLECTIONS as $key => $collection) {
            $media = $merchant->getMedia($collection);
            $formatted = $media->map(fn ($item) => [
                'id' => $item->id,
                'url' => $item->getUrl(),
                'thumb' => $item->getUrl('thumb'),
                'preview' => $item->getUrl('preview'),
                'name' => $item->file_name,
                'size' => $item->size,
                'mime_type' => $item->mime_type,
                'created_at' => $item->created_at->toISOString(),
            ]);

            if ($collection === 'gallery_feature') {
                $data[$collection] = $formatted->first();
            } else {
                $data[$collection] = $formatted->values();
            }
        }

        return $this->successResponse($data, 'Gallery retrieved successfully');
    }

    public function uploadGalleryImage(UploadMerchantGalleryImageRequest $request, int $id, string $collection): JsonResponse
    {
        if (! array_key_exists($collection, Merchant::GALLERY_COLLECTIONS)) {
            return $this->errorResponse('Invalid collection. Must be one of: ' . implode(', ', array_keys(Merchant::GALLERY_COLLECTIONS)), 422);
        }

        $merchant = $this->merchantService->getMerchantById($id);
        $collectionName = Merchant::GALLERY_COLLECTIONS[$collection];

        $media = $merchant->addMediaFromRequest('image')
            ->toMediaCollection($collectionName);

        return $this->createdResponse([
            'id' => $media->id,
            'url' => $media->getUrl(),
            'thumb' => $media->getUrl('thumb'),
            'preview' => $media->getUrl('preview'),
            'name' => $media->file_name,
            'size' => $media->size,
            'mime_type' => $media->mime_type,
            'created_at' => $media->created_at->toISOString(),
        ], 'Gallery image uploaded successfully');
    }

    public function deleteGalleryImage(int $id, int $mediaId): JsonResponse
    {
        $merchant = $this->merchantService->getMerchantById($id);

        $galleryCollections = array_values(Merchant::GALLERY_COLLECTIONS);
        $media = $merchant->media()->where('id', $mediaId)
            ->whereIn('collection_name', $galleryCollections)
            ->first();

        if (! $media) {
            return $this->errorResponse('Gallery image not found', 404);
        }

        $media->delete();

        return $this->successResponse(null, 'Gallery image deleted successfully');
    }
}
