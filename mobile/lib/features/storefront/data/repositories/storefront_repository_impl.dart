import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/booking_availability_entity.dart';
import '../../domain/entities/merchant_entity.dart';
import '../../domain/entities/service_entity.dart';
import '../../domain/repositories/storefront_repository.dart';
import '../datasources/storefront_remote_data_source.dart';
import '../models/booking_availability_model.dart';
import '../models/business_hours_model.dart';
import '../models/merchant_model.dart';
import '../models/service_model.dart';

@LazySingleton(as: StorefrontRepository)
class StorefrontRepositoryImpl implements StorefrontRepository {
  final StorefrontRemoteDataSource _remote;

  const StorefrontRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, MerchantsResult>> getMerchants({
    String? query,
    double? lat,
    double? lng,
    double? radius,
    int page = 1,
  }) async {
    final result = await _remote.getMerchants(
      query: query,
      lat: lat,
      lng: lng,
      radius: radius,
      page: page,
    );
    return result.map((json) {
      final dataList = json['data'] as List<dynamic>;
      final merchants = dataList
          .map((item) => _toEntity(
              MerchantModel.fromJson(item as Map<String, dynamic>)))
          .toList();

      final meta = json['meta'] as Map<String, dynamic>?;

      final currentPage = (meta?['current_page'] as num?)?.toInt() ?? 1;
      final lastPage = (meta?['last_page'] as num?)?.toInt() ?? 1;
      final total = (meta?['total'] as num?)?.toInt() ?? merchants.length;

      return MerchantsResult(
        merchants: merchants,
        currentPage: currentPage,
        lastPage: lastPage,
        total: total,
      );
    });
  }

  @override
  Future<Either<Failure, MerchantEntity>> getMerchantBySlug(
      String slug) async {
    final result = await _remote.getMerchantBySlug(slug);
    return result.map(_toEntity);
  }

  @override
  Future<Either<Failure, List<ServiceEntity>>> getMerchantServices(
      String slug) async {
    final result = await _remote.getMerchantServices(slug);
    return result.map(
      (models) => models.map(_toServiceEntity).toList(),
    );
  }

  MerchantEntity _toEntity(MerchantModel model) {
    return MerchantEntity(
      id: model.id,
      name: model.name,
      slug: model.slug,
      type: model.type,
      status: model.status,
      logoUrl: model.logoUrl,
      logoThumb: model.logoThumb,
      description: model.description,
      averageRating: model.averageRating,
      reviewCount: model.reviewCount,
      childrenCount: model.childrenCount,
      parentId: model.parentId,
      isFavorited: model.isFavorited,
      canSellProducts: model.canSellProducts,
      canTakeBookings: model.canTakeBookings,
      canRentUnits: model.canRentUnits,
      distance: model.distance,
      address: model.address != null
          ? MerchantAddress(
              street: model.address!.street,
              city: model.address!.cityName,
              province: model.address!.provinceName,
              region: model.address!.regionName,
              barangay: model.address!.barangayName,
              latitude: model.address!.latitude,
              longitude: model.address!.longitude,
            )
          : null,
      businessHours: model.businessHours
          ?.map(_toBusinessHoursEntity)
          .toList(),
    );
  }

  BusinessHoursEntity _toBusinessHoursEntity(BusinessHoursModel model) {
    return BusinessHoursEntity(
      dayOfWeek: model.dayOfWeek,
      isOpen: model.isOpen,
      openTime: model.openTime,
      closeTime: model.closeTime,
    );
  }

  @override
  Future<Either<Failure, BookingAvailabilityEntity>> getBookingAvailability({
    required String slug,
    required int serviceId,
    required String date,
  }) async {
    final result =
        await _remote.getBookingAvailability(slug, serviceId, date);
    return result.map(_toAvailabilityEntity);
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> createBooking({
    required String slug,
    required Map<String, dynamic> data,
  }) async {
    return _remote.createBooking(slug, data);
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> createReservation({
    required String slug,
    required Map<String, dynamic> data,
  }) async {
    return _remote.createReservation(slug, data);
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> createOrder({
    required String slug,
    required Map<String, dynamic> data,
  }) async {
    return _remote.createOrder(slug, data);
  }

  BookingAvailabilityEntity _toAvailabilityEntity(
      BookingAvailabilityModel model) {
    return BookingAvailabilityEntity(
      date: model.date,
      hasSlots: model.hasSlots,
      slots: model.slots.map(_toSlotEntity).toList(),
    );
  }

  BookingSlotEntity _toSlotEntity(BookingSlotModel model) {
    return BookingSlotEntity(
      slotId: model.slotId,
      startTime: model.startTime,
      endTime: model.endTime,
      booked: model.booked,
      available: model.available,
      maxCapacity: model.maxCapacity,
      isFull: model.isFull,
    );
  }

  ServiceEntity _toServiceEntity(ServiceModel model) {
    return ServiceEntity(
      id: model.id,
      name: model.name,
      slug: model.slug,
      description: model.description,
      price: model.price,
      isActive: model.isActive,
      isBookable: model.isBookable,
      isSellable: model.isSellable,
      isReservable: model.isReservable,
      duration: model.duration,
      imageUrl: model.imageUrl,
    );
  }
}
