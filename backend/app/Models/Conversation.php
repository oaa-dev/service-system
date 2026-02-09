<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function getOtherUser(int $userId): User
    {
        return $this->user_one_id === $userId ? $this->userTwo : $this->userOne;
    }

    public function getOtherUserId(int $userId): int
    {
        return $this->user_one_id === $userId ? $this->user_two_id : $this->user_one_id;
    }

    public function hasUser(int $userId): bool
    {
        return $this->user_one_id === $userId || $this->user_two_id === $userId;
    }

    public static function findBetweenUsers(int $userOneId, int $userTwoId): ?self
    {
        // Ensure consistent ordering
        [$first, $second] = $userOneId < $userTwoId
            ? [$userOneId, $userTwoId]
            : [$userTwoId, $userOneId];

        return static::where('user_one_id', $first)
            ->where('user_two_id', $second)
            ->first();
    }

    protected static function booted(): void
    {
        static::creating(function (Conversation $conversation) {
            // Ensure user_one_id < user_two_id for uniqueness constraint
            if ($conversation->user_one_id > $conversation->user_two_id) {
                [$conversation->user_one_id, $conversation->user_two_id] =
                    [$conversation->user_two_id, $conversation->user_one_id];
            }
        });

        static::created(function (Conversation $conversation) {
            // Create participant records for both users
            $conversation->participants()->createMany([
                ['user_id' => $conversation->user_one_id],
                ['user_id' => $conversation->user_two_id],
            ]);
        });
    }
}
