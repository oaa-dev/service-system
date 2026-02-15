<?php

use App\Models\BusinessType;
use App\Models\DocumentType;
use App\Models\Merchant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Laravel\Passport\Passport;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->merchantUser = User::factory()->create(['email_verified_at' => now()]);
    $this->merchantUser->assignRole('merchant');
    $this->merchant = Merchant::factory()->create([
        'user_id' => $this->merchantUser->id,
        'status' => 'pending',
        'business_type_id' => null,
        'description' => null,
    ]);
});

describe('Onboarding Checklist', function () {
    it('returns checklist for a new merchant with minimal data', function () {
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'items' => [['key', 'label', 'description', 'completed']],
                    'completed_count',
                    'total_count',
                    'completion_percentage',
                ],
            ]);

        $data = $response->json('data');
        expect($data['total_count'])->toBe(9);
        // account_created + email_verified = 2 completed
        expect($data['completed_count'])->toBe(2);
        expect($data['completion_percentage'])->toBe(22);
    });

    it('marks business_type_selected when business type assigned', function () {
        $bt = BusinessType::factory()->create();
        $this->merchant->update(['business_type_id' => $bt->id]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'business_type_selected')['completed'])->toBeTrue();
    });

    it('marks capabilities_configured when at least one capability is true', function () {
        Passport::actingAs($this->merchantUser);

        $this->merchant->update(['can_sell_products' => true]);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');
        $response->assertOk();

        $capabilities = collect($response->json('data.items'))->firstWhere('key', 'capabilities_configured');
        expect($capabilities['completed'])->toBeTrue();
    });

    it('marks business_details_completed when all fields present', function () {
        $this->merchant->update([
            'name' => 'My Store',
            'contact_email' => 'store@test.com',
            'description' => 'A great store',
        ]);
        $this->merchant->updateOrCreateAddress([
            'address_line_1' => '123 Main St',
            'country' => 'PH',
        ]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'business_details_completed')['completed'])->toBeTrue();
    });

    it('marks business_details_completed as false when missing description', function () {
        $this->merchant->update(['description' => null]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'business_details_completed')['completed'])->toBeFalse();
    });

    it('marks documents_uploaded when at least one document exists', function () {
        $docType = DocumentType::factory()->create();
        $this->merchant->documents()->create([
            'document_type_id' => $docType->id,
        ]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'documents_uploaded')['completed'])->toBeTrue();
    });

    it('marks application_submitted when status is submitted', function () {
        $this->merchant->update(['status' => 'submitted', 'submitted_at' => now()]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'application_submitted')['completed'])->toBeTrue();
    });

    it('marks admin_approved for approved merchants', function () {
        $this->merchant->update(['status' => 'approved', 'approved_at' => now()]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'admin_approved')['completed'])->toBeTrue();
    });

    it('marks admin_approved for active merchants', function () {
        $this->merchant->update(['status' => 'active', 'approved_at' => now()]);
        Passport::actingAs($this->merchantUser);

        $response = $this->getJson('/api/v1/auth/merchant/onboarding-checklist');

        $items = collect($response->json('data.items'));
        expect($items->firstWhere('key', 'admin_approved')['completed'])->toBeTrue();
    });

    it('requires authentication', function () {
        $this->getJson('/api/v1/auth/merchant/onboarding-checklist')
            ->assertUnauthorized();
    });

    it('returns 404 when user has no merchant', function () {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('admin');
        Passport::actingAs($user);

        $this->getJson('/api/v1/auth/merchant/onboarding-checklist')
            ->assertNotFound();
    });
});

describe('EnsureActiveMerchant Middleware', function () {
    it('blocks pending merchant from gallery endpoint', function () {
        Passport::actingAs($this->merchantUser);

        $this->getJson('/api/v1/auth/merchant/gallery')
            ->assertStatus(403);
    });

    it('allows active merchant to access gallery endpoint', function () {
        $this->merchant->update(['status' => 'active', 'approved_at' => now()]);
        Passport::actingAs($this->merchantUser);

        $this->getJson('/api/v1/auth/merchant/gallery')
            ->assertOk();
    });

    it('allows approved merchant to access gallery endpoint', function () {
        $this->merchant->update(['status' => 'approved', 'approved_at' => now()]);
        Passport::actingAs($this->merchantUser);

        $this->getJson('/api/v1/auth/merchant/gallery')
            ->assertOk();
    });

    it('admin bypasses active merchant check', function () {
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');
        Passport::actingAs($admin);

        // Admin accesses via admin routes, not self-service, so this is a sanity check
        // The middleware only applies to merchant-role users
        $merchant = Merchant::factory()->create(['status' => 'pending']);
        $this->getJson("/api/v1/merchants/{$merchant->id}/gallery")
            ->assertOk();
    });
});
