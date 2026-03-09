import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_availability_entity.dart';
import '../repositories/storefront_repository.dart';

@lazySingleton
class GetBookingAvailabilityUseCase {
  final StorefrontRepository _repository;

  const GetBookingAvailabilityUseCase(this._repository);

  Future<Either<Failure, BookingAvailabilityEntity>> call({
    required String slug,
    required int serviceId,
    required String date,
  }) {
    return _repository.getBookingAvailability(
        slug: slug, serviceId: serviceId, date: date);
  }
}
