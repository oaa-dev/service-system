<?php

use App\Models\Customer;
use App\Models\CustomerTag;
use App\Models\User;
use Laravel\Passport\Passport;

describe('Customer Self-Service', function () {
    it('can get own customer profile', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $customer = Customer::factory()->create(['user_id' => $user->id]);
        $tag = CustomerTag::factory()->create();
        $customer->tags()->attach($tag);
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/profile/customer');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $customer->id,
                    'customer_type' => $customer->customer_type,
                    'status' => $customer->status,
                ],
            ]);
    });

    it('can update own preferences', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        Customer::factory()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile/customer', [
            'preferred_payment_method' => 'e-wallet',
            'communication_preference' => 'email',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'preferred_payment_method' => 'e-wallet',
                    'communication_preference' => 'email',
                ],
            ]);
    });

    it('cannot update restricted fields via self-service', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        Customer::factory()->create([
            'user_id' => $user->id,
            'customer_tier' => 'regular',
            'loyalty_points' => 0,
            'customer_notes' => 'Original notes',
        ]);
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile/customer', [
            'customer_tier' => 'platinum',
            'loyalty_points' => 9999,
            'status' => 'banned',
            'customer_notes' => 'Hacked notes',
            'preferred_payment_method' => 'card',
        ]);

        $response->assertStatus(200);

        $customer = Customer::where('user_id', $user->id)->first();
        expect($customer->customer_tier)->toBe('regular');
        expect($customer->loyalty_points)->toBe(0);
        expect($customer->status)->toBe('active');
        expect($customer->customer_notes)->toBe('Original notes');
        expect($customer->preferred_payment_method)->toBe('card');
    });

    it('returns 404 when customer profile does not exist', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/profile/customer');

        $response->assertStatus(404);
    });

    it('rejects unauthenticated access', function () {
        $response = $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/profile/customer');

        $response->assertStatus(401);
    });

    it('validates preference enum values', function () {
        $user = User::factory()->create();
        $user->assignRole('customer');
        Customer::factory()->create(['user_id' => $user->id]);
        Passport::actingAs($user);

        $response = $this->putJson('/api/v1/profile/customer', [
            'preferred_payment_method' => 'bitcoin',
            'communication_preference' => 'telepathy',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preferred_payment_method', 'communication_preference']);
    });
});
