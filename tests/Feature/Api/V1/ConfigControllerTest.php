<?php

describe('Config Images', function () {
    it('can get image configuration', function () {
        $response = $this->getJson('/api/v1/config/images');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'avatar' => [
                        'mimes',
                        'max_size',
                        'min_width',
                        'min_height',
                        'max_width',
                        'max_height',
                        'recommendation',
                    ],
                    'document' => [
                        'mimes',
                        'max_size',
                        'recommendation',
                    ],
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Configuration retrieved successfully',
            ]);
    });

    it('returns correct avatar configuration values', function () {
        $response = $this->getJson('/api/v1/config/images');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'avatar' => [
                        'mimes' => ['jpeg', 'png', 'webp'],
                        'max_size' => 5120,
                        'min_width' => 100,
                        'min_height' => 100,
                        'max_width' => 4000,
                        'max_height' => 4000,
                    ],
                ],
            ]);
    });

    it('returns correct document configuration values', function () {
        $response = $this->getJson('/api/v1/config/images');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'document' => [
                        'mimes' => ['pdf', 'doc', 'docx'],
                        'max_size' => 10240,
                    ],
                ],
            ]);
    });

    it('is accessible without authentication', function () {
        $response = $this->getJson('/api/v1/config/images');

        $response->assertStatus(200);
    });
});
