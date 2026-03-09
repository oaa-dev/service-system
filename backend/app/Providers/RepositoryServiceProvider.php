<?php

namespace App\Providers;

use App\Repositories\AdvertisementRepository;
use App\Repositories\BookingRepository;
use App\Repositories\BusinessTypeRepository;
use App\Repositories\Contracts\AdvertisementRepositoryInterface;
use App\Repositories\Contracts\BookingRepositoryInterface;
use App\Repositories\Contracts\BusinessTypeRepositoryInterface;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\CouponRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\CustomerTagRepositoryInterface;
use App\Repositories\Contracts\DocumentTypeRepositoryInterface;
use App\Repositories\Contracts\FieldRepositoryInterface;
use App\Repositories\Contracts\LoyaltyCardRepositoryInterface;
use App\Repositories\Contracts\LoyaltyProgramRepositoryInterface;
use App\Repositories\Contracts\LoyaltyRewardRepositoryInterface;
use App\Repositories\Contracts\MerchantBookingSlotRepositoryInterface;
use App\Repositories\Contracts\MerchantRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PlatformFeeRepositoryInterface;
use App\Repositories\Contracts\ProfileRepositoryInterface;
use App\Repositories\Contracts\ReferralCodeRepositoryInterface;
use App\Repositories\Contracts\ReferralProgramRepositoryInterface;
use App\Repositories\Contracts\ReferralRepositoryInterface;
use App\Repositories\Contracts\ReferralRewardRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Repositories\Contracts\ReviewRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use App\Repositories\Contracts\SocialPlatformRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\ConversationRepository;
use App\Repositories\CouponRepository;
use App\Repositories\CustomerRepository;
use App\Repositories\CustomerTagRepository;
use App\Repositories\DocumentTypeRepository;
use App\Repositories\FieldRepository;
use App\Repositories\LoyaltyCardRepository;
use App\Repositories\LoyaltyProgramRepository;
use App\Repositories\LoyaltyRewardRepository;
use App\Repositories\MerchantBookingSlotRepository;
use App\Repositories\MerchantRepository;
use App\Repositories\MessageRepository;
use App\Repositories\PaymentMethodRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\PlatformFeeRepository;
use App\Repositories\ProfileRepository;
use App\Repositories\ReferralCodeRepository;
use App\Repositories\ReferralProgramRepository;
use App\Repositories\ReferralRepository;
use App\Repositories\ReferralRewardRepository;
use App\Repositories\ReservationRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\RoleRepository;
use App\Repositories\ServiceOrderRepository;
use App\Repositories\SocialPlatformRepository;
use App\Repositories\UserRepository;
use App\Services\AdvertisementService;
use App\Services\BookingService;
use App\Services\BusinessTypeService;
use App\Services\Contracts\AdvertisementServiceInterface;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\BusinessTypeServiceInterface;
use App\Services\Contracts\ConversationServiceInterface;
use App\Services\Contracts\CouponServiceInterface;
use App\Services\Contracts\CustomerPortalServiceInterface;
use App\Services\Contracts\CustomerServiceInterface;
use App\Services\Contracts\CustomerTagServiceInterface;
use App\Services\Contracts\DocumentTypeServiceInterface;
use App\Services\Contracts\EmailVerificationServiceInterface;
use App\Services\Contracts\FieldServiceInterface;
use App\Services\Contracts\LoyaltyProgramServiceInterface;
use App\Services\Contracts\LoyaltyServiceInterface;
use App\Services\Contracts\MerchantBookingSlotServiceInterface;
use App\Services\Contracts\MerchantServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Services\Contracts\PaymentMethodServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\PayMongoServiceInterface;
use App\Services\Contracts\PlatformFeeServiceInterface;
use App\Services\Contracts\ProfileServiceInterface;
use App\Services\Contracts\ReferralProgramServiceInterface;
use App\Services\Contracts\ReferralServiceInterface;
use App\Services\Contracts\ReservationServiceInterface;
use App\Services\Contracts\ReviewServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use App\Services\Contracts\ServiceCategoryServiceInterface;
use App\Services\Contracts\ServiceOrderServiceInterface;
use App\Services\Contracts\SocialPlatformServiceInterface;
use App\Services\Contracts\StorefrontServiceInterface;
use App\Services\Contracts\UserServiceInterface;
use App\Services\ConversationService;
use App\Services\CouponService;
use App\Services\CustomerPortalService;
use App\Services\CustomerService;
use App\Services\CustomerTagService;
use App\Services\DocumentTypeService;
use App\Services\EmailVerificationService;
use App\Services\FieldService;
use App\Services\LoyaltyProgramService;
use App\Services\LoyaltyService;
use App\Services\MerchantBookingSlotService;
use App\Services\MerchantService;
use App\Services\NotificationService;
use App\Services\PaymentMethodService;
use App\Services\PaymentService;
use App\Services\PayMongoService;
use App\Services\PlatformFeeService;
use App\Services\ProfileService;
use App\Services\ReferralProgramService;
use App\Services\ReferralService;
use App\Services\ReservationService;
use App\Services\ReviewService;
use App\Services\RoleService;
use App\Services\ServiceCategoryService;
use App\Services\ServiceOrderService;
use App\Services\SocialPlatformService;
use App\Services\StorefrontService;
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
        ConversationServiceInterface::class => ConversationService::class,
        MessageRepositoryInterface::class => MessageRepository::class,
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
        CustomerTagRepositoryInterface::class => CustomerTagRepository::class,
        CustomerTagServiceInterface::class => CustomerTagService::class,
        CustomerRepositoryInterface::class => CustomerRepository::class,
        CustomerServiceInterface::class => CustomerService::class,
        BookingRepositoryInterface::class => BookingRepository::class,
        BookingServiceInterface::class => BookingService::class,
        ReservationRepositoryInterface::class => ReservationRepository::class,
        ReservationServiceInterface::class => ReservationService::class,
        ServiceOrderRepositoryInterface::class => ServiceOrderRepository::class,
        ServiceOrderServiceInterface::class => ServiceOrderService::class,
        PlatformFeeRepositoryInterface::class => PlatformFeeRepository::class,
        PlatformFeeServiceInterface::class => PlatformFeeService::class,
        FieldRepositoryInterface::class => FieldRepository::class,
        FieldServiceInterface::class => FieldService::class,
        EmailVerificationServiceInterface::class => EmailVerificationService::class,
        StorefrontServiceInterface::class => StorefrontService::class,
        CustomerPortalServiceInterface::class => CustomerPortalService::class,
        ReviewRepositoryInterface::class => ReviewRepository::class,
        ReviewServiceInterface::class => ReviewService::class,
        MerchantBookingSlotRepositoryInterface::class => MerchantBookingSlotRepository::class,
        MerchantBookingSlotServiceInterface::class => MerchantBookingSlotService::class,
        LoyaltyProgramRepositoryInterface::class => LoyaltyProgramRepository::class,
        LoyaltyProgramServiceInterface::class => LoyaltyProgramService::class,
        LoyaltyCardRepositoryInterface::class => LoyaltyCardRepository::class,
        LoyaltyRewardRepositoryInterface::class => LoyaltyRewardRepository::class,
        LoyaltyServiceInterface::class => LoyaltyService::class,
        ReferralProgramRepositoryInterface::class => ReferralProgramRepository::class,
        ReferralCodeRepositoryInterface::class => ReferralCodeRepository::class,
        ReferralRepositoryInterface::class => ReferralRepository::class,
        ReferralRewardRepositoryInterface::class => ReferralRewardRepository::class,
        ReferralProgramServiceInterface::class => ReferralProgramService::class,
        ReferralServiceInterface::class => ReferralService::class,
        PaymentRepositoryInterface::class => PaymentRepository::class,
        PaymentServiceInterface::class => PaymentService::class,
        PayMongoServiceInterface::class => PayMongoService::class,
        CouponRepositoryInterface::class => CouponRepository::class,
        CouponServiceInterface::class => CouponService::class,
        AdvertisementRepositoryInterface::class => AdvertisementRepository::class,
        AdvertisementServiceInterface::class => AdvertisementService::class,
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
