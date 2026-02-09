<?php

namespace App\Providers;

use App\Repositories\BusinessTypeRepository;
use App\Repositories\Contracts\BusinessTypeRepositoryInterface;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Repositories\Contracts\DocumentTypeRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Repositories\Contracts\ProfileRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\SocialPlatformRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\ConversationRepository;
use App\Repositories\MerchantRepository;
use App\Repositories\DocumentTypeRepository;
use App\Repositories\MessageRepository;
use App\Repositories\PaymentMethodRepository;
use App\Repositories\ProfileRepository;
use App\Repositories\RoleRepository;
use App\Repositories\SocialPlatformRepository;
use App\Repositories\UserRepository;
use App\Services\BusinessTypeService;
use App\Services\Contracts\BusinessTypeServiceInterface;
use App\Services\Contracts\DocumentTypeServiceInterface;
use App\Services\Contracts\ServiceCategoryServiceInterface;
use App\Services\Contracts\MerchantServiceInterface;
use App\Services\Contracts\MessagingServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Services\Contracts\PaymentMethodServiceInterface;
use App\Services\Contracts\ProfileServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use App\Services\Contracts\SocialPlatformServiceInterface;
use App\Services\Contracts\UserServiceInterface;
use App\Services\DocumentTypeService;
use App\Services\ServiceCategoryService;
use App\Services\MerchantService;
use App\Services\MessagingService;
use App\Services\NotificationService;
use App\Services\PaymentMethodService;
use App\Services\ProfileService;
use App\Services\RoleService;
use App\Services\SocialPlatformService;
use App\Services\UserService;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public array $bindings = [
        UserRepositoryInterface::class => UserRepository::class,
        UserServiceInterface::class => UserService::class,
        ProfileRepositoryInterface::class => ProfileRepository::class,
        ProfileServiceInterface::class => ProfileService::class,
        RoleRepositoryInterface::class => RoleRepository::class,
        RoleServiceInterface::class => RoleService::class,
        NotificationServiceInterface::class => NotificationService::class,
        ConversationRepositoryInterface::class => ConversationRepository::class,
        MessageRepositoryInterface::class => MessageRepository::class,
        MessagingServiceInterface::class => MessagingService::class,
        PaymentMethodRepositoryInterface::class => PaymentMethodRepository::class,
        PaymentMethodServiceInterface::class => PaymentMethodService::class,
        DocumentTypeRepositoryInterface::class => DocumentTypeRepository::class,
        DocumentTypeServiceInterface::class => DocumentTypeService::class,
        BusinessTypeRepositoryInterface::class => BusinessTypeRepository::class,
        BusinessTypeServiceInterface::class => BusinessTypeService::class,
        SocialPlatformRepositoryInterface::class => SocialPlatformRepository::class,
        SocialPlatformServiceInterface::class => SocialPlatformService::class,
        ServiceCategoryServiceInterface::class => ServiceCategoryService::class,
        MerchantRepositoryInterface::class => MerchantRepository::class,
        MerchantServiceInterface::class => MerchantService::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
