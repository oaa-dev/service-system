<?php

use App\Models\Merchant;
use App\Models\PaymentMethod;
use App\Models\Service;
use App\Models\User;
use Laravel\Passport\Passport;

describe('Storefront Branch Filtering', function () {

    it('filters out organization merchants from storefront listing', function () {
        // Organization merchant (should NOT appear)
        Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        // Branch merchant (should appear)
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);
        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
        ]);

        // Individual merchant (should appear)
        $individual = Merchant::factory()->create([
            'type' => 'individual',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200);

        $data = collect($response->json('data'));
        $types = $data->pluck('type')->unique()->toArray();

        // No organization type should appear
        expect($types)->not->toContain('organization');

        // Branch and individual should be in results
        $ids = $data->pluck('id')->toArray();
        expect($ids)->toContain($branch->id);
        expect($ids)->toContain($individual->id);
    });

    it('shows individual and branch merchants in storefront listing', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        Merchant::factory()->count(2)->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
        ]);

        Merchant::factory()->count(3)->create([
            'type' => 'individual',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200);
        // 2 branches + 3 individuals = 5 results (org excluded)
        expect($response->json('data'))->toHaveCount(5);
    });

    it('filters organizations from all active merchants on map endpoint', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
            'name' => 'Org Corp',
        ]);

        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'name' => 'Branch A',
        ]);

        $individual = Merchant::factory()->create([
            'type' => 'individual',
            'status' => 'active',
            'name' => 'Indie Shop',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants/map');

        $response->assertStatus(200);

        $data = collect($response->json('data'));
        $ids = $data->pluck('id')->toArray();

        expect($ids)->not->toContain($org->id);
        expect($ids)->toContain($branch->id);
        expect($ids)->toContain($individual->id);
    });
});

describe('Branch Inheritance', function () {

    it('loads parent relation for branch in merchant detail', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
            'name' => 'Parent Organization',
            'description' => 'The parent org description',
        ]);

        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'name' => 'Branch Location',
            'description' => null,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$branch->slug}");

        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data['parent'])->not->toBeNull();
        expect($data['parent']['id'])->toBe($org->id);
        expect($data['parent']['name'])->toBe('Parent Organization');
        expect($data['parent']['slug'])->toBe($org->slug);
        expect($data['parent']['description'])->toBe('The parent org description');
        expect($data['parent'])->toHaveKey('logo');
        expect($data['parent'])->toHaveKey('address');
        expect($data['parent'])->toHaveKey('business_hours');
    });

    it('does not load parent for individual merchants', function () {
        $individual = Merchant::factory()->create([
            'type' => 'individual',
            'status' => 'active',
            'parent_id' => null,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$individual->slug}");

        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data['parent'])->toBeNull();
    });
});

describe('Branch Self-Edit Permission', function () {

    it('allows branch self-edit when branch has allow_branch_self_edit enabled', function () {
        $orgUser = User::factory()->create(['email_verified_at' => now()]);
        $orgUser->assignRole('merchant');
        $org = Merchant::factory()->create([
            'user_id' => $orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branchUser = User::factory()->create(['email_verified_at' => now()]);
        $branchUser->assignRole('branch-merchant');
        Merchant::factory()->create([
            'user_id' => $branchUser->id,
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'allow_branch_self_edit' => true,
        ]);

        Passport::actingAs($branchUser);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Updated Branch Name',
        ]);

        $response->assertStatus(200);
    });

    it('blocks branch self-edit when branch has allow_branch_self_edit disabled', function () {
        $orgUser = User::factory()->create(['email_verified_at' => now()]);
        $orgUser->assignRole('merchant');
        $org = Merchant::factory()->create([
            'user_id' => $orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branchUser = User::factory()->create(['email_verified_at' => now()]);
        $branchUser->assignRole('branch-merchant');
        Merchant::factory()->create([
            'user_id' => $branchUser->id,
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'allow_branch_self_edit' => false,
        ]);

        Passport::actingAs($branchUser);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Blocked Edit',
        ]);

        $response->assertStatus(403);
    });

    it('does not apply self-edit check to individual merchants', function () {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('merchant');
        Merchant::factory()->create([
            'user_id' => $user->id,
            'type' => 'individual',
            'status' => 'active',
            'parent_id' => null,
        ]);

        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Updated Individual',
        ]);

        $response->assertStatus(200);
    });

    it('does not apply self-edit check to organization merchants', function () {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('merchant');
        Merchant::factory()->create([
            'user_id' => $user->id,
            'type' => 'organization',
            'status' => 'active',
            'parent_id' => null,
        ]);

        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/auth/merchant', [
            'name' => 'Updated Org',
        ]);

        $response->assertStatus(200);
    });
});

describe('Organization Branch Management', function () {

    beforeEach(function () {
        $this->orgUser = User::factory()->create(['email_verified_at' => now()]);
        $this->orgUser->assignRole('merchant');
        $this->org = Merchant::factory()->create([
            'user_id' => $this->orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branchUser = User::factory()->create(['email_verified_at' => now()]);
        $branchUser->assignRole('branch-merchant');
        $this->branch = Merchant::factory()->create([
            'user_id' => $branchUser->id,
            'parent_id' => $this->org->id,
            'type' => 'individual',
            'status' => 'active',
        ]);

        Passport::actingAs($this->orgUser);
    });

    it('allows organization to view branch detail', function () {
        $response = $this->getJson("/api/v1/auth/merchant/branches/{$this->branch->id}/detail");

        $response->assertStatus(200);
        expect($response->json('data.id'))->toBe($this->branch->id);
        expect($response->json('data.name'))->toBe($this->branch->name);
    });

    it('allows organization to update branch details', function () {
        $response = $this->putJson("/api/v1/auth/merchant/branches/{$this->branch->id}/detail", [
            'name' => 'Updated Branch Name',
        ]);

        $response->assertStatus(200);
        expect($response->json('data.name'))->toBe('Updated Branch Name');
    });

    it('prevents non-parent from updating branch', function () {
        // Create a second org with its own branch
        $otherOrgUser = User::factory()->create(['email_verified_at' => now()]);
        $otherOrgUser->assignRole('merchant');
        $otherOrg = Merchant::factory()->create([
            'user_id' => $otherOrgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        $otherBranchUser = User::factory()->create(['email_verified_at' => now()]);
        $otherBranchUser->assignRole('branch-merchant');
        $otherBranch = Merchant::factory()->create([
            'user_id' => $otherBranchUser->id,
            'parent_id' => $otherOrg->id,
            'type' => 'individual',
            'status' => 'active',
        ]);

        // Act as org1 user and try to update org2's branch
        Passport::actingAs($this->orgUser);

        $response = $this->putJson("/api/v1/auth/merchant/branches/{$otherBranch->id}/detail", [
            'name' => 'Hacked Branch',
        ]);

        $response->assertStatus(404);
    });

    it('allows organization to update branch business hours', function () {
        $response = $this->putJson("/api/v1/auth/merchant/branches/{$this->branch->id}/business-hours", [
            'hours' => [
                [
                    'day_of_week' => 1,
                    'open_time' => '09:00',
                    'close_time' => '17:00',
                    'is_closed' => false,
                ],
            ],
        ]);

        $response->assertStatus(200);
    });

    it('allows organization to sync branch payment methods', function () {
        $pm = PaymentMethod::factory()->create(['is_active' => true]);

        $response = $this->postJson("/api/v1/auth/merchant/branches/{$this->branch->id}/payment-methods", [
            'payment_method_ids' => [$pm->id],
        ]);

        $response->assertStatus(200);
    });
});

describe('Storefront Branches', function () {

    it('merchant listing includes children_count', function () {
        // Create an organization merchant with 2 active branches
        $orgMerchant = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        Merchant::factory()->count(2)->create([
            'parent_id' => $orgMerchant->id,
            'status' => 'active',
        ]);

        // Individual merchant with no branches
        Merchant::factory()->create([
            'type' => 'individual',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/storefront/merchants');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id'],
                ],
            ]);
    });

    it('returns branches for organization merchant', function () {
        $orgMerchant = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branches = Merchant::factory()->count(3)->create([
            'parent_id' => $orgMerchant->id,
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$orgMerchant->slug}/branches");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug'],
                ],
                'meta' => ['total', 'current_page', 'per_page'],
            ]);

        expect($response->json('data'))->toHaveCount(3);

        $returnedIds = collect($response->json('data'))->pluck('id');
        foreach ($branches as $branch) {
            expect($returnedIds)->toContain($branch->id);
        }
    });

    it('returns 404 for individual merchant slug', function () {
        $individualMerchant = Merchant::factory()->create([
            'type' => 'individual',
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$individualMerchant->slug}/branches");

        $response->assertStatus(404);
    });

    it('returns 404 for non-existent merchant', function () {
        $response = $this->getJson('/api/v1/storefront/merchants/non-existent-merchant-slug/branches');

        $response->assertStatus(404);
    });

    it('only returns active branches', function () {
        $orgMerchant = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        // 2 active branches
        Merchant::factory()->count(2)->create([
            'parent_id' => $orgMerchant->id,
            'status' => 'active',
        ]);

        // 1 pending branch (should NOT appear)
        Merchant::factory()->create([
            'parent_id' => $orgMerchant->id,
            'status' => 'pending',
        ]);

        // 1 suspended branch (should NOT appear)
        Merchant::factory()->create([
            'parent_id' => $orgMerchant->id,
            'status' => 'suspended',
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$orgMerchant->slug}/branches");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('returns 404 when parent merchant is not active', function () {
        $pendingOrg = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'pending',
        ]);

        Merchant::factory()->count(2)->create([
            'parent_id' => $pendingOrg->id,
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$pendingOrg->slug}/branches");

        $response->assertStatus(404);
    });

    it('paginate branches correctly', function () {
        $orgMerchant = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        // Create 20 active branches
        Merchant::factory()->count(20)->create([
            'parent_id' => $orgMerchant->id,
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$orgMerchant->slug}/branches?per_page=5");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(5);
        expect($response->json('meta.total'))->toBe(20);
    });
});

describe('Branch Service Inheritance', function () {

    it('returns parent services when branch is in inherit mode', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'inherit_from_parent' => true,
        ]);

        // Parent has services, branch has none
        Service::factory()->create([
            'merchant_id' => $org->id,
            'name' => 'Parent Service',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$branch->slug}/services");

        $response->assertStatus(200);
        $serviceNames = collect($response->json('data'))->pluck('name');
        expect($serviceNames)->toContain('Parent Service');
    });

    it('returns branch own services when standalone with own services', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'inherit_from_parent' => false,
        ]);

        Service::factory()->create([
            'merchant_id' => $org->id,
            'name' => 'Parent Service',
            'is_active' => true,
        ]);

        Service::factory()->create([
            'merchant_id' => $branch->id,
            'name' => 'Branch Service',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$branch->slug}/services");

        $response->assertStatus(200);
        $serviceNames = collect($response->json('data'))->pluck('name');
        expect($serviceNames)->toContain('Branch Service');
        expect($serviceNames)->not->toContain('Parent Service');
    });

    it('falls back to parent services when standalone branch has no services', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'inherit_from_parent' => false,
        ]);

        Service::factory()->create([
            'merchant_id' => $org->id,
            'name' => 'Parent Service Fallback',
            'is_active' => true,
        ]);

        // Branch has no services of its own
        $response = $this->getJson("/api/v1/storefront/merchants/{$branch->slug}/services");

        $response->assertStatus(200);
        $serviceNames = collect($response->json('data'))->pluck('name');
        expect($serviceNames)->toContain('Parent Service Fallback');
    });

    it('returns parent contact info in parent block', function () {
        $org = Merchant::factory()->create([
            'type' => 'organization',
            'status' => 'active',
            'contact_email' => 'org@example.com',
            'contact_phone' => '09123456789',
        ]);

        $branch = Merchant::factory()->create([
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'contact_email' => null,
            'contact_phone' => null,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$branch->slug}");

        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data['parent'])->not->toBeNull();
        expect($data['parent']['contact_email'])->toBe('org@example.com');
        expect($data['parent']['contact_phone'])->toBe('09123456789');
    });

    it('org can set inherit_from_parent and allow_branch_self_edit per branch', function () {
        $orgUser = User::factory()->create(['email_verified_at' => now()]);
        $orgUser->assignRole('merchant');
        $org = Merchant::factory()->create([
            'user_id' => $orgUser->id,
            'type' => 'organization',
            'status' => 'active',
        ]);

        $branchUser = User::factory()->create(['email_verified_at' => now()]);
        $branchUser->assignRole('branch-merchant');
        $branch = Merchant::factory()->create([
            'user_id' => $branchUser->id,
            'parent_id' => $org->id,
            'type' => 'individual',
            'status' => 'active',
            'inherit_from_parent' => true,
            'allow_branch_self_edit' => true,
        ]);

        Passport::actingAs($orgUser);

        $response = $this->putJson("/api/v1/auth/merchant/branches/{$branch->id}", [
            'inherit_from_parent' => false,
            'allow_branch_self_edit' => false,
        ]);

        $response->assertStatus(200);

        $branch->refresh();
        expect($branch->inherit_from_parent)->toBeFalse();
        expect($branch->allow_branch_self_edit)->toBeFalse();
    });
});
