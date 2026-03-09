import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_availability_entity.dart';
import '../entities/merchant_entity.dart';
import '../entities/service_entity.dart';

class MerchantsResult {
  final List<MerchantEntity> merchants;
  final int currentPage;
  final int lastPage;
  final int total;

  const MerchantsResult({
    required this.merchants,
    required this.currentPage,
    required this.lastPage,
    required this.total,
  });

  bool get hasMore => currentPage < lastPage;
}

abstract class StorefrontRepository {
  Future<Either<Failure, MerchantsResult>> getMerchants({
    String? query,
    double? lat,
    double? lng,
    double? radius,
    int page = 1,
  });

  Future<Either<Failure, MerchantEntity>> getMerchantBySlug(String slug);

  Future<Either<Failure, List<ServiceEntity>>> getMerchantServices(String slug);

  Future<Either<Failure, BookingAvailabilityEntity>> getBookingAvailability({
    required String slug,
    required int serviceId,
    required String date,
  });

  Future<Either<Failure, Map<String, dynamic>>> createBooking({
    required String slug,
    required Map<String, dynamic> data,
  });

  Future<Either<Failure, Map<String, dynamic>>> createReservation({
    required String slug,
    required Map<String, dynamic> data,
  });

  Future<Either<Failure, Map<String, dynamic>>> createOrder({
    required String slug,
    required Map<String, dynamic> data,
  });
}
