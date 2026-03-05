<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Data\MerchantData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Merchant\StoreBranchRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateBranchRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateMyMerchantRequest;
use App\Http\Requests\Api\V1\Merchant\UpdateBusinessHoursRequest;
use App\Http\Requests\Api\V1\Merchant\SyncPaymentMethodsRequest;
use App\Http\Requests\Api\V1\Merchant\SyncSocialLinksRequest;
use App\Http\Requests\Api\V1\Merchant\UploadMerchantDocumentRequest;
use App\Http\Requests\Api\V1\Merchant\UploadMerchantGalleryImageRequest;
use App\Http\Requests\Api\V1\Merchant\UploadMerchantLogoRequest;
use App\Http\Resources\Api\V1\MerchantBusinessHourResource;
use App\Http\Resources\Api\V1\MerchantDocumentResource;
use App\Http\Resources\Api\V1\MerchantResource;
use App\Http\Resources\Api\V1\MerchantSocialLinkResource;
use App\Http\Resources\Api\V1\MerchantStatusLogResource;
use App\Http\Resources\Api\V1\PaymentMethodResource;
use App\Models\Merchant;
use App\Models\User;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\MerchantServiceInterface;
use App\Services\Contracts\ReservationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MyMerchantController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MerchantServiceInterface $merchantService,
        protected BookingServiceInterface $bookingService,
        protected ReservationServiceInterface $reservationService
    ) {}

    private function checkBranchSelfEditPermission(Merchant $merchant): ?JsonResponse
    {
        if ($merchant->parent_id !== null && ! $merchant->allow_branch_self_edit) {
            return $this->forbiddenResponse('Branch self-edit is disabled by your organization');
        }

        return null;
    }

    private function resolveBranch(Request $request, int $branchId): Merchant|JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $branch = Merchant::where('id', $branchId)->where('parent_id', $merchant->id)->first();

        if (! $branch) {
            return $this->notFoundResponse('Branch not found');
        }

        return $branch;
    }

    public function show(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $merchant = $this->merchantService->getMerchantById($merchant->id);

        return $this->successResponse(
            new MerchantResource($merchant),
            'Merchant retrieved successfully'
        );
    }

    public function stats(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $stats = $this->merchantService->getMerchantStats($merchant->id);

        return $this->successResponse($stats, 'Merchant stats retrieved successfully');
    }

    public function update(UpdateMyMerchantRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $data = MerchantData::from($request->validated());
        $merchant = $this->merchantService->updateMerchant($merchant->id, $data);

        return $this->successResponse(
            new MerchantResource($merchant->load(['user', 'businessType', 'address'])),
            'Merchant updated successfully'
        );
    }

    public function uploadLogo(UploadMerchantLogoRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $merchant->addMediaFromRequest('logo')
            ->toMediaCollection('logo');

        return $this->successResponse(
            new MerchantResource($merchant->refresh()->load(['user', 'businessType', 'media'])),
            'Merchant logo uploaded successfully'
        );
    }

    public function deleteLogo(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $merchant->clearMediaCollection('logo');

        return $this->successResponse(null, 'Merchant logo deleted successfully');
    }

    public function updateBusinessHours(UpdateBusinessHoursRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $merchant = $this->merchantService->updateBusinessHours($merchant->id, $request->validated('hours'));

        return $this->successResponse(
            MerchantBusinessHourResource::collection($merchant->businessHours),
            'Business hours updated successfully'
        );
    }

    public function syncPaymentMethods(SyncPaymentMethodsRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $merchant = $this->merchantService->syncPaymentMethods($merchant->id, $request->validated('payment_method_ids'));

        return $this->successResponse(
            PaymentMethodResource::collection($merchant->paymentMethods),
            'Payment methods synced successfully'
        );
    }

    public function syncSocialLinks(SyncSocialLinksRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $merchant = $this->merchantService->syncSocialLinks($merchant->id, $request->validated('social_links'));

        return $this->successResponse(
            MerchantSocialLinkResource::collection($merchant->socialLinks),
            'Social links synced successfully'
        );
    }

    public function uploadDocument(UploadMerchantDocumentRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        $document = $this->merchantService->createDocument(
            $merchant->id,
            (int) $request->validated('document_type_id'),
            $request->validated('notes')
        );

        $document->addMediaFromRequest('document')
            ->toMediaCollection('document');

        return $this->createdResponse(
            new MerchantDocumentResource($document->load(['documentType', 'media'])),
            'Document uploaded successfully'
        );
    }

    public function deleteDocument(Request $request, int $documentId): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        try {
            $this->merchantService->deleteDocument($merchant->id, $documentId);

            return $this->successResponse(null, 'Document deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function getGallery(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $merchant = $this->merchantService->getMerchantById($merchant->id);

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

    public function uploadGalleryImage(UploadMerchantGalleryImageRequest $request, string $collection): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

        if (! array_key_exists($collection, Merchant::GALLERY_COLLECTIONS)) {
            return $this->errorResponse('Invalid collection. Must be one of: ' . implode(', ', array_keys(Merchant::GALLERY_COLLECTIONS)), 422);
        }

        $merchant = $this->merchantService->getMerchantById($merchant->id);
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

    public function deleteGalleryImage(Request $request, int $mediaId): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        if ($response = $this->checkBranchSelfEditPermission($merchant)) {
            return $response;
        }

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

    public function statusLogs(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $logs = $this->merchantService->getMerchantStatusLogs($merchant->id);

        return $this->successResponse(
            MerchantStatusLogResource::collection($logs),
            'Status logs retrieved successfully'
        );
    }

    public function submitApplication(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $merchant = $this->merchantService->submitApplication($merchant->id);

        return $this->successResponse(
            new MerchantResource($merchant->load(['user', 'businessType'])),
            'Application submitted successfully'
        );
    }

    public function onboardingChecklist(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $checklist = $this->merchantService->getOnboardingChecklist(
            $merchant->id,
            $request->user()->id
        );

        return $this->successResponse($checklist, 'Onboarding checklist retrieved successfully');
    }

    public function branches(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $branches = $this->merchantService->getMerchantBranches($merchant->id, $request->all());

        return $this->paginatedResponse($branches, MerchantResource::class);
    }

    public function showBranch(Request $request, int $branchId): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $branch = $this->merchantService->getMerchantBranchById($merchant->id, $branchId);

        return $this->successResponse(
            new MerchantResource($branch),
            'Branch retrieved successfully'
        );
    }

    public function storeBranch(StoreBranchRequest $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $branch = DB::transaction(function () use ($request, $merchant) {
            $validated = $request->validated();

            // Create user account for the branch manager
            $user = User::create([
                'name' => $validated['user_name'],
                'email' => $validated['user_email'],
                'password' => Hash::make($validated['user_password']),
            ]);
            $user->assignRole('branch-merchant');

            // Build merchant data excluding user fields
            $merchantFields = collect($validated)
                ->except(['user_name', 'user_email', 'user_password'])
                ->toArray();

            // Default contact_email to user_email if not provided
            if (empty($merchantFields['contact_email'])) {
                $merchantFields['contact_email'] = $validated['user_email'];
            }

            $data = MerchantData::from($merchantFields);

            $branch = $this->merchantService->createBranch($merchant->id, $data, $user->id);

            return $branch;
        });

        return $this->createdResponse(
            new MerchantResource($branch),
            'Branch created successfully'
        );
    }

    public function updateBranch(UpdateBranchRequest $request, int $branchId): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $data = MerchantData::from($request->validated());
        $branch = $this->merchantService->updateBranch($merchant->id, $branchId, $data);

        return $this->successResponse(
            new MerchantResource($branch),
            'Branch updated successfully'
        );
    }

    public function bookingsCalendar(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $month = $request->validate(['month' => 'required|date_format:Y-m'])['month'];
        $calendar = $this->bookingService->getBookingCalendar($merchant->id, $month);

        return $this->successResponse($calendar, 'Booking calendar retrieved successfully');
    }

    public function reservationsCalendar(Request $request): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        $month = $request->validate(['month' => 'required|date_format:Y-m'])['month'];
        $calendar = $this->reservationService->getReservationCalendar($merchant->id, $month);

        return $this->successResponse($calendar, 'Reservation calendar retrieved successfully');
    }

    public function destroyBranch(Request $request, int $branchId): JsonResponse
    {
        $merchant = $request->user()->merchant;

        if (! $merchant) {
            return $this->notFoundResponse('No merchant associated with your account');
        }

        try {
            $this->merchantService->deleteBranch($merchant->id, $branchId);

            return $this->successResponse(null, 'Branch deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->errorResponse('Branch not found', 422);
        }
    }

    // ─── Organization Branch Management ───────────────────────────────

    public function showBranchDetail(Request $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch = $this->merchantService->getMerchantById($branch->id);

        return $this->successResponse(
            new MerchantResource($branch),
            'Branch detail retrieved successfully'
        );
    }

    public function updateBranchDetails(UpdateMyMerchantRequest $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $data = MerchantData::from($request->validated());
        $branch = $this->merchantService->updateMerchant($branch->id, $data);

        return $this->successResponse(
            new MerchantResource($branch->load(['user', 'businessType', 'address'])),
            'Branch updated successfully'
        );
    }

    public function uploadBranchLogo(UploadMerchantLogoRequest $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch->addMediaFromRequest('logo')
            ->toMediaCollection('logo');

        return $this->successResponse(
            new MerchantResource($branch->refresh()->load(['user', 'businessType', 'media'])),
            'Branch logo uploaded successfully'
        );
    }

    public function deleteBranchLogo(Request $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch->clearMediaCollection('logo');

        return $this->successResponse(null, 'Branch logo deleted successfully');
    }

    public function getBranchGallery(Request $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch = $this->merchantService->getMerchantById($branch->id);

        $data = [];
        foreach (Merchant::GALLERY_COLLECTIONS as $key => $collection) {
            $media = $branch->getMedia($collection);
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

        return $this->successResponse($data, 'Branch gallery retrieved successfully');
    }

    public function uploadBranchGalleryImage(UploadMerchantGalleryImageRequest $request, int $branchId, string $collection): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        if (! array_key_exists($collection, Merchant::GALLERY_COLLECTIONS)) {
            return $this->errorResponse('Invalid collection. Must be one of: '.implode(', ', array_keys(Merchant::GALLERY_COLLECTIONS)), 422);
        }

        $collectionName = Merchant::GALLERY_COLLECTIONS[$collection];

        $media = $branch->addMediaFromRequest('image')
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
        ], 'Branch gallery image uploaded successfully');
    }

    public function deleteBranchGalleryImage(Request $request, int $branchId, int $mediaId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $galleryCollections = array_values(Merchant::GALLERY_COLLECTIONS);
        $media = $branch->media()->where('id', $mediaId)
            ->whereIn('collection_name', $galleryCollections)
            ->first();

        if (! $media) {
            return $this->errorResponse('Gallery image not found', 404);
        }

        $media->delete();

        return $this->successResponse(null, 'Branch gallery image deleted successfully');
    }

    public function updateBranchBusinessHours(UpdateBusinessHoursRequest $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch = $this->merchantService->updateBusinessHours($branch->id, $request->validated('hours'));

        return $this->successResponse(
            MerchantBusinessHourResource::collection($branch->businessHours),
            'Branch business hours updated successfully'
        );
    }

    public function syncBranchPaymentMethods(SyncPaymentMethodsRequest $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch = $this->merchantService->syncPaymentMethods($branch->id, $request->validated('payment_method_ids'));

        return $this->successResponse(
            PaymentMethodResource::collection($branch->paymentMethods),
            'Branch payment methods synced successfully'
        );
    }

    public function syncBranchSocialLinks(SyncSocialLinksRequest $request, int $branchId): JsonResponse
    {
        $branch = $this->resolveBranch($request, $branchId);

        if ($branch instanceof JsonResponse) {
            return $branch;
        }

        $branch = $this->merchantService->syncSocialLinks($branch->id, $request->validated('social_links'));

        return $this->successResponse(
            MerchantSocialLinkResource::collection($branch->socialLinks),
            'Branch social links synced successfully'
        );
    }
}
