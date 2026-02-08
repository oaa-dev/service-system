<?php

namespace App\Services\Contracts;

use App\Data\UserData;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserServiceInterface
{
    public function getAllUsers(array $filters = []): LengthAwarePaginator;

    public function getUserById(int $id): User;

    public function createUser(UserData $data): User;

    public function updateUser(int $id, UserData $data): User;

    public function deleteUser(int $id): bool;

    public function findByEmail(string $email): ?User;

    public function syncRoles(int $id, array $roles): User;
}
