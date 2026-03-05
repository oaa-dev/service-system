<?php

namespace App\Providers;

use App\Observers\NotificationObserver;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Super-admin bypasses all permission checks
        Gate::before(function ($user, $ability) {
            return $user->hasRole('super-admin') ? true : null;
        });

        // Register notification observer for real-time broadcasting
        DatabaseNotification::observe(NotificationObserver::class);

        // Morph map for polymorphic conversable relationship
        Relation::morphMap([
            'booking' => \App\Models\Booking::class,
            'reservation' => \App\Models\Reservation::class,
            'service_order' => \App\Models\ServiceOrder::class,
            'inquiry' => \App\Models\Merchant::class,
            'payment' => \App\Models\Payment::class,
        ]);
    }
}
