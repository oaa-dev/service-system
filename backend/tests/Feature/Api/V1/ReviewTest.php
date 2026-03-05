<?php

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\User;
use Laravel\Passport\Passport;

/*
|--------------------------------------------------------------------------
| Customer Review CRUD
|--------------------------------------------------------------------------
*/
describe('Customer Review CRUD', function () {
    beforeEach(function () {
        // Create customer user
        $this->user = User::factory()->create();
        $this->user->assignRole('customer');
        $this->customer = Customer::factory()->create(['user_id' => $this->user->id]);

        // Create active merchant
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
            'can_take_bookings' => true,
            'can_sell_products' => true,
            'can_rent_units' => true,
        ]);

        // Create a bookable service
        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        Passport::actingAs($this->user);
    });

    it('can create a review with a completed booking', function () {
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'completed',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'title' => 'Great service',
            'comment' => 'Really enjoyed the experience.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Review created successfully.',
            ])
            ->assertJsonPath('data.rating', 4)
            ->assertJsonPath('data.title', 'Great service')
            ->assertJsonPath('data.comment', 'Really enjoyed the experience.')
            ->assertJsonPath('data.merchant_id', $this->merchant->id)
            ->assertJsonPath('data.customer_id', $this->customer->id)
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonPath('data.is_published', true);

        expect(Review::count())->toBe(1);
    });

    it('can create a review with a completed reservation', function () {
        $reservationService = Service::factory()->reservation()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        Reservation::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $reservationService->id,
            'status' => 'checked_out',
            'checked_out_at' => now(),
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 5,
            'title' => 'Amazing stay',
            'comment' => 'Would come back again!',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.rating', 5);

        expect(Review::count())->toBe(1);
    });

    it('can create a review with a completed service order', function () {
        $sellableService = Service::factory()->sellable()->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        ServiceOrder::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $sellableService->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 3,
            'comment' => 'Decent product, average experience.',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.rating', 3);

        expect(Review::count())->toBe(1);
    });

    it('cannot create a review without a completed transaction', function () {
        // Booking exists but is not completed
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'title' => 'Should fail',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You must have a completed transaction to review this merchant.',
            ]);

        expect(Review::count())->toBe(0);
    });

    it('cannot create a duplicate review for the same merchant', function () {
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'completed',
        ]);

        // First review succeeds
        $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'title' => 'First review',
        ])->assertStatus(201);

        // Second review is rejected
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 5,
            'title' => 'Duplicate attempt',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'You have already reviewed this merchant.',
            ]);

        expect(Review::count())->toBe(1);
    });

    it('can update own review', function () {
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'completed',
        ]);

        $review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
            'rating' => 3,
            'title' => 'Original title',
        ]);

        $response = $this->putJson("/api/v1/customer/reviews/{$review->id}", [
            'rating' => 5,
            'title' => 'Updated title',
            'comment' => 'Updated comment.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Review updated successfully.',
            ])
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.comment', 'Updated comment.');
    });

    it('cannot update another customer review', function () {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $otherCustomer = Customer::factory()->create(['user_id' => $otherUser->id]);

        $review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $otherCustomer->id,
            'rating' => 4,
        ]);

        $response = $this->putJson("/api/v1/customer/reviews/{$review->id}", [
            'rating' => 1,
            'title' => 'Hijack attempt',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to update this review.',
            ]);
    });

    it('can delete own review', function () {
        $review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
            'rating' => 3,
        ]);

        expect(Review::count())->toBe(1);

        $response = $this->deleteJson("/api/v1/customer/reviews/{$review->id}");

        $response->assertStatus(204);
        expect(Review::count())->toBe(0);
    });

    it('cannot delete another customer review', function () {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $otherCustomer = Customer::factory()->create(['user_id' => $otherUser->id]);

        $review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $otherCustomer->id,
            'rating' => 4,
        ]);

        $response = $this->deleteJson("/api/v1/customer/reviews/{$review->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to delete this review.',
            ]);

        expect(Review::count())->toBe(1);
    });

    it('can list my reviews', function () {
        // Create 3 reviews for the authenticated customer across different merchants
        $merchants = [];
        for ($i = 0; $i < 3; $i++) {
            $mUser = User::factory()->create();
            $mUser->assignRole('merchant');
            $m = Merchant::factory()->create([
                'user_id' => $mUser->id,
                'status' => 'active',
            ]);
            $merchants[] = $m;

            Review::factory()->create([
                'merchant_id' => $m->id,
                'customer_id' => $this->customer->id,
                'rating' => $i + 3,
            ]);
        }

        // Create a review by another customer (should not appear)
        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $otherCustomer = Customer::factory()->create(['user_id' => $otherUser->id]);
        Review::factory()->create([
            'merchant_id' => $merchants[0]->id,
            'customer_id' => $otherCustomer->id,
        ]);

        $response = $this->getJson('/api/v1/customer/reviews');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data');

        // Verify pagination meta exists
        $response->assertJsonStructure([
            'success',
            'data',
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
        ]);
    });

    it('can create a review with only rating (title and comment optional)', function () {
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'completed',
        ]);

        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 5,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.title', null)
            ->assertJsonPath('data.comment', null);
    });
});

/*
|--------------------------------------------------------------------------
| Rating Recalculation
|--------------------------------------------------------------------------
*/
describe('Rating Recalculation', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('customer');
        $this->customer = Customer::factory()->create(['user_id' => $this->user->id]);

        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);

        $this->service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        // Create completed booking for the customer
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'completed',
        ]);

        Passport::actingAs($this->user);
    });

    it('updates merchant average_rating and review_count on create', function () {
        // Before any reviews
        $this->merchant->refresh();
        expect($this->merchant->review_count)->toBe(0);

        // Create first review (4 stars)
        $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
        ])->assertStatus(201);

        $this->merchant->refresh();
        expect($this->merchant->review_count)->toBe(1);
        expect((float) $this->merchant->average_rating)->toBe(4.0);

        // Create second review from different customer (2 stars)
        $user2 = User::factory()->create();
        $user2->assignRole('customer');
        $customer2 = Customer::factory()->create(['user_id' => $user2->id]);
        Booking::factory()->create([
            'customer_id' => $user2->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'status' => 'completed',
        ]);

        Passport::actingAs($user2);
        $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 2,
        ])->assertStatus(201);

        $this->merchant->refresh();
        expect($this->merchant->review_count)->toBe(2);
        expect((float) $this->merchant->average_rating)->toBe(3.0); // (4+2)/2
    });

    it('updates merchant average_rating and review_count on delete', function () {
        // Create two reviews directly
        $review1 = Review::factory()->rating(5)->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
        ]);

        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $otherCustomer = Customer::factory()->create(['user_id' => $otherUser->id]);
        $review2 = Review::factory()->rating(3)->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $otherCustomer->id,
        ]);

        // Manually recalculate to ensure merchant stats are correct
        // (factory creation doesn't trigger the service recalculation)
        Merchant::where('id', $this->merchant->id)->update([
            'average_rating' => 4.0,
            'review_count' => 2,
        ]);

        // Delete review1 (the customer's own review)
        $this->deleteJson("/api/v1/customer/reviews/{$review1->id}")->assertStatus(204);

        $this->merchant->refresh();
        expect($this->merchant->review_count)->toBe(1);
        expect((float) $this->merchant->average_rating)->toBe(3.0); // only review2 remains
    });

    it('recalculates average_rating when review is toggled unpublished', function () {
        // Create two published reviews directly
        $review1 = Review::factory()->rating(5)->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
            'is_published' => true,
        ]);

        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');
        $otherCustomer = Customer::factory()->create(['user_id' => $otherUser->id]);
        Review::factory()->rating(3)->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $otherCustomer->id,
            'is_published' => true,
        ]);

        // Set initial stats
        Merchant::where('id', $this->merchant->id)->update([
            'average_rating' => 4.0,
            'review_count' => 2,
        ]);

        // Admin toggles first review to unpublished
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');
        Passport::actingAs($admin);

        $this->patchJson("/api/v1/reviews/{$review1->id}/toggle-publish")->assertStatus(200);

        $this->merchant->refresh();
        // Only the 3-star review is still published
        expect($this->merchant->review_count)->toBe(1);
        expect((float) $this->merchant->average_rating)->toBe(3.0);
    });

    it('sets average_rating to null when all reviews are removed', function () {
        $review = Review::factory()->rating(4)->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
        ]);

        Merchant::where('id', $this->merchant->id)->update([
            'average_rating' => 4.0,
            'review_count' => 1,
        ]);

        $this->deleteJson("/api/v1/customer/reviews/{$review->id}")->assertStatus(204);

        $this->merchant->refresh();
        expect($this->merchant->review_count)->toBe(0);
        expect($this->merchant->average_rating)->toBeNull();
    });
});

/*
|--------------------------------------------------------------------------
| Merchant Reply
|--------------------------------------------------------------------------
*/
describe('Merchant Reply', function () {
    beforeEach(function () {
        // Create merchant user + merchant
        $this->merchantUser = User::factory()->create();
        $this->merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $this->merchantUser->id,
            'status' => 'active',
        ]);

        // Create a customer with a review on this merchant
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');
        $this->customer = Customer::factory()->create(['user_id' => $customerUser->id]);
        $this->review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
            'rating' => 4,
            'title' => 'Good service',
            'comment' => 'Would recommend.',
        ]);

        Passport::actingAs($this->merchantUser);
    });

    it('merchant can reply to a review on own store', function () {
        $response = $this->postJson("/api/v1/auth/merchant/reviews/{$this->review->id}/reply", [
            'reply' => 'Thank you for your feedback!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Reply added successfully.',
            ])
            ->assertJsonPath('data.merchant_reply', 'Thank you for your feedback!')
            ->assertJsonPath('data.id', $this->review->id);

        // Verify merchant_replied_at is set
        $this->review->refresh();
        expect($this->review->merchant_reply)->toBe('Thank you for your feedback!');
        expect($this->review->merchant_replied_at)->not->toBeNull();
    });

    it('merchant cannot reply to a review on another merchant store', function () {
        // Create another merchant's review
        $otherMerchantUser = User::factory()->create();
        $otherMerchantUser->assignRole('merchant');
        $otherMerchant = Merchant::factory()->create([
            'user_id' => $otherMerchantUser->id,
            'status' => 'active',
        ]);

        $otherReview = Review::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'customer_id' => $this->customer->id,
            'rating' => 2,
        ]);

        $response = $this->postJson("/api/v1/auth/merchant/reviews/{$otherReview->id}/reply", [
            'reply' => 'Should not be allowed.',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to reply to this review.',
            ]);
    });

    it('merchant can update their reply', function () {
        // First add a reply
        $this->review->update([
            'merchant_reply' => 'Original reply',
            'merchant_replied_at' => now(),
        ]);

        $response = $this->putJson("/api/v1/auth/merchant/reviews/{$this->review->id}/reply", [
            'reply' => 'Updated reply text.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Reply updated successfully.',
            ])
            ->assertJsonPath('data.merchant_reply', 'Updated reply text.');
    });

    it('merchant can delete their reply', function () {
        // First add a reply
        $this->review->update([
            'merchant_reply' => 'Reply to delete',
            'merchant_replied_at' => now(),
        ]);

        $response = $this->deleteJson("/api/v1/auth/merchant/reviews/{$this->review->id}/reply");

        $response->assertStatus(204);

        $this->review->refresh();
        expect($this->review->merchant_reply)->toBeNull();
        expect($this->review->merchant_replied_at)->toBeNull();
    });

    it('merchant can list reviews for own store', function () {
        // Create additional reviews for this merchant
        for ($i = 0; $i < 4; $i++) {
            $u = User::factory()->create();
            $u->assignRole('customer');
            $c = Customer::factory()->create(['user_id' => $u->id]);
            Review::factory()->create([
                'merchant_id' => $this->merchant->id,
                'customer_id' => $c->id,
                'rating' => $i + 1,
            ]);
        }

        // Create a review on another merchant (should not appear)
        $otherMerchantUser = User::factory()->create();
        $otherMerchantUser->assignRole('merchant');
        $otherMerchant = Merchant::factory()->create([
            'user_id' => $otherMerchantUser->id,
            'status' => 'active',
        ]);
        $extraUser = User::factory()->create();
        $extraUser->assignRole('customer');
        $extraCustomer = Customer::factory()->create(['user_id' => $extraUser->id]);
        Review::factory()->create([
            'merchant_id' => $otherMerchant->id,
            'customer_id' => $extraCustomer->id,
        ]);

        $response = $this->getJson('/api/v1/auth/merchant/reviews');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // 1 from beforeEach + 4 created here = 5 for this merchant
        $response->assertJsonCount(5, 'data');
    });

    it('merchant cannot update reply on another merchant review', function () {
        $otherMerchantUser = User::factory()->create();
        $otherMerchantUser->assignRole('merchant');
        $otherMerchant = Merchant::factory()->create([
            'user_id' => $otherMerchantUser->id,
            'status' => 'active',
        ]);

        $otherReview = Review::factory()->withReply()->create([
            'merchant_id' => $otherMerchant->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->putJson("/api/v1/auth/merchant/reviews/{$otherReview->id}/reply", [
            'reply' => 'Hijack update attempt.',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to update this reply.',
            ]);
    });

    it('merchant cannot delete reply on another merchant review', function () {
        $otherMerchantUser = User::factory()->create();
        $otherMerchantUser->assignRole('merchant');
        $otherMerchant = Merchant::factory()->create([
            'user_id' => $otherMerchantUser->id,
            'status' => 'active',
        ]);

        $otherReview = Review::factory()->withReply()->create([
            'merchant_id' => $otherMerchant->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->deleteJson("/api/v1/auth/merchant/reviews/{$otherReview->id}/reply");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to delete this reply.',
            ]);
    });
});

/*
|--------------------------------------------------------------------------
| Admin Moderation
|--------------------------------------------------------------------------
*/
describe('Admin Moderation', function () {
    beforeEach(function () {
        $this->admin = User::factory()->create();
        $this->admin->assignRole('super-admin');

        // Create merchant with reviews
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');
        $this->customer = Customer::factory()->create(['user_id' => $customerUser->id]);

        $this->review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
            'rating' => 4,
            'is_published' => true,
        ]);

        Passport::actingAs($this->admin);
    });

    it('admin can list all reviews', function () {
        // Create additional reviews on another merchant
        $mUser2 = User::factory()->create();
        $mUser2->assignRole('merchant');
        $merchant2 = Merchant::factory()->create([
            'user_id' => $mUser2->id,
            'status' => 'active',
        ]);

        $cUser2 = User::factory()->create();
        $cUser2->assignRole('customer');
        $customer2 = Customer::factory()->create(['user_id' => $cUser2->id]);
        Review::factory()->create([
            'merchant_id' => $merchant2->id,
            'customer_id' => $customer2->id,
        ]);

        $response = $this->getJson('/api/v1/reviews');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data');

        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'merchant_id',
                    'customer_id',
                    'rating',
                    'title',
                    'comment',
                    'is_verified',
                    'is_published',
                    'merchant_reply',
                    'admin_notes',
                    'created_at',
                    'updated_at',
                ],
            ],
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
        ]);
    });

    it('admin can toggle publish on a review', function () {
        expect($this->review->is_published)->toBeTrue();

        // Unpublish
        $response = $this->patchJson("/api/v1/reviews/{$this->review->id}/toggle-publish");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Review unpublished.',
            ])
            ->assertJsonPath('data.is_published', false);

        $this->review->refresh();
        expect($this->review->is_published)->toBeFalse();

        // Re-publish
        $response = $this->patchJson("/api/v1/reviews/{$this->review->id}/toggle-publish");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Review published.',
            ])
            ->assertJsonPath('data.is_published', true);
    });

    it('admin can add notes to a review', function () {
        $response = $this->putJson("/api/v1/reviews/{$this->review->id}/notes", [
            'admin_notes' => 'Flagged for inappropriate language. Reviewed and cleared.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Admin notes updated.',
            ])
            ->assertJsonPath('data.admin_notes', 'Flagged for inappropriate language. Reviewed and cleared.');

        $this->review->refresh();
        expect($this->review->admin_notes)->toBe('Flagged for inappropriate language. Reviewed and cleared.');
    });

    it('admin can filter reviews by merchant_id', function () {
        $mUser2 = User::factory()->create();
        $mUser2->assignRole('merchant');
        $merchant2 = Merchant::factory()->create([
            'user_id' => $mUser2->id,
            'status' => 'active',
        ]);

        $cUser2 = User::factory()->create();
        $cUser2->assignRole('customer');
        $customer2 = Customer::factory()->create(['user_id' => $cUser2->id]);
        Review::factory()->create([
            'merchant_id' => $merchant2->id,
            'customer_id' => $customer2->id,
        ]);

        $response = $this->getJson("/api/v1/reviews?filter[merchant_id]={$this->merchant->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.merchant_id', $this->merchant->id);
    });

    it('non-admin cannot access admin review list', function () {
        $regularUser = User::factory()->create();
        $regularUser->assignRole('customer');
        Passport::actingAs($regularUser);

        $response = $this->getJson('/api/v1/reviews');

        $response->assertStatus(403);
    });

    it('non-admin cannot toggle publish', function () {
        $regularUser = User::factory()->create();
        $regularUser->assignRole('customer');
        Passport::actingAs($regularUser);

        $response = $this->patchJson("/api/v1/reviews/{$this->review->id}/toggle-publish");

        $response->assertStatus(403);
    });
});

/*
|--------------------------------------------------------------------------
| Storefront Public Reviews
|--------------------------------------------------------------------------
*/
describe('Storefront Public Reviews', function () {
    beforeEach(function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);
    });

    it('public can view published reviews for a merchant', function () {
        // Create published reviews
        for ($i = 0; $i < 3; $i++) {
            $u = User::factory()->create();
            $u->assignRole('customer');
            $c = Customer::factory()->create(['user_id' => $u->id]);
            Review::factory()->create([
                'merchant_id' => $this->merchant->id,
                'customer_id' => $c->id,
                'rating' => $i + 3,
                'is_published' => true,
            ]);
        }

        $response = $this->getJson("/api/v1/storefront/merchants/{$this->merchant->slug}/reviews");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data');

        // Verify response structure
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'rating',
                    'title',
                    'comment',
                    'merchant_reply',
                    'created_at',
                ],
            ],
            'meta',
        ]);
    });

    it('unpublished reviews are not shown in public list', function () {
        $u1 = User::factory()->create();
        $u1->assignRole('customer');
        $c1 = Customer::factory()->create(['user_id' => $u1->id]);
        Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $c1->id,
            'is_published' => true,
            'rating' => 5,
        ]);

        $u2 = User::factory()->create();
        $u2->assignRole('customer');
        $c2 = Customer::factory()->create(['user_id' => $u2->id]);
        Review::factory()->unpublished()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $c2->id,
            'rating' => 1,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$this->merchant->slug}/reviews");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // The only visible review should be the 5-star published one
        $response->assertJsonPath('data.0.rating', 5);
    });

    it('returns empty data for merchant with no published reviews', function () {
        $response = $this->getJson("/api/v1/storefront/merchants/{$this->merchant->slug}/reviews");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(0, 'data');
    });

    it('returns 404 for non-existent merchant slug', function () {
        $response = $this->getJson('/api/v1/storefront/merchants/non-existent-merchant/reviews');

        $response->assertStatus(404);
    });

    it('does not require authentication', function () {
        // Ensure no user is authenticated
        app('auth')->forgetGuards();

        $u = User::factory()->create();
        $u->assignRole('customer');
        $c = Customer::factory()->create(['user_id' => $u->id]);
        Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $c->id,
            'is_published' => true,
        ]);

        $response = $this->getJson("/api/v1/storefront/merchants/{$this->merchant->slug}/reviews");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/
describe('Validation', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->user->assignRole('customer');
        $this->customer = Customer::factory()->create(['user_id' => $this->user->id]);

        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $this->merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
            'can_take_bookings' => true,
        ]);

        $service = Service::factory()->bookable(60)->create([
            'merchant_id' => $this->merchant->id,
            'is_active' => true,
        ]);

        // Ensure a completed transaction exists
        Booking::factory()->create([
            'customer_id' => $this->user->id,
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'status' => 'completed',
        ]);

        Passport::actingAs($this->user);
    });

    it('requires rating to be between 1 and 5', function () {
        // Rating too low
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);

        // Rating too high
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 6,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);

        // Missing rating
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'title' => 'No rating',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    });

    it('rejects title longer than 255 characters', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'title' => str_repeat('A', 256),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    });

    it('accepts title of exactly 255 characters', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'title' => str_repeat('A', 255),
        ]);

        $response->assertStatus(201);
    });

    it('rejects comment longer than 5000 characters', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'comment' => str_repeat('B', 5001),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['comment']);
    });

    it('accepts comment of exactly 5000 characters', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 4,
            'comment' => str_repeat('B', 5000),
        ]);

        $response->assertStatus(201);
    });

    it('rejects non-integer rating', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 3.5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    });

    it('rejects string rating', function () {
        $response = $this->postJson("/api/v1/customer/merchants/{$this->merchant->id}/reviews", [
            'rating' => 'five',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    });

    it('validates reply is required for merchant reply', function () {
        $merchantUser = User::factory()->create();
        $merchantUser->assignRole('merchant');
        $merchant = Merchant::factory()->create([
            'user_id' => $merchantUser->id,
            'status' => 'active',
        ]);

        $review = Review::factory()->create([
            'merchant_id' => $merchant->id,
            'customer_id' => $this->customer->id,
        ]);

        Passport::actingAs($merchantUser);

        $response = $this->postJson("/api/v1/auth/merchant/reviews/{$review->id}/reply", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reply']);
    });

    it('validates admin_notes is required for admin notes update', function () {
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');
        Passport::actingAs($admin);

        $review = Review::factory()->create([
            'merchant_id' => $this->merchant->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->putJson("/api/v1/reviews/{$review->id}/notes", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['admin_notes']);
    });
});

/*
|--------------------------------------------------------------------------
| Authentication & Authorization
|--------------------------------------------------------------------------
*/
describe('Authentication & Authorization', function () {
    it('requires authentication for customer review creation', function () {
        app('auth')->forgetGuards();

        $response = $this->postJson('/api/v1/customer/merchants/1/reviews', [
            'rating' => 4,
        ]);

        $response->assertStatus(401);
    });

    it('requires authentication for customer review list', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson('/api/v1/customer/reviews');

        $response->assertStatus(401);
    });

    it('requires authentication for merchant review list', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson('/api/v1/auth/merchant/reviews');

        $response->assertStatus(401);
    });

    it('requires authentication for admin review list', function () {
        app('auth')->forgetGuards();

        $response = $this->getJson('/api/v1/reviews');

        $response->assertStatus(401);
    });

    it('customer without customer_portal.review permission cannot create review', function () {
        $user = User::factory()->create();
        // Assign a role that does NOT have customer_portal.review permission
        $user->assignRole('user');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/customer/merchants/1/reviews', [
            'rating' => 4,
        ]);

        $response->assertStatus(403);
    });
});
