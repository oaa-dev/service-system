<?php

use App\Models\Address;
use App\Models\User;
use App\Models\UserProfile;

describe('HasAddress Trait', function () {
    it('can create address for a model', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $address = $profile->updateOrCreateAddress([
            'street' => '123 Main St',
            'city' => 'New York',
            'state' => 'NY',
            'postal_code' => '10001',
            'country' => 'United States',
        ]);

        expect($address)->toBeInstanceOf(Address::class);
        expect($address->street)->toBe('123 Main St');
        expect($address->city)->toBe('New York');
        expect($address->state)->toBe('NY');
        expect($address->postal_code)->toBe('10001');
        expect($address->country)->toBe('United States');
        expect($address->addressable_type)->toBe(UserProfile::class);
        expect($address->addressable_id)->toBe($profile->id);
    });

    it('can update existing address', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $profile->updateOrCreateAddress([
            'street' => '123 Main St',
            'city' => 'New York',
        ]);

        $updatedAddress = $profile->updateOrCreateAddress([
            'street' => '456 Oak Ave',
            'city' => 'Los Angeles',
        ]);

        expect($profile->address->fresh()->street)->toBe('456 Oak Ave');
        expect($profile->address->fresh()->city)->toBe('Los Angeles');
        expect(Address::where('addressable_id', $profile->id)->count())->toBe(1);
    });

    it('can check if model has address', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        expect($profile->hasAddress())->toBeFalse();

        $profile->updateOrCreateAddress([
            'city' => 'New York',
        ]);

        expect($profile->hasAddress())->toBeTrue();
    });

    it('can delete address', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $profile->updateOrCreateAddress([
            'city' => 'New York',
        ]);

        expect($profile->hasAddress())->toBeTrue();

        $result = $profile->deleteAddress();

        expect($result)->toBeTrue();
        expect($profile->fresh()->hasAddress())->toBeFalse();
    });

    it('returns false when deleting non-existent address', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $result = $profile->deleteAddress();

        expect($result)->toBeFalse();
    });

    it('morphOne relationship returns single address', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $profile->updateOrCreateAddress([
            'street' => '123 Main St',
            'city' => 'New York',
        ]);

        $address = $profile->address;

        expect($address)->toBeInstanceOf(Address::class);
        expect($address->city)->toBe('New York');
    });

    it('address belongs to addressable model', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $address = $profile->updateOrCreateAddress([
            'city' => 'New York',
        ]);

        expect($address->addressable)->toBeInstanceOf(UserProfile::class);
        expect($address->addressable->id)->toBe($profile->id);
    });
});

describe('Address Factory', function () {
    it('can create address using factory', function () {
        $user = User::factory()->create();
        $profile = $user->profile;

        $address = Address::factory()->create([
            'addressable_type' => UserProfile::class,
            'addressable_id' => $profile->id,
        ]);

        expect($address)->toBeInstanceOf(Address::class);
        expect($address->street)->not->toBeNull();
        expect($address->city)->not->toBeNull();
        expect($address->state)->not->toBeNull();
        expect($address->postal_code)->not->toBeNull();
        expect($address->country)->not->toBeNull();
    });
});
